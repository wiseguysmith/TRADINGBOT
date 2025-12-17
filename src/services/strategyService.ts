import { KrakenWrapper } from './krakenWrapper';
import { calculateMACD, calculateRSI, calculateBollingerBands, calculateEMA } from '../utils/indicators';
import { 
  meanReversionStrategy, 
  trendFollowingStrategy, 
  calculateGridLevels,
  findCrossExchangeArbitrage,
  volatilityBreakoutStrategy,
  ExchangePriceData
} from '../utils/strategies';
import { NotificationService, NotificationType } from './notificationService';
import { PricePredictionModel } from '../utils/mlModel';
import { blendSignals, checkQuantTradeBlock } from './quant/quantIntegration';

interface StrategyConfig {
  maxInvestment: number;        // $20 maximum risk per trade (20% of $100)
  portfolioRiskPercent: number; // 20% of portfolio per trade
  maxDailyLoss: number;        // $25 maximum daily loss (25% of $100)
  minProfitPerTrade: number;   // $5 minimum profit target
  minProfitPercent: number;    // Minimum profit percentage for arbitrage
  rsiOversold: number;         // RSI threshold for oversold condition
  rsiOverbought: number;       // RSI threshold for overbought condition
  enabled: boolean;            // Trading enabled/disabled flag
  tradingMode: 'test' | 'live';
  enabledStrategies: {
    trendFollowing: boolean;
    meanReversion: boolean;
    arbitrage: boolean;
    gridTrading: boolean;
    volatilityBreakout: boolean;
  };
  dailyStats: {
    totalTrades: number;
    profit: number;
    loss: number;
    lastReset: Date;
  };
}

export class StrategyService {
  private client: KrakenWrapper;
  private notificationService: NotificationService;
  private config: StrategyConfig = {
    maxInvestment: 20,        // $20 max per trade (20% of $100)
    portfolioRiskPercent: 20, // 20% of portfolio per trade
    maxDailyLoss: 25,         // $25 max daily loss (25% of $100)
    minProfitPerTrade: 5,     // $5 minimum profit target
    minProfitPercent: 0.8,    // 0.8% minimum profit for arbitrage (more realistic)
    rsiOversold: 30,          // RSI below 30 is considered oversold
    rsiOverbought: 70,        // RSI above 70 is considered overbought
    enabled: false,           // Start with trading disabled
    tradingMode: 'test',
    enabledStrategies: {
      trendFollowing: true,
      meanReversion: true,
      arbitrage: true,
      gridTrading: false,
      volatilityBreakout: false
    },
    dailyStats: {
      totalTrades: 0,
      profit: 0,
      loss: 0,
      lastReset: new Date()
    }
  };
  private isTrading: boolean = false;
  private activeGridLevels: Map<string, {
    buyLevels: Array<{ price: number; allocation: number }>;
    sellLevels: Array<{ price: number; allocation: number }>;
  }> = new Map();
  private predictionModel: PricePredictionModel;

  constructor(client: KrakenWrapper, notificationService?: NotificationService) {
    this.client = client;
    this.notificationService = notificationService || new NotificationService();
    this.predictionModel = new PricePredictionModel();
  }

  async checkArbitrageOpportunities(): Promise<{
    shouldTrade: boolean;
    symbol?: string;
    profit?: number;
    route?: string[];
  }> {
    if (!this.config.enabled || !this.config.enabledStrategies.arbitrage) {
      return { shouldTrade: false };
    }
    
    try {
      const pairs = await this.client.getTradablePairs();
      const prices = await this.client.getTickerInformation(Object.keys(pairs));

      // Find triangular arbitrage opportunities
      const opportunities = this.findTriangularArbitrage(prices.result);
      
      if (opportunities.length > 0) {
        const bestOpportunity = opportunities[0];
        if (bestOpportunity.profit > this.config.minProfitPercent) {
          // Notify about the arbitrage opportunity
          await this.notificationService.notifyArbitrageOpportunity(
            bestOpportunity.route,
            bestOpportunity.profit,
            0.5 // Estimated fees
          );
          
          return {
            shouldTrade: true,
            symbol: bestOpportunity.symbols[0],
            profit: bestOpportunity.profit,
            route: bestOpportunity.route
          };
        }
      }

      return { shouldTrade: false };
    } catch (error) {
      console.error('Error checking arbitrage:', error);
      return { shouldTrade: false };
    }
  }

