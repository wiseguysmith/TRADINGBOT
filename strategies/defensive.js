/**
 * Defensive Strategy
 * Core Logic: heavy mean reversion + safe-pair trading
 * Behavior: sits in cash during high volatility
 * Features: bear market protection, lowest drawdown
 */

const defensive = {
  name: 'Defensive',
  riskLevel: 'very-low',
  expectedReturn: {
    avg: 0.06, // 6% average monthly return
    range: [0.03, 0.10], // 3-10% range
    maxDrawdown: 0.03 // 3% max drawdown
  },
  strategyMix: {
    meanReversion: 0.70, // 70% mean reversion
    arbitrage: 0.20, // 20% arbitrage
    gridTrading: 0.10, // 10% grid trading
    mlPrediction: 0.00 // 0% ML prediction
  },
  timeHorizonMonths: 18,
  coreLogicDescription: 'Heavy focus on mean reversion and safe-pair trading. Sits in cash during high volatility periods. Designed for bear market protection with lowest drawdown.',
  behaviorDescription: 'Maintains cash positions during high volatility. Only trades on strong mean reversion signals. Prioritizes capital preservation above all.',
  keyFeatures: [
    'Bear market protection',
    'Lowest drawdown',
    'Cash-heavy during volatility',
    'Mean reversion focus',
    'Capital preservation'
  ],
  
  generateSignals(marketData) {
    const signals = {
      action: 'hold',
      confidence: 0,
      strategy: 'defensive',
      details: {
        meanReversion: null,
        arbitrage: null,
        gridTrading: null,
        volatilityCheck: null
      },
      positionSize: 0.03, // 3% of portfolio max (very conservative)
      stopLoss: 0.015, // 1.5% stop loss
      takeProfit: 0.03 // 3% take profit
    };

    // Volatility check - sit in cash if high volatility
    if (marketData.volatility && marketData.volatility > 0.04) {
      signals.action = 'hold';
      signals.confidence = 0;
      signals.details.volatilityCheck = {
        action: 'hold',
        confidence: 1.0,
        reason: `High volatility detected (${(marketData.volatility * 100).toFixed(2)}%), staying in cash`
      };
      return signals;
    }

    // Mean reversion signals (70% weight) - primary focus
    if (marketData.rsi && marketData.rsi < 25) {
      signals.details.meanReversion = {
        action: 'buy',
        confidence: 0.75,
        reason: 'Strong oversold condition, high probability mean reversion'
      };
    } else if (marketData.rsi && marketData.rsi > 75) {
      signals.details.meanReversion = {
        action: 'sell',
        confidence: 0.75,
        reason: 'Strong overbought condition, high probability mean reversion'
      };
    }

    // Bollinger Bands confirmation
    if (marketData.bollingerBands && marketData.price) {
      const { upper, middle, lower } = marketData.bollingerBands;
      if (marketData.price < lower) {
        signals.details.meanReversion = {
          action: 'buy',
          confidence: 0.8,
          reason: 'Price below lower Bollinger Band, strong mean reversion signal'
        };
      } else if (marketData.price > upper) {
        signals.details.meanReversion = {
          action: 'sell',
          confidence: 0.8,
          reason: 'Price above upper Bollinger Band, strong mean reversion signal'
        };
      }
    }

    // Arbitrage signals (20% weight) - only very safe opportunities
    if (marketData.arbitrageOpportunity && marketData.arbitrageProfit > 0.001 && marketData.arbitrageRisk < 0.001) {
      signals.details.arbitrage = {
        action: 'buy',
        confidence: 0.7,
        reason: `Safe arbitrage opportunity: ${(marketData.arbitrageProfit * 100).toFixed(2)}% profit, low risk`
      };
    }

    // Grid trading signals (10% weight) - minimal use
    if (marketData.price && marketData.gridLevels) {
      const nearGridLevel = marketData.gridLevels.find(level => 
        Math.abs(marketData.price - level.price) / marketData.price < 0.0005
      );
      if (nearGridLevel) {
        signals.details.gridTrading = {
          action: nearGridLevel.type,
          confidence: 0.5,
          reason: `Price exactly at grid level: ${nearGridLevel.price}`
        };
      }
    }

    // Aggregate signals with weights
    const weightedSignals = [];
    if (signals.details.meanReversion) {
      weightedSignals.push({
        action: signals.details.meanReversion.action,
        weight: 0.70,
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
        weight: 0.10,
        confidence: signals.details.gridTrading.confidence
      });
    }

    // Determine final action - higher threshold for defensive strategy
    if (weightedSignals.length > 0) {
      const buyWeight = weightedSignals
        .filter(s => s.action === 'buy')
        .reduce((sum, s) => sum + s.weight * s.confidence, 0);
      const sellWeight = weightedSignals
        .filter(s => s.action === 'sell')
        .reduce((sum, s) => sum + s.weight * s.confidence, 0);

      if (buyWeight > 0.50) {
        signals.action = 'buy';
        signals.confidence = buyWeight;
      } else if (sellWeight > 0.50) {
        signals.action = 'sell';
        signals.confidence = sellWeight;
      }
    }

    // Further reduce position size if volatility is moderate
    if (marketData.volatility && marketData.volatility > 0.02) {
      signals.positionSize *= 0.5; // Halve position size in moderate volatility
    }

    return signals;
  }
};

module.exports = defensive;

