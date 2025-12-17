/**
 * Seasonal Strategy
 * Core Logic: crypto cycles, funding rates, event catalysts
 * Behavior: increases allocation around profitable seasons
 * Features: cycle optimization, event-based trading
 */

const seasonal = {
  name: 'Seasonal',
  riskLevel: 'medium',
  expectedReturn: {
    avg: 0.18, // 18% average monthly return
    range: [0.10, 0.28], // 10-28% range (higher during seasons)
    maxDrawdown: 0.12 // 12% max drawdown
  },
  strategyMix: {
    meanReversion: 0.25, // 25% mean reversion
    arbitrage: 0.20, // 20% arbitrage
    gridTrading: 0.20, // 20% grid trading
    mlPrediction: 0.35 // 35% ML prediction
  },
  timeHorizonMonths: 12,
  coreLogicDescription: 'Optimizes trading around crypto market cycles, funding rate opportunities, and event catalysts. Increases allocation during historically profitable seasons.',
  behaviorDescription: 'Increases position sizes during favorable seasons. Adapts strategy mix based on market cycles. Focuses on event-driven opportunities.',
  keyFeatures: [
    'Cycle optimization',
    'Event-based trading',
    'Funding rate arbitrage',
    'Seasonal allocation adjustment',
    'Catalyst-driven entries'
  ],
  
  generateSignals(marketData) {
    const signals = {
      action: 'hold',
      confidence: 0,
      strategy: 'seasonal',
      details: {
        meanReversion: null,
        arbitrage: null,
        gridTrading: null,
        mlPrediction: null,
        seasonal: null
      },
      positionSize: 0.20, // 20% of portfolio max (adjusted by season)
      stopLoss: 0.035, // 3.5% stop loss
      takeProfit: 0.07 // 7% take profit
    };

    // Seasonal factors (month-based, simplified)
    const currentMonth = new Date().getMonth();
    const isFavorableSeason = [10, 11, 0, 1].includes(currentMonth); // Q4/Q1 historically strong
    const seasonalMultiplier = isFavorableSeason ? 1.3 : 0.8;

    // ML prediction signals (35% weight)
    if (marketData.mlPrediction && marketData.mlConfidence > 0.60) {
      signals.details.mlPrediction = {
        action: marketData.mlPrediction > 0 ? 'buy' : 'sell',
        confidence: marketData.mlConfidence * seasonalMultiplier,
        reason: `ML prediction: ${marketData.mlPrediction > 0 ? 'bullish' : 'bearish'} (seasonal factor: ${isFavorableSeason ? 'favorable' : 'neutral'})`
      };
    }

    // Funding rate arbitrage (incorporated in arbitrage)
    if (marketData.fundingRate && Math.abs(marketData.fundingRate) > 0.0001) {
      signals.details.seasonal = {
        action: marketData.fundingRate > 0 ? 'sell' : 'buy',
        confidence: 0.6,
        reason: `Funding rate opportunity: ${(marketData.fundingRate * 100).toFixed(4)}%`
      };
    }

    // Event catalysts (simplified - would integrate with event calendar)
    if (marketData.eventCatalyst) {
      signals.details.seasonal = {
        action: marketData.eventCatalyst.type === 'bullish' ? 'buy' : 'sell',
        confidence: 0.7,
        reason: `Event catalyst: ${marketData.eventCatalyst.description}`
      };
    }

    // Mean reversion signals (25% weight)
    if (marketData.rsi && marketData.rsi < 35) {
      signals.details.meanReversion = {
        action: 'buy',
        confidence: 0.6,
        reason: 'RSI oversold, seasonal mean reversion opportunity'
      };
    } else if (marketData.rsi && marketData.rsi > 65) {
      signals.details.meanReversion = {
        action: 'sell',
        confidence: 0.6,
        reason: 'RSI overbought, seasonal mean reversion opportunity'
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

    // Grid trading signals (20% weight)
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

    // Aggregate signals with weights
    const weightedSignals = [];
    if (signals.details.mlPrediction) {
      weightedSignals.push({
        action: signals.details.mlPrediction.action,
        weight: 0.35,
        confidence: signals.details.mlPrediction.confidence
      });
    }
    if (signals.details.seasonal) {
      weightedSignals.push({
        action: signals.details.seasonal.action,
        weight: 0.30,
        confidence: signals.details.seasonal.confidence
      });
    }
    if (signals.details.meanReversion) {
      weightedSignals.push({
        action: signals.details.meanReversion.action,
        weight: 0.25,
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
        weight: 0.20,
        confidence: signals.details.gridTrading.confidence
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

    // Adjust position size based on season
    signals.positionSize *= seasonalMultiplier;
    signals.positionSize = Math.min(signals.positionSize, 0.30); // Cap at 30%

    return signals;
  }
};

module.exports = seasonal;