  async checkCrossExchangeArbitrage(
    exchangeData: ExchangePriceData[],
    tradeAmount: number = 1000
  ): Promise<{
    shouldTrade: boolean;
    opportunities?: Array<{
      buyExchange: string;
      sellExchange: string;
      symbol: string;
      profitPercent: number;
      estimatedProfit: number;
    }>;
  }> {
    if (!this.config.enabled || !this.config.enabledStrategies.arbitrage) {
      return { shouldTrade: false };
    }
    
    try {
      const opportunities = findCrossExchangeArbitrage(
        exchangeData,
        this.config.minProfitPercent,
        tradeAmount
      );
      
      if (opportunities.length > 0) {
        // Notify about the best opportunity
        const bestOpp = opportunities[0];
        await this.notificationService.notifyArbitrageOpportunity(
          [`${bestOpp.symbol}: ${bestOpp.buyExchange} → ${bestOpp.sellExchange}`],
          bestOpp.profitPercent,
          bestOpp.totalFees
        );
        
        return {
          shouldTrade: true,
          opportunities: opportunities.map(opp => ({
            buyExchange: opp.buyExchange,
            sellExchange: opp.sellExchange,
            symbol: opp.symbol,
            profitPercent: opp.profitPercent,
            estimatedProfit: opp.estimatedProfit
          }))
        };
      }
      
      return { shouldTrade: false };
    } catch (error) {
      console.error('Error checking cross-exchange arbitrage:', error);
      return { shouldTrade: false };
    }
  }

  async checkTrendFollowing(symbol: string): Promise<{
    shouldTrade: boolean;
    action?: 'buy' | 'sell';
    reason?: string;
    confidence?: number;
  }> {
    if (!this.config.enabled || !this.config.enabledStrategies.trendFollowing) {
      return { shouldTrade: false };
    }
    
    try {
      const ohlc = await this.client.getOHLCData(symbol);
      const candles = Object.values(ohlc.result)[0];
      const closes = candles.map(candle => parseFloat(candle[4]));
      const volumes = candles.map(candle => parseFloat(candle[5]));
      
      const result = trendFollowingStrategy(
        closes,
        volumes,
        9,  // shortEMA
        21, // longEMA
        10  // volumeEMA
      );
      
      if (result.action !== 'hold' && result.confidence >= 0.5) {
        // Check if quant signal blocks this trade
        const blockReason = await checkQuantTradeBlock(symbol, result.action);
        if (blockReason) {
          console.log(`[QUANT] Trade blocked: ${blockReason} for ${symbol}`);
          return { shouldTrade: false };
        }
        
        // Blend with quant signal
        const technicalSignal = result.action === 'buy' ? result.confidence : -result.confidence;
        const blendedSignal = await blendSignals(symbol, technicalSignal);
        
        // Convert blended signal back to action
        const finalAction = blendedSignal > 0.2 ? 'buy' : blendedSignal < -0.2 ? 'sell' : 'hold';
        
        if (finalAction === 'hold') {
          return { shouldTrade: false };
        }
        
        // Notify about the trading opportunity
        await this.notificationService.notifyTradeOpportunity(
          symbol,
          finalAction,
          `${result.signals.join(', ')}, Quant blended: ${blendedSignal.toFixed(3)}`
        );
        
        const predictedPrice = this.predictionModel.predict(closes[closes.length - 1]);
        console.log(`Predicted price for ${symbol}: $${predictedPrice.toFixed(2)}`);
        
        return {
          shouldTrade: true,
          action: finalAction,
          reason: `${result.signals.join(', ')}, Quant: ${blendedSignal.toFixed(3)}`,
          confidence: Math.abs(blendedSignal)
        };
      }
      
      return { shouldTrade: false };
    } catch (error) {
      console.error('Error checking trend following strategy:', error);
      return { shouldTrade: false };
    }
  }

