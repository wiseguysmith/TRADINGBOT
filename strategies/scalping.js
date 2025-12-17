/**
 * Scalping Strategy
 * Core Logic: micro-grid + micro-arbitrage
 * Behavior: small rapid trades, no overnight holds
 * Features: high-frequency micro-profits
 */

const scalping = {
  name: 'Scalping',
  riskLevel: 'low-medium',
  expectedReturn: {
    avg: 0.14, // 14% average monthly return
    range: [0.10, 0.18], // 10-18% range
    maxDrawdown: 0.08 // 8% max drawdown
  },
  strategyMix: {
    meanReversion: 0.15, // 15% mean reversion
    arbitrage: 0.40, // 40% arbitrage
    gridTrading: 0.45, // 45% grid trading
    mlPrediction: 0.00 // 0% ML prediction
  },
  timeHorizonMonths: 1,
  coreLogicDescription: 'Micro-grid and micro-arbitrage focused strategy. Executes small rapid trades with no overnight holds. Generates high-frequency micro-profits.',
  behaviorDescription: 'Executes many small trades throughout the day. Closes all positions before market close. Focuses on tight spreads and quick profits.',
  keyFeatures: [
    'High-frequency trading',
    'Micro-profits',
    'No overnight holds',
    'Tight spread focus',
    'Rapid execution'
  ],
  
  generateSignals(marketData) {
    const signals = {
      action: 'hold',
      confidence: 0,
      strategy: 'scalping',
      details: {
        meanReversion: null,
        arbitrage: null,
        gridTrading: null
      },
      positionSize: 0.08, // 8% of portfolio max per trade
      stopLoss: 0.01, // 1% stop loss (tight)
      takeProfit: 0.02 // 2% take profit (quick)
    };

    // Grid trading signals (45% weight) - primary focus
    if (marketData.price && marketData.gridLevels) {
      const nearGridLevel = marketData.gridLevels.find(level => 
        Math.abs(marketData.price - level.price) / marketData.price < 0.0005
      );
      if (nearGridLevel) {
        signals.details.gridTrading = {
          action: nearGridLevel.type,
          confidence: 0.8,
          reason: `Price at micro-grid level: ${nearGridLevel.price}`
        };
      }
    }

    // Arbitrage signals (40% weight) - micro opportunities
    if (marketData.arbitrageOpportunity && marketData.arbitrageProfit > 0.0003) {
      signals.details.arbitrage = {
        action: 'buy',
        confidence: 0.75,
        reason: `Micro-arbitrage: ${(marketData.arbitrageProfit * 100).toFixed(3)}% profit`
      };
    }

    // Mean reversion signals (15% weight) - quick scalps only
    if (marketData.rsi && marketData.rsi < 28) {
      signals.details.meanReversion = {
        action: 'buy',
        confidence: 0.6,
        reason: 'Quick oversold scalp opportunity'
      };
    } else if (marketData.rsi && marketData.rsi > 72) {
      signals.details.meanReversion = {
        action: 'sell',
        confidence: 0.6,
        reason: 'Quick overbought scalp opportunity'
      };
    }

    // Check if market is active (scalping requires liquidity)
    if (marketData.volume && marketData.volume < marketData.averageVolume * 0.6) {
      signals.action = 'hold';
      signals.confidence = 0;
      signals.details.liquidityWarning = 'Low volume, avoiding scalping trade';
      return signals;
    }

    // Check spread tightness (scalping requires tight spreads)
    if (marketData.bidAskSpread && marketData.bidAskSpread > 0.001) {
      signals.action = 'hold';
      signals.confidence = 0;
      signals.details.spreadWarning = `Spread too wide: ${(marketData.bidAskSpread * 100).toFixed(3)}%, avoiding trade`;
      return signals;
    }

    // Aggregate signals with weights
    const weightedSignals = [];
    if (signals.details.gridTrading) {
      weightedSignals.push({
        action: signals.details.gridTrading.action,
        weight: 0.45,
        confidence: signals.details.gridTrading.confidence
      });
    }
    if (signals.details.arbitrage) {
      weightedSignals.push({
        action: signals.details.arbitrage.action,
        weight: 0.40,
        confidence: signals.details.arbitrage.confidence
      });
    }
    if (signals.details.meanReversion) {
      weightedSignals.push({
        action: signals.details.meanReversion.action,
        weight: 0.15,
        confidence: signals.details.meanReversion.confidence
      });
    }

    // Determine final action - lower threshold for scalping
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

    // Ensure no overnight holds (close positions before market close)
    const currentHour = new Date().getHours();
    if (currentHour >= 22 || currentHour < 2) {
      signals.action = 'hold';
      signals.confidence = 0;
      signals.details.overnightWarning = 'Avoiding overnight positions';
    }

    return signals;
  }
};

module.exports = scalping;

