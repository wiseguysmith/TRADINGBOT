/**
 * Balanced Strategy
 * Core Logic: diversified mean reversion + trend + grid
 * Behavior: adapts to volatility, grows steadily
 * Features: moderate growth, controlled volatility
 */

const balanced = {
  name: 'Balanced',
  riskLevel: 'medium',
  expectedReturn: {
    avg: 0.15, // 15% average monthly return
    range: [0.10, 0.20], // 10-20% range
    maxDrawdown: 0.10 // 10% max drawdown
  },
  strategyMix: {
    meanReversion: 0.35, // 35% mean reversion
    arbitrage: 0.20, // 20% arbitrage
    gridTrading: 0.25, // 25% grid trading
    mlPrediction: 0.20 // 20% ML prediction
  },
  timeHorizonMonths: 6,
  coreLogicDescription: 'Diversified approach combining mean reversion, trend following, grid trading, and ML predictions. Adapts to market volatility while maintaining steady growth.',
  behaviorDescription: 'Adapts position sizing to volatility. Grows steadily with controlled risk. Balances multiple strategies for consistent performance.',
  keyFeatures: [
    'Moderate growth target',
    'Controlled volatility',
    'Diversified strategy mix',
    'Volatility-adaptive',
    'Steady performance'
  ],
  
  generateSignals(marketData) {
    const signals = {
      action: 'hold',
      confidence: 0,
      strategy: 'balanced',
      details: {
        meanReversion: null,
        arbitrage: null,
        gridTrading: null,
        mlPrediction: null,
        trendFollowing: null
      },
      positionSize: 0.15, // 15% of portfolio max
      stopLoss: 0.03, // 3% stop loss
      takeProfit: 0.06 // 6% take profit
    };

    // Mean reversion signals (35% weight)
    if (marketData.rsi && marketData.rsi < 40) {
      signals.details.meanReversion = {
        action: 'buy',
        confidence: 0.65,
        reason: 'RSI approaching oversold, mean reversion opportunity'
      };
    } else if (marketData.rsi && marketData.rsi > 60) {
      signals.details.meanReversion = {
        action: 'sell',
        confidence: 0.65,
        reason: 'RSI approaching overbought, mean reversion opportunity'
      };
    }

    // Trend following signals (incorporated in ML)
    if (marketData.emaShort && marketData.emaLong) {
      const trendSignal = marketData.emaShort > marketData.emaLong ? 'buy' : 'sell';
      signals.details.trendFollowing = {
        action: trendSignal,
        confidence: 0.6,
        reason: `EMA crossover: ${trendSignal === 'buy' ? 'bullish' : 'bearish'} trend`
      };
    }

    // Arbitrage signals (20% weight)
    if (marketData.arbitrageOpportunity && marketData.arbitrageProfit > 0.002) {
      signals.details.arbitrage = {
        action: 'buy',
        confidence: 0.7,
        reason: `Arbitrage opportunity: ${(marketData.arbitrageProfit * 100).toFixed(2)}% profit`
      };
    }

    // Grid trading signals (25% weight)
    if (marketData.price && marketData.gridLevels) {
      const nearGridLevel = marketData.gridLevels.find(level => 
        Math.abs(marketData.price - level.price) / marketData.price < 0.002
      );
      if (nearGridLevel) {
        signals.details.gridTrading = {
          action: nearGridLevel.type,
          confidence: 0.6,
          reason: `Price near grid level: ${nearGridLevel.price}`
        };
      }
    }

    // ML prediction signals (20% weight)
    if (marketData.mlPrediction && marketData.mlConfidence > 0.65) {
      signals.details.mlPrediction = {
        action: marketData.mlPrediction > 0 ? 'buy' : 'sell',
        confidence: marketData.mlConfidence,
        reason: 'ML prediction signal'
      };
    }

    // Aggregate signals with weights
    const weightedSignals = [];
    if (signals.details.meanReversion) {
      weightedSignals.push({
        action: signals.details.meanReversion.action,
        weight: 0.35,
        confidence: signals.details.meanReversion.confidence
      });
    }
    if (signals.details.arbitrage) {
      weightedSignals.push({
        action: signals.details.arbitrage.action,
        weight: 0.20,
        confidence: signals.details.arbitrage.confidence
      });
    }
    if (signals.details.gridTrading) {
      weightedSignals.push({
        action: signals.details.gridTrading.action,
        weight: 0.25,
        confidence: signals.details.gridTrading.confidence
      });
    }
    if (signals.details.mlPrediction) {
      weightedSignals.push({
        action: signals.details.mlPrediction.action,
        weight: 0.20,
        confidence: signals.details.mlPrediction.confidence
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

      if (buyWeight > 0.35) {
        signals.action = 'buy';
        signals.confidence = buyWeight;
      } else if (sellWeight > 0.35) {
        signals.action = 'sell';
        signals.confidence = sellWeight;
      }
    }

    // Adjust position size based on volatility
    if (marketData.volatility) {
      if (marketData.volatility > 0.08) {
        signals.positionSize *= 0.7; // Reduce size in high volatility
      } else if (marketData.volatility < 0.03) {
        signals.positionSize *= 1.2; // Increase size in low volatility (capped at max)
      }
    }

    return signals;
  }
};

module.exports = balanced;

