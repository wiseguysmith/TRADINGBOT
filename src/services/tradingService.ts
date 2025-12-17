import { KrakenWrapper } from './krakenWrapper';
import { calculateMACD, calculateRSI, calculateBollingerBands } from '../utils/indicators';
import { NotificationService, NotificationType } from './notificationService';
import { StrategyService } from './strategyService';
import { CONFIG } from '../config';

interface Position {
  symbol: string;
  size: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
}

interface TradeConfig {
  maxDrawdown: number;
  riskPerTrade: number;
  volatilityPeriod: number;
}

interface Balance {
  [key: string]: number;
}

export class TradingService {
  private client: KrakenWrapper;
  private positions: Map<string, Position>;
  private config: TradeConfig;
  private notificationService: NotificationService;
  private strategyService: StrategyService;
  private autoTradeInterval: NodeJS.Timeout | null = null;

  constructor(
    apiKey: string, 
    apiSecret: string,
    notificationService: NotificationService
  ) {
    this.client = new KrakenWrapper(apiKey, apiSecret);
    this.positions = new Map();
    this.config = {
      maxDrawdown: CONFIG.MAX_DRAWDOWN_PERCENTAGE,
      riskPerTrade: CONFIG.RISK_PER_TRADE_PERCENTAGE,
      volatilityPeriod: CONFIG.VOLATILITY_LOOKBACK_PERIOD
    };
    this.notificationService = notificationService;
    this.strategyService = new StrategyService(this.client);
  }

  async getOHLC(symbol: string) {
    try {
      const response = await this.client.getOHLCData(symbol);
      if (response.error && response.error.length > 0) {
        throw new Error(response.error.join(', '));
      }

      const pairData = Object.values(response.result)[0];
      if (!Array.isArray(pairData)) {
        throw new Error('Invalid OHLC data format');
      }

      return pairData.map(candle => ({
        time: new Date(Number(candle[0]) * 1000).toISOString().split('T')[0],
        open: Number(candle[1]),
        high: Number(candle[2]),
        low: Number(candle[3]),
        close: Number(candle[4]),
        volume: Number(candle[6])
      }));
    } catch (error) {
      console.error('Error fetching OHLC data:', error);
      return [];
    }
  }

  async checkArbitrageOpportunities() {
    try {
      const pairs = await this.client.getTradablePairs();
      const prices = await this.client.getTickerInformation(Object.keys(pairs.result));

      // Simple triangular arbitrage check
      for (const basePair of Object.keys(prices.result)) {
        const opportunities = this.findArbitrageOpportunities(basePair, prices.result);
        for (const opp of opportunities) {
          console.log(`💰 Arbitrage opportunity: ${opp.path.join(' -> ')} - ${opp.profitPercent.toFixed(2)}% profit`);
        }
      }
    } catch (error) {
      console.error('Error checking arbitrage opportunities:', error);
    }
  }

  private findArbitrageOpportunities(basePair: string, prices: any) {
    // Implement triangular arbitrage logic here
    return [];
  }