  async checkMeanReversion(symbol: string): Promise<{
    shouldTrade: boolean;
    action?: 'buy' | 'sell';
    reason?: string;
    confidence?: number;
  }> {
    if (!this.config.enabled || !this.config.enabledStrategies.meanReversion) {
      return { shouldTrade: false };
    }
    
    try {
      const ohlc = await this.client.getOHLCData(symbol);
      const candles = Object.values(ohlc.result)[0];
      const closes = candles.map(candle => parseFloat(candle[4]));
      
      const result = meanReversionStrategy(
        closes,
        14, // rsiPeriod
        this.config.rsiOversold,
        this.config.rsiOverbought,
        20, // bbPeriod
        2   // bbStdDev
      );
      
      if (result.action !== 'hold' && result.confidence >= 0.5) {
        // Check if quant signal blocks this trade
        const blockReason = await checkQuantTradeBlock(symbol, result.action);
        if (blockReason) {
          console.log(`[QUANT] Trade blocked: ${blockReason} for ${symbol}`);
          return { shouldTrade: false };
        }
        
        // Blend with quant signal
        const technicalSignal = result.action === 'buy' ? result.confidence : -result.confidence;
        const blendedSignal = await blendSignals(symbol, technicalSignal);
        
        // Convert blended signal back to action
        const finalAction = blendedSignal > 0.2 ? 'buy' : blendedSignal < -0.2 ? 'sell' : 'hold';
        
        if (finalAction === 'hold') {
          return { shouldTrade: false };
        }
        
        // Notify about the trading opportunity
        await this.notificationService.notifyTradeOpportunity(
          symbol,
          finalAction,
          `${result.signals.join(', ')}, Quant blended: ${blendedSignal.toFixed(3)}`
        );
        
        return {
          shouldTrade: true,
          action: finalAction,
          reason: `${result.signals.join(', ')}, Quant: ${blendedSignal.toFixed(3)}`,
          confidence: Math.abs(blendedSignal)
        };
      }
      
      return { shouldTrade: false };
    } catch (error) {
      console.error('Error checking mean reversion strategy:', error);
      return { shouldTrade: false };
    }
  }

  async checkVolatilityBreakout(symbol: string): Promise<{
    shouldTrade: boolean;
    action?: 'buy' | 'sell';
    reason?: string;
    confidence?: number;
  }> {
    if (!this.config.enabled || !this.config.enabledStrategies.volatilityBreakout) {
      return { shouldTrade: false };
    }
    
    try {
      const ohlc = await this.client.getOHLCData(symbol);
      const candles = Object.values(ohlc.result)[0];
      const closes = candles.map(candle => parseFloat(candle[4]));
      const volumes = candles.map(candle => parseFloat(candle[5]));
      
      const result = volatilityBreakoutStrategy(
        closes,
        volumes,
        14,  // atrPeriod
        1.5  // breakoutThreshold
      );
      
      if (result.action !== 'hold' && result.confidence >= 0.6) {
        // Notify about the trading opportunity
        await this.notificationService.notifyTradeOpportunity(
          symbol,
          result.action,
          result.signals.join(', ')
        );
        
        return {
          shouldTrade: true,
          action: result.action,
          reason: result.signals.join(', '),
          confidence: result.confidence
        };
      }
      
      return { shouldTrade: false };
    } catch (error) {
      console.error('Error checking volatility breakout strategy:', error);
      return { shouldTrade: false };
    }
  }

