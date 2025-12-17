/**
 * Momentum Strategy
 * Core Logic: trend following, breakout detection
 * Behavior: rides large moves, exits on exhaustion
 * Features: max gains during bull trends
 */

const momentum = {
  name: 'Momentum',
  riskLevel: 'medium-high',
  expectedReturn: {
    avg: 0.20, // 20% average monthly return
    range: [0.12, 0.30], // 12-30% range
    maxDrawdown: 0.15 // 15% max drawdown
  },
  strategyMix: {
    meanReversion: 0.10, // 10% mean reversion
    arbitrage: 0.05, // 5% arbitrage
    gridTrading: 0.15, // 15% grid trading
    mlPrediction: 0.70 // 70% ML prediction
  },
  timeHorizonMonths: 4,
  coreLogicDescription: 'Trend following strategy with breakout detection. Rides large price moves and exits when momentum exhausts. Maximizes gains during strong bull trends.',
  behaviorDescription: 'Rides large moves with trend-following positions. Exits when momentum shows signs of exhaustion. Performs best during strong trending markets.',
  keyFeatures: [
    'Trend following',
    'Breakout detection',
    'Momentum exhaustion exits',
    'Bull trend optimization',
    'Large move capture'
  ],
  
  generateSignals(marketData) {
    const signals = {
      action: 'hold',
      confidence: 0,
      strategy: 'momentum',
      details: {
        meanReversion: null,
        arbitrage: null,
        gridTrading: null,
        mlPrediction: null,
        momentum: null
      },
      positionSize: 0.25, // 25% of portfolio max
      stopLoss: 0.04, // 4% stop loss
      takeProfit: 0.08 // 8% take profit
    };

    // ML prediction signals (70% weight) - primary driver
    if (marketData.mlPrediction && marketData.mlConfidence > 0.65) {
      signals.details.mlPrediction = {
        action: marketData.mlPrediction > 0 ? 'buy' : 'sell',
        confidence: marketData.mlConfidence,
        reason: `ML momentum prediction: ${marketData.mlPrediction > 0 ? 'bullish' : 'bearish'}`
      };
    }

    // Momentum indicators
    if (marketData.macd && marketData.macdSignal) {
      const momentumSignal = marketData.macd > marketData.macdSignal ? 'buy' : 'sell';
      const momentumStrength = Math.abs(marketData.macd - marketData.macdSignal);
      if (momentumStrength > 0.001) {
        signals.details.momentum = {
          action: momentumSignal,
          confidence: Math.min(momentumStrength * 1000, 0.8),
          reason: `MACD momentum: ${momentumSignal === 'buy' ? 'bullish' : 'bearish'} divergence`
        };
      }
    }

    // Breakout detection
    if (marketData.price && marketData.resistance && marketData.support) {
      if (marketData.price > marketData.resistance * 0.99 && marketData.volume > marketData.averageVolume * 1.2) {
        signals.details.momentum = {
          action: 'buy',
          confidence: 0.75,
          reason: 'Bullish breakout with volume confirmation'
        };
      } else if (marketData.price < marketData.support * 1.01 && marketData.volume > marketData.averageVolume * 1.2) {
        signals.details.momentum = {
          action: 'sell',
          confidence: 0.75,
          reason: 'Bearish breakdown with volume confirmation'
        };
      }
    }

    // Grid trading signals (15% weight) - for entry/exit
    if (marketData.price && marketData.gridLevels) {
      const nearGridLevel = marketData.gridLevels.find(level => 
        Math.abs(marketData.price - level.price) / marketData.price < 0.002
      );
      if (nearGridLevel) {
        signals.details.gridTrading = {
          action: nearGridLevel.type,
          confidence: 0.5,
          reason: `Price near grid level: ${nearGridLevel.price}`
        };
      }
    }

    // Mean reversion signals (10% weight) - only for exits
    if (marketData.rsi && marketData.rsi > 80) {
      signals.details.meanReversion = {
        action: 'sell',
        confidence: 0.5,
        reason: 'Extreme overbought, potential momentum exhaustion'
      };
    } else if (marketData.rsi && marketData.rsi < 20) {
      signals.details.meanReversion = {
        action: 'buy',
        confidence: 0.5,
        reason: 'Extreme oversold, potential momentum reversal'
      };
    }

    // Aggregate signals with weights
    const weightedSignals = [];
    if (signals.details.mlPrediction) {
      weightedSignals.push({
        action: signals.details.mlPrediction.action,
        weight: 0.70,
        confidence: signals.details.mlPrediction.confidence
      });
    }
    if (signals.details.momentum) {
      weightedSignals.push({
        action: signals.details.momentum.action,
        weight: 0.70,
        confidence: signals.details.momentum.confidence
      });
    }
    if (signals.details.gridTrading) {
      weightedSignals.push({
        action: signals.details.gridTrading.action,
        weight: 0.15,
        confidence: signals.details.gridTrading.confidence
      });
    }
    if (signals.details.meanReversion) {
      weightedSignals.push({
        action: signals.details.meanReversion.action,
        weight: 0.10,
        confidence: signals.details.meanReversion.confidence
      });
    }

    // Determine final action
    if (weightedSignals.length > 0) {
      const buyWeight = weightedSignals
        .filter(s => s.action === 'buy')
        .reduce((sum, s) => sum + s.weight * s.confidence, 0);
      const sellWeight = weightedSignals
        .filter(s => s.action === 'sell')
        .reduce((sum, s) => sum + s.weight * s.confidence, 0);

      if (buyWeight > 0.40) {
        signals.action = 'buy';
        signals.confidence = buyWeight;
      } else if (sellWeight > 0.40) {
        signals.action = 'sell';
        signals.confidence = sellWeight;
      }
    }

    // Increase position size if strong momentum
    if (signals.details.momentum && signals.details.momentum.confidence > 0.7) {
      signals.positionSize *= 1.3; // Increase size for strong momentum (capped at max)
    }

    return signals;
  }
};

module.exports = momentum;

