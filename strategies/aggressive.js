/**
 * Aggressive Strategy
 * Core Logic: ML-driven prediction + breakout systems
 * Behavior: large positions, high volatility tolerance
 * Features: high growth, trend riding, higher risk
 */

const aggressive = {
  name: 'Aggressive',
  riskLevel: 'high',
  expectedReturn: {
    avg: 0.25, // 25% average monthly return
    range: [0.15, 0.35], // 15-35% range
    maxDrawdown: 0.20 // 20% max drawdown
  },
  strategyMix: {
    meanReversion: 0.15, // 15% mean reversion
    arbitrage: 0.10, // 10% arbitrage
    gridTrading: 0.20, // 20% grid trading
    mlPrediction: 0.55 // 55% ML prediction
  },
  timeHorizonMonths: 3,
  coreLogicDescription: 'ML-driven prediction system with breakout detection. Uses large positions and high volatility tolerance to maximize returns during strong trends.',
  behaviorDescription: 'Takes large positions with high volatility tolerance. Rides trends aggressively. Prioritizes growth over capital preservation.',
  keyFeatures: [
    'High growth target',
    'Trend riding',
    'ML-driven decisions',
    'Breakout detection',
    'Higher risk tolerance'
  ],
  
  generateSignals(marketData) {
    const signals = {
      action: 'hold',
      confidence: 0,
      strategy: 'aggressive',
      details: {
        meanReversion: null,
        arbitrage: null,
        gridTrading: null,
        mlPrediction: null,
        breakout: null
      },
      positionSize: 0.30, // 30% of portfolio max
      stopLoss: 0.05, // 5% stop loss
      takeProfit: 0.10 // 10% take profit
    };

    // ML prediction signals (55% weight) - primary driver
    if (marketData.mlPrediction && marketData.mlConfidence > 0.60) {
      signals.details.mlPrediction = {
        action: marketData.mlPrediction > 0 ? 'buy' : 'sell',
        confidence: marketData.mlConfidence,
        reason: `ML prediction: ${marketData.mlPrediction > 0 ? 'bullish' : 'bearish'} with ${(marketData.mlConfidence * 100).toFixed(1)}% confidence`
      };
    }

    // Breakout detection (incorporated in ML)
    if (marketData.price && marketData.resistance && marketData.support) {
      const rangeSize = marketData.resistance - marketData.support;
      if (marketData.price > marketData.resistance * 0.98) {
        signals.details.breakout = {
          action: 'buy',
          confidence: 0.7,
          reason: 'Price approaching resistance, potential bullish breakout'
        };
      } else if (marketData.price < marketData.support * 1.02) {
        signals.details.breakout = {
          action: 'sell',
          confidence: 0.7,
          reason: 'Price approaching support, potential bearish breakdown'
        };
      }
    }

    // Grid trading signals (20% weight)
    if (marketData.price && marketData.gridLevels) {
      const nearGridLevel = marketData.gridLevels.find(level => 
        Math.abs(marketData.price - level.price) / marketData.price < 0.003
      );
      if (nearGridLevel) {
        signals.details.gridTrading = {
          action: nearGridLevel.type,
          confidence: 0.6,
          reason: `Price near grid level: ${nearGridLevel.price}`
        };
      }
    }

    // Mean reversion signals (15% weight) - minimal use
    if (marketData.rsi && marketData.rsi < 25) {
      signals.details.meanReversion = {
        action: 'buy',
        confidence: 0.5,
        reason: 'Extreme oversold, potential bounce'
      };
    } else if (marketData.rsi && marketData.rsi > 75) {
      signals.details.meanReversion = {
        action: 'sell',
        confidence: 0.5,
        reason: 'Extreme overbought, potential reversal'
      };
    }

    // Arbitrage signals (10% weight) - minimal use
    if (marketData.arbitrageOpportunity && marketData.arbitrageProfit > 0.005) {
      signals.details.arbitrage = {
        action: 'buy',
        confidence: 0.7,
        reason: `Large arbitrage opportunity: ${(marketData.arbitrageProfit * 100).toFixed(2)}% profit`
      };
    }

    // Aggregate signals with weights
    const weightedSignals = [];
    if (signals.details.mlPrediction) {
      weightedSignals.push({
        action: signals.details.mlPrediction.action,
        weight: 0.55,
        confidence: signals.details.mlPrediction.confidence
      });
    }
    if (signals.details.breakout) {
      weightedSignals.push({
        action: signals.details.breakout.action,
        weight: 0.20,
        confidence: signals.details.breakout.confidence
      });
    }
    if (signals.details.gridTrading) {
      weightedSignals.push({
        action: signals.details.gridTrading.action,
        weight: 0.20,
        confidence: signals.details.gridTrading.confidence
      });
    }
    if (signals.details.meanReversion) {
      weightedSignals.push({
        action: signals.details.meanReversion.action,
        weight: 0.15,
        confidence: signals.details.meanReversion.confidence
      });
    }
    if (signals.details.arbitrage) {
      weightedSignals.push({
        action: signals.details.arbitrage.action,
        weight: 0.10,
        confidence: signals.details.arbitrage.confidence
      });
    }

    // Determine final action - lower threshold for aggressive strategy
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

    // Increase position size if high confidence
    if (signals.confidence > 0.7) {
      signals.positionSize *= 1.2; // Increase size for high confidence (capped at max)
    }

    return signals;
  }
};

module.exports = aggressive;

