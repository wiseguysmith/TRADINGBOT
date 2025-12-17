/**
 * Income Strategy
 * Core Logic: arbitrage and grid micro-profits
 * Behavior: high-frequency low-risk trades
 * Features: consistent income generation
 */

const income = {
  name: 'Income',
  riskLevel: 'low',
  expectedReturn: {
    avg: 0.12, // 12% average monthly return
    range: [0.08, 0.16], // 8-16% range
    maxDrawdown: 0.06 // 6% max drawdown
  },
  strategyMix: {
    meanReversion: 0.20, // 20% mean reversion
    arbitrage: 0.50, // 50% arbitrage
    gridTrading: 0.30, // 30% grid trading
    mlPrediction: 0.00 // 0% ML prediction
  },
  timeHorizonMonths: 1,
  coreLogicDescription: 'Focuses on arbitrage opportunities and grid trading micro-profits. Generates consistent income through high-frequency, low-risk trades.',
  behaviorDescription: 'Executes high-frequency trades with low risk. Focuses on small, consistent profits. Minimizes overnight exposure.',
  keyFeatures: [
    'Consistent income generation',
    'High-frequency trading',
    'Low-risk micro-profits',
    'Arbitrage-focused',
    'Grid trading optimization'
  ],
  
  generateSignals(marketData) {
    const signals = {
      action: 'hold',
      confidence: 0,
      strategy: 'income',
      details: {
        meanReversion: null,
        arbitrage: null,
        gridTrading: null
      },
      positionSize: 0.10, // 10% of portfolio max per trade
      stopLoss: 0.015, // 1.5% stop loss
      takeProfit: 0.03 // 3% take profit
    };

    // Arbitrage signals (50% weight) - primary focus
    if (marketData.arbitrageOpportunity && marketData.arbitrageProfit > 0.0005) {
      signals.details.arbitrage = {
        action: 'buy',
        confidence: 0.8,
        reason: `Arbitrage opportunity: ${(marketData.arbitrageProfit * 100).toFixed(3)}% profit`
      };
    }

    // Grid trading signals (30% weight)
    if (marketData.price && marketData.gridLevels) {
      const nearGridLevel = marketData.gridLevels.find(level => 
        Math.abs(marketData.price - level.price) / marketData.price < 0.001
      );
      if (nearGridLevel) {
        signals.details.gridTrading = {
          action: nearGridLevel.type,
          confidence: 0.7,
          reason: `Price at grid level: ${nearGridLevel.price}`
        };
      }
    }

    // Mean reversion signals (20% weight) - quick scalps
    if (marketData.rsi && marketData.rsi < 30) {
      signals.details.meanReversion = {
        action: 'buy',
        confidence: 0.6,
        reason: 'RSI oversold, quick mean reversion scalp'
      };
    } else if (marketData.rsi && marketData.rsi > 70) {
      signals.details.meanReversion = {
        action: 'sell',
        confidence: 0.6,
        reason: 'RSI overbought, quick mean reversion scalp'
      };
    }

    // Aggregate signals with weights
    const weightedSignals = [];
    if (signals.details.arbitrage) {
      weightedSignals.push({
        action: signals.details.arbitrage.action,
        weight: 0.50,
        confidence: signals.details.arbitrage.confidence
      });
    }
    if (signals.details.gridTrading) {
      weightedSignals.push({
        action: signals.details.gridTrading.action,
        weight: 0.30,
        confidence: signals.details.gridTrading.confidence
      });
    }
    if (signals.details.meanReversion) {
      weightedSignals.push({
        action: signals.details.meanReversion.action,
        weight: 0.20,
        confidence: signals.details.meanReversion.confidence
      });
    }

    // Determine final action - lower threshold for income strategy
    if (weightedSignals.length > 0) {
      const buyWeight = weightedSignals
        .filter(s => s.action === 'buy')
        .reduce((sum, s) => sum + s.weight * s.confidence, 0);
      const sellWeight = weightedSignals
        .filter(s => s.action === 'sell')
        .reduce((sum, s) => sum + s.weight * s.confidence, 0);

      if (buyWeight > 0.30) {
        signals.action = 'buy';
        signals.confidence = buyWeight;
      } else if (sellWeight > 0.30) {
        signals.action = 'sell';
        signals.confidence = sellWeight;
      }
    }

    // Only trade during active market hours (avoid low liquidity)
    if (marketData.volume && marketData.volume < marketData.averageVolume * 0.5) {
      signals.action = 'hold';
      signals.confidence = 0;
      signals.details.liquidityWarning = 'Low volume detected, avoiding trade';
    }

    return signals;
  }
};

module.exports = income;