  async setupGridTrading(symbol: string, gridCount: number = 10, gridSpread: number = 2.0): Promise<boolean> {
    if (!this.config.enabled || !this.config.enabledStrategies.gridTrading) {
      return false;
    }
    
    try {
      // Get current price
      const ticker = await this.client.getTickerInformation([symbol]);
      const tickerResult = ticker.result as Record<string, { c: string[] }>;
      const price = parseFloat(tickerResult[symbol].c[0]);
      
      // Calculate grid levels
      const gridLevels = calculateGridLevels(price, gridCount, gridSpread);
      
      // Store grid levels for this symbol
      this.activeGridLevels.set(symbol, gridLevels);
      
      // Notify about grid setup
      await this.notificationService.sendNotification(
        NotificationType.SYSTEM_ALERT,
        'Grid Trading Setup',
        `Set up ${gridCount} grid levels for ${symbol} with ${gridSpread}% spread around $${price}`,
        {
          symbol,
          currentPrice: price,
          buyLevels: gridLevels.buyLevels.length,
          sellLevels: gridLevels.sellLevels.length
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error setting up grid trading:', error);
      return false;
    }
  }

  async checkGridLevels(symbol: string): Promise<{
    shouldTrade: boolean;
    action?: 'buy' | 'sell';
    price?: number;
    allocation?: number;
  }> {
    if (!this.config.enabled || !this.config.enabledStrategies.gridTrading) {
      return { shouldTrade: false };
    }
    
    // Check if we have grid levels for this symbol
    const gridLevels = this.activeGridLevels.get(symbol);
    if (!gridLevels) {
      return { shouldTrade: false };
    }
    
    try {
      // Get current price
      const ticker = await this.client.getTickerInformation([symbol]);
      const tickerResult = ticker.result as Record<string, { c: string[] }>;
      const currentPrice = parseFloat(tickerResult[symbol].c[0]);
      
      // Check if price hits any of our grid levels
      let action: 'buy' | 'sell' | null = null;
      let gridPrice = 0;
      let allocation = 0;
      
      // Check buy levels
      for (const level of gridLevels.buyLevels) {
        if (currentPrice <= level.price * 1.001 && currentPrice >= level.price * 0.999) {
          action = 'buy';
          gridPrice = level.price;
          allocation = level.allocation;
          break;
        }
      }
      
      // Check sell levels
      if (!action) {
        for (const level of gridLevels.sellLevels) {
          if (currentPrice >= level.price * 0.999 && currentPrice <= level.price * 1.001) {
            action = 'sell';
            gridPrice = level.price;
            allocation = level.allocation;
            break;
          }
        }
      }
      
      if (action) {
        // Notify about grid trading opportunity
        await this.notificationService.notifyTradeOpportunity(
          symbol,
          action,
          `Grid level hit at $${gridPrice.toFixed(2)} (${allocation}% allocation)`
        );
        
        return {
          shouldTrade: true,
          action,
          price: gridPrice,
          allocation
        };
      }
      
      return { shouldTrade: false };
    } catch (error) {
      console.error('Error checking grid levels:', error);
      return { shouldTrade: false };
    }
  }

  // Method to execute a trade and send notifications
  async executeTrade(
    symbol: string, 
    action: 'buy' | 'sell', 
    amount: number, 
    price: number,
    reason?: string
  ): Promise<boolean> {
    try {
      if (this.config.tradingMode === 'test') {
        console.log(`TEST MODE: Would ${action} ${amount} ${symbol} at $${price}`);
        
        // Simulate trade execution
        const profit = action === 'sell' ? (amount * price * 0.01) : undefined;
        
        // Send notification
        await this.notificationService.notifyTradeExecution(
          symbol,
          action,
          amount,
          price,
          profit
        );
        
        // Update stats
        if (profit) {
          this.config.dailyStats.profit += profit;
        }
        this.config.dailyStats.totalTrades += 1;
        
        return true;
      } else {
        // TODO: Implement actual trading logic with Kraken API
        // const order = await this.client.createOrder({
        //   pair: symbol,
        //   type: action,
        //   ordertype: 'limit',
        //   price: price.toString(),
        //   volume: amount.toString()
        // });
        
        // Notify after successful execution
        // await this.notificationService.notifyTradeExecution(
        //   symbol, action, amount, price
        // );
        
        return false;
      }
    } catch (error) {
      console.error('Error executing trade:', error);
      
      // Notify about the error
      await this.notificationService.sendNotification(
        NotificationType.RISK_ALERT,
        'Trade Execution Failed',
        `Failed to ${action} ${amount} ${symbol} at $${price}: ${error}`,
        { level: 'critical' }
      );
      
      return false;
    }
  }

  private findTriangularArbitrage(prices: any): Array<{
    symbols: string[];
    route: string[];
    profit: number;
  }> {
    const opportunities = [];
    const pairs = Object.keys(prices);

    for (const pair1 of pairs) {
      for (const pair2 of pairs) {
        for (const pair3 of pairs) {
          const profit = this.calculateTriangularProfit(
            prices[pair1],
            prices[pair2],
            prices[pair3]
          );

          if (profit > 0) {
            opportunities.push({
              symbols: [pair1, pair2, pair3],
              route: this.getArbitrageRoute(pair1, pair2, pair3),
              profit
            });
          }
        }
      }
    }

    return opportunities.sort((a, b) => b.profit - a.profit);
  }

  private calculateTriangularProfit(price1: any, price2: any, price3: any): number {
    // Simplified profit calculation - replace with actual calculation based on order books
    const rate1 = parseFloat(price1.c[0]);
    const rate2 = parseFloat(price2.c[0]);
    const rate3 = parseFloat(price3.c[0]);
    
    return ((1 / rate1) * rate2 * rate3 - 1) * 100;
  }

  private getArbitrageRoute(pair1: string, pair2: string, pair3: string): string[] {
    return [pair1, pair2, pair3];
  }

  // Method to check if a new day has started and reset daily stats if needed
  private checkAndResetDailyStats(): void {
    const now = new Date();
    const lastReset = this.config.dailyStats.lastReset;
    
    if (now.getDate() !== lastReset.getDate() ||
        now.getMonth() !== lastReset.getMonth() ||
        now.getFullYear() !== lastReset.getFullYear()) {
      
      // Send daily summary notification before reset
      const stats = {
        totalTrades: this.config.dailyStats.totalTrades,
        profit: this.config.dailyStats.profit,
        loss: this.config.dailyStats.loss,
        netProfit: this.config.dailyStats.profit - this.config.dailyStats.loss
      };
      
      // Reset stats
      this.resetDailyStats();
      
      // Send notification about daily summary
      this.notificationService.sendNotification(
        NotificationType.SYSTEM_ALERT,
        'Daily Trading Summary',
        `Total Trades: ${stats.totalTrades}\nProfit: $${stats.profit.toFixed(2)}\nLoss: $${stats.loss.toFixed(2)}\nNet Profit: $${stats.netProfit.toFixed(2)}`,
        stats
      );
    }
  }

  setConfig(newConfig: Partial<StrategyConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): StrategyConfig {
    return { ...this.config };
  }

  toggleTrading(enabled: boolean) {
    this.config.enabled = enabled;
    
    // Send notification about trading status change
    this.notificationService.sendNotification(
      NotificationType.SYSTEM_ALERT,
      `Trading ${enabled ? 'Enabled' : 'Disabled'}`,
      `Trading has been ${enabled ? 'enabled' : 'disabled'} in ${this.config.tradingMode} mode.`,
      { tradingMode: this.config.tradingMode }
    );
  }

  // Add daily stats reset
  private resetDailyStats() {
    this.config.dailyStats = {
      totalTrades: 0,
      profit: 0,
      loss: 0,
      lastReset: new Date()
    };
  }

  // Check if we should stop trading based on daily loss
  private shouldStopTrading(): boolean {
    if (this.config.dailyStats.loss >= this.config.maxDailyLoss) {
      // Notify about max loss reached
      this.notificationService.notifyRiskAlert(
        `Daily loss limit of $${this.config.maxDailyLoss} reached. Trading has been disabled.`,
        'critical'
      );
      
      // Disable trading
      this.config.enabled = false;
      
      return true;
    }
    return false;
  }

  async trainPredictionModel(xs: number[], ys: number[]) {
    await this.predictionModel.trainModel(xs, ys);
  }
} 