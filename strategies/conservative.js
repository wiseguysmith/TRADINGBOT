/**
 * Conservative Strategy
 * Core Logic: price reversion, low volatility signals, micro-arbitrage
 * Behavior: small positions, slow adjustments, safe during volatility
 * Features: capital preservation, low drawdown, frequent small wins
 */

const conservative = {
  name: 'Conservative',
  riskLevel: 'low',
  expectedReturn: {
    avg: 0.08, // 8% average monthly return
    range: [0.05, 0.12], // 5-12% range
    maxDrawdown: 0.05 // 5% max drawdown
  },
  strategyMix: {
    meanReversion: 0.50, // 50% mean reversion
    arbitrage: 0.30, // 30% arbitrage
    gridTrading: 0.15, // 15% grid trading
    mlPrediction: 0.05 // 5% ML prediction
  },
  timeHorizonMonths: 12,
  coreLogicDescription: 'Focuses on price reversion patterns, low volatility signals, and micro-arbitrage opportunities. Uses conservative position sizing and slow adjustments to preserve capital.',
  behaviorDescription: 'Takes small positions with slow adjustments. Remains safe during high volatility periods. Prioritizes capital preservation over aggressive growth.',
  keyFeatures: [
    'Capital preservation',
    'Low drawdown tolerance',
    'Frequent small wins',
    'Volatility-aware position sizing',
    'Micro-arbitrage focus'
  ],
  
  /**
   * Generate trading signals based on market data
   * @param {Object} marketData - Current market data with prices, indicators, etc.
   * @returns {Object} Trading signals with action, confidence, and details
   */
  generateSignals(marketData) {
    const signals = {
      action: 'hold',
      confidence: 0,
      strategy: 'conservative',
      details: {
        meanReversion: null,
        arbitrage: null,
        gridTrading: null,
        mlPrediction: null
      },
      positionSize: 0.05, // 5% of portfolio max
      stopLoss: 0.02, // 2% stop loss
      takeProfit: 0.04 // 4% take profit
    };

    // Mean reversion signals (50% weight)
    if (marketData.rsi && marketData.rsi < 35) {
      signals.details.meanReversion = {
        action: 'buy',
        confidence: 0.6,
        reason: 'RSI oversold, expecting price reversion'
      };
    } else if (marketData.rsi && marketData.rsi > 65) {
      signals.details.meanReversion = {
        action: 'sell',
        confidence: 0.6,
        reason: 'RSI overbought, expecting price reversion'
      };
    }

    // Arbitrage signals (30% weight)
    if (marketData.arbitrageOpportunity && marketData.arbitrageProfit > 0.001) {
      signals.details.arbitrage = {
        action: 'buy',
        confidence: 0.7,
        reason: `Micro-arbitrage opportunity: ${(marketData.arbitrageProfit * 100).toFixed(2)}% profit`
      };
    }

    // Grid trading signals (15% weight)
    if (marketData.price && marketData.gridLevels) {
      const nearGridLevel = marketData.gridLevels.find(level => 
        Math.abs(marketData.price - level.price) / marketData.price < 0.001
      );
      if (nearGridLevel) {
        signals.details.gridTrading = {
          action: nearGridLevel.type,
          confidence: 0.5,
          reason: `Price near grid level: ${nearGridLevel.price}`
        };
      }
    }

    // ML prediction signals (5% weight) - conservative use
    if (marketData.mlPrediction && marketData.mlConfidence > 0.8) {
      signals.details.mlPrediction = {
        action: marketData.mlPrediction > 0 ? 'buy' : 'sell',
        confidence: 0.4,
        reason: 'High-confidence ML prediction'
      };
    }

    // Aggregate signals with weights
    const weightedSignals = [];
    if (signals.details.meanReversion) {
      weightedSignals.push({
        action: signals.details.meanReversion.action,
        weight: 0.50,
        confidence: signals.details.meanReversion.confidence
      });
    }
    if (signals.details.arbitrage) {
      weightedSignals.push({
        action: signals.details.arbitrage.action,
        weight: 0.30,
        confidence: signals.details.arbitrage.confidence
      });
    }
    if (signals.details.gridTrading) {
      weightedSignals.push({
        action: signals.details.gridTrading.action,
        weight: 0.15,
        confidence: signals.details.gridTrading.confidence
      });
    }
    if (signals.details.mlPrediction) {
      weightedSignals.push({
        action: signals.details.mlPrediction.action,
        weight: 0.05,
        confidence: signals.details.mlPrediction.confidence
      });
    }

    // Determine final action based on weighted signals
    if (weightedSignals.length > 0) {
      const buyWeight = weightedSignals
        .filter(s => s.action === 'buy')
        .reduce((sum, s) => sum + s.weight * s.confidence, 0);
      const sellWeight = weightedSignals
        .filter(s => s.action === 'sell')
        .reduce((sum, s) => sum + s.weight * s.confidence, 0);

      if (buyWeight > 0.4) {
        signals.action = 'buy';
        signals.confidence = buyWeight;
      } else if (sellWeight > 0.4) {
        signals.action = 'sell';
        signals.confidence = sellWeight;
      }
    }

    // Only trade in low volatility conditions
    if (marketData.volatility && marketData.volatility > 0.05) {
      signals.action = 'hold';
      signals.confidence = 0;
      signals.details.volatilityWarning = 'High volatility detected, staying in cash';
    }

    return signals;
  }
};

module.exports = conservative;