  async placeOrder(
    symbol: string,
    side: 'buy' | 'sell',
    size: number,
    stopLossPercent: number,
    takeProfitPercent: number
  ): Promise<void> {
    try {
      const ticker = await this.client.getTickerInformation([symbol]);
      const currentPrice = parseFloat(ticker.result[symbol].c[0]);
      
      const stopLossPrice = side === 'buy' 
        ? currentPrice * (1 - stopLossPercent / 100)
        : currentPrice * (1 + stopLossPercent / 100);
      
      const takeProfitPrice = side === 'buy'
        ? currentPrice * (1 + takeProfitPercent / 100)
        : currentPrice * (1 - takeProfitPercent / 100);

      const order = await this.client.addOrder({
        pair: symbol,
        type: side,
        ordertype: 'market',
        volume: size.toString()
      });

      if (side === 'buy') {
        const position: Position = {
          symbol,
          size,
          entryPrice: currentPrice,
          stopLoss: stopLossPrice,
          takeProfit: takeProfitPrice
        };
        this.positions.set(symbol, position);
        await this.notificationService.notifyTradeExecution(symbol, 'buy', size, currentPrice);
      } else {
        this.positions.delete(symbol);
        await this.notificationService.notifyTradeExecution(symbol, 'sell', size, currentPrice);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }

  getPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  async analyzeTrend(symbol: string): Promise<{
    macd: any;
    rsi: number;
    bollingerBands: any;
  }> {
    const ohlc = await this.client.getOHLCData(symbol);
    const ohlcData = ohlc.result[symbol] || [];
    const closes = ohlcData.map(candle => parseFloat(candle[4]));

    return {
      macd: calculateMACD(closes),
      rsi: calculateRSI(closes),
      bollingerBands: calculateBollingerBands(closes)
    };
  }

  async calculatePositionSize(symbol: string, price: number): Promise<number> {
    const balance = await this.client.getBalance() as Balance;
    const portfolioValue = Object.values(balance).reduce((acc: number, curr: number) => acc + curr, 0);
    const riskAmount = portfolioValue * (this.config.riskPerTrade / 100);
    
    // Calculate ATR for volatility-based position sizing
    const ohlc = await this.client.getOHLCData(symbol);
    const ohlcData = ohlc.result[symbol] || [];
    const atr = this.calculateATR(ohlcData);
    
    return riskAmount / atr;
  }

  private calculateATR(ohlc: any[]): number {
    // Implement ATR calculation
    return 0; // Placeholder
  }

  async startAutoTrading() {
    if (this.autoTradeInterval) return;

    this.autoTradeInterval = setInterval(async () => {
      if (!this.strategyService.getConfig().enabled) return;

      try {
        // Check arbitrage opportunities
        const arbitrage = await this.strategyService.checkArbitrageOpportunities();
        if (arbitrage.shouldTrade && arbitrage.symbol && arbitrage.profit && arbitrage.route) {
          await this.executeArbitrageTrade({
            symbol: arbitrage.symbol,
            profit: arbitrage.profit,
            route: arbitrage.route
          });
        }

        // Check trend following opportunities for each symbol
        const symbols = ['BTC/USD', 'ETH/USD', 'XRP/USD'];
        for (const symbol of symbols) {
          const trend = await this.strategyService.checkTrendFollowing(symbol);
          if (trend.shouldTrade) {
            await this.executeTrendTrade(symbol, trend.action!, trend.reason!);
          }
        }
      } catch (error) {
        console.error('Auto trading error:', error);
        await this.notificationService.sendNotification(
          NotificationType.SYSTEM_ALERT,
          'Auto Trading Error',
          `Auto trading error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }, 60000); // Check every minute
  }

  async stopAutoTrading() {
    if (this.autoTradeInterval) {
      clearInterval(this.autoTradeInterval);
      this.autoTradeInterval = null;
    }
  }

  private async executeArbitrageTrade(opportunity: { symbol: string; profit: number; route: string[] }) {
    try {
      await this.notificationService.notifyArbitrageOpportunity(
        opportunity.route,
        opportunity.profit,
        0 // gasFees placeholder
      );

      // Execute the arbitrage trades
      for (const symbol of opportunity.route) {
        await this.placeOrder(
          symbol,
          'buy',
          this.strategyService.getConfig().maxInvestment,
          this.config.maxDrawdown,
          opportunity.profit
        );
      }
    } catch (error) {
      console.error('Arbitrage execution error:', error);
      throw error;
    }
  }

  private async executeTrendTrade(symbol: string, action: 'buy' | 'sell', reason: string) {
    try {
      const config = this.strategyService.getConfig();
      await this.placeOrder(
        symbol,
        action,
        config.maxInvestment,
        this.config.maxDrawdown,
        config.minProfitPercent
      );

      await this.notificationService.sendNotification(
        NotificationType.TRADE_EXECUTION,
        `Auto ${action.toUpperCase()} ${symbol}`,
        `Auto ${action.toUpperCase()} ${symbol} - ${reason}`
      );
    } catch (error) {
      console.error('Trend trade execution error:', error);
      throw error;
    }
  }

  private async executeTrade(
    symbol: string,
    action: 'buy' | 'sell',
    amount: number,
    isTest: boolean = true
  ): Promise<void> {
    try {
      if (isTest) {
        // Simulate trade in test mode
        console.log(`TEST MODE: ${action} ${amount} ${symbol}`);
        await this.notificationService.sendNotification(
          NotificationType.TRADE_EXECUTION,
          `TEST TRADE: ${action.toUpperCase()} ${amount} ${symbol}`,
          `TEST TRADE: ${action.toUpperCase()} ${amount} ${symbol}`
        );
        return;
      }

      // Real trading logic here
      const order = await this.client.addOrder({
        pair: symbol,
        type: action,
        ordertype: 'market',
        volume: amount.toString()
      });

      await this.notificationService.sendNotification(
        NotificationType.TRADE_EXECUTION,
        `LIVE TRADE: ${action.toUpperCase()} ${amount} ${symbol}`,
        `LIVE TRADE: ${action.toUpperCase()} ${amount} ${symbol}`
      );
    } catch (error) {
      console.error('Trade execution error:', error);
      throw error;
    }
  }
} 