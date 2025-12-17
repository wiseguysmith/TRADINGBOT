/**
 * Daily Digest Generator
 * Creates comprehensive daily reports with P&L, strategy performance, market sentiment, and recommendations
 */

const { explainTradeSummary } = require('../core/tradeExplanation');

/**
 * Generate daily digest report
 * @param {Object} options - Report options
 * @param {Object} options.portfolio - Portfolio state
 * @param {Array} options.trades - Array of trades from the day
 * @param {Object} options.strategyPerformance - Performance by strategy
 * @param {Object} options.marketData - Market data and sentiment
 * @param {Object} options.riskMetrics - Risk metrics
 * @returns {Object} Daily digest report
 */
function generateDailyDigest(options = {}) {
  const {
    portfolio = {},
    trades = [],
    strategyPerformance = {},
    marketData = {},
    riskMetrics = {}
  } = options;

  const report = {
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
    dailyPnL: {
      total: 0,
      percentage: 0,
      trades: trades.length,
      profitableTrades: 0,
      losingTrades: 0
    },
    strategyPerformance: {},
    marketSentiment: {
      overall: 'neutral',
      volatility: 'moderate',
      trend: 'neutral',
      details: {}
    },
    recentTrades: [],
    riskAlerts: [],
    recommendations: []
  };

  // Calculate daily P&L
  if (trades.length > 0) {
    const dailyProfit = trades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
    const startBalance = portfolio.startBalance || portfolio.balance || 1;
    
    report.dailyPnL.total = dailyProfit;
    report.dailyPnL.percentage = (dailyProfit / startBalance) * 100;
    report.dailyPnL.profitableTrades = trades.filter(t => (t.profit || 0) > 0).length;
    report.dailyPnL.losingTrades = trades.filter(t => (t.profit || 0) < 0).length;
  }

  // Strategy performance summary
  Object.keys(strategyPerformance).forEach(strategyName => {
    const perf = strategyPerformance[strategyName];
    report.strategyPerformance[strategyName] = {
      trades: perf.trades || 0,
      totalPnL: perf.totalPnL || 0,
      winRate: perf.winRate || 0,
      avgProfit: perf.avgProfit || 0,
      allocation: perf.allocation || 0,
      performance: perf.performance || 'neutral'
    };
  });

  // Market sentiment analysis (simplified - would integrate with real API)
  if (marketData.volatility) {
    if (marketData.volatility > 0.08) {
      report.marketSentiment.volatility = 'high';
      report.marketSentiment.overall = 'cautious';
    } else if (marketData.volatility < 0.03) {
      report.marketSentiment.volatility = 'low';
      report.marketSentiment.overall = 'favorable';
    }
  }

  if (marketData.price && marketData.priceChange) {
    const changePercent = (marketData.priceChange / marketData.price) * 100;
    if (changePercent > 2) {
      report.marketSentiment.trend = 'bullish';
    } else if (changePercent < -2) {
      report.marketSentiment.trend = 'bearish';
    }
  }

  report.marketSentiment.details = {
    volatility: marketData.volatility ? `${(marketData.volatility * 100).toFixed(2)}%` : 'N/A',
    priceChange: marketData.priceChange ? `$${marketData.priceChange.toFixed(2)}` : 'N/A',
    volume: marketData.volume ? marketData.volume.toLocaleString() : 'N/A'
  };

  // Recent trades report (last 10 trades)
  report.recentTrades = trades.slice(-10).map(trade => ({
    id: trade.id,
    pair: trade.pair || trade.symbol,
    type: trade.type || trade.action,
    amount: trade.amount,
    price: trade.price,
    profit: trade.profit || 0,
    timestamp: trade.timestamp || trade.date,
    strategy: trade.strategy
  }));

  // Risk alerts
  if (riskMetrics.maxDrawdown && riskMetrics.maxDrawdown > 0.10) {
    report.riskAlerts.push({
      level: 'high',
      message: `Maximum drawdown reached ${(riskMetrics.maxDrawdown * 100).toFixed(1)}%`,
      recommendation: 'Consider reducing position sizes or pausing trading'
    });
  }

  if (riskMetrics.dailyLoss && riskMetrics.dailyLoss > 0.20) {
    report.riskAlerts.push({
      level: 'critical',
      message: `Daily loss exceeded ${(riskMetrics.dailyLoss * 100).toFixed(1)}%`,
      recommendation: 'Trading has been paused. Review strategy allocation.'
    });
  }

  if (riskMetrics.sharpeRatio && riskMetrics.sharpeRatio < 1.0) {
    report.riskAlerts.push({
      level: 'medium',
      message: `Sharpe ratio below 1.0 (${riskMetrics.sharpeRatio.toFixed(2)})`,
      recommendation: 'Consider adjusting strategy mix for better risk-adjusted returns'
    });
  }

  if (marketData.volatility && marketData.volatility > 0.10) {
    report.riskAlerts.push({
      level: 'high',
      message: `High market volatility detected: ${(marketData.volatility * 100).toFixed(2)}%`,
      recommendation: 'Reduce position sizes and consider defensive strategies'
    });
  }

  // Generate recommendations (rule-based for now, could use LLM)
  if (report.dailyPnL.total < 0 && report.dailyPnL.percentage < -5) {
    report.recommendations.push({
      type: 'strategy',
      priority: 'high',
      message: 'Consider switching to more conservative strategies or reducing allocation to underperforming strategies',
      action: 'Review strategy performance and consider rebalancing'
    });
  }

  if (report.dailyPnL.total > 0 && report.dailyPnL.percentage > 5) {
    report.recommendations.push({
      type: 'optimization',
      priority: 'low',
      message: 'Strong performance today. Consider maintaining current strategy mix',
      action: 'Continue monitoring performance'
    });
  }

  // Strategy-specific recommendations
  Object.keys(report.strategyPerformance).forEach(strategyName => {
    const perf = report.strategyPerformance[strategyName];
    if (perf.winRate < 0.40 && perf.trades > 5) {
      report.recommendations.push({
        type: 'strategy',
        priority: 'medium',
        message: `${strategyName} strategy showing low win rate (${(perf.winRate * 100).toFixed(1)}%)`,
        action: `Consider reducing allocation to ${strategyName} or reviewing its parameters`
      });
    }
  });

  // Market condition recommendations
  if (report.marketSentiment.volatility === 'high') {
    report.recommendations.push({
      type: 'risk',
      priority: 'high',
      message: 'High volatility market conditions detected',
      action: 'Consider defensive or conservative strategies, reduce position sizes'
    });
  }

  if (report.marketSentiment.trend === 'bullish' && report.dailyPnL.total < 0) {
    report.recommendations.push({
      type: 'opportunity',
      priority: 'medium',
      message: 'Bullish market trend but negative performance',
      action: 'Review entry/exit logic - may be exiting too early or entering too late'
    });
  }

  return report;
}

/**
 * Format digest as text for notifications/emails
 * @param {Object} digest - Daily digest object
 * @returns {string} Formatted text report
 */
function formatDigestAsText(digest) {
  let text = `\n📊 Daily Trading Digest - ${digest.date}\n`;
  text += '='.repeat(50) + '\n\n';

  // Daily P&L
  text += `💰 Daily P&L: ${digest.dailyPnL.total >= 0 ? '+' : ''}$${digest.dailyPnL.total.toFixed(2)} `;
  text += `(${digest.dailyPnL.percentage >= 0 ? '+' : ''}${digest.dailyPnL.percentage.toFixed(2)}%)\n`;
  text += `   Trades: ${digest.dailyPnL.trades} (${digest.dailyPnL.profitableTrades} profitable, ${digest.dailyPnL.losingTrades} losing)\n\n`;

  // Strategy Performance
  text += '⚡ Strategy Performance:\n';
  Object.keys(digest.strategyPerformance).forEach(strategyName => {
    const perf = digest.strategyPerformance[strategyName];
    text += `   ${strategyName}: ${perf.totalPnL >= 0 ? '+' : ''}$${perf.totalPnL.toFixed(2)} `;
    text += `(${(perf.winRate * 100).toFixed(1)}% win rate, ${perf.trades} trades)\n`;
  });
  text += '\n';

  // Market Sentiment
  text += `📈 Market Sentiment: ${digest.marketSentiment.overall.toUpperCase()}\n`;
  text += `   Trend: ${digest.marketSentiment.trend}\n`;
  text += `   Volatility: ${digest.marketSentiment.volatility}\n\n`;

  // Risk Alerts
  if (digest.riskAlerts.length > 0) {
    text += '⚠️ Risk Alerts:\n';
    digest.riskAlerts.forEach(alert => {
      text += `   [${alert.level.toUpperCase()}] ${alert.message}\n`;
      text += `   → ${alert.recommendation}\n`;
    });
    text += '\n';
  }

  // Recommendations
  if (digest.recommendations.length > 0) {
    text += '💡 Recommendations:\n';
    digest.recommendations.forEach(rec => {
      text += `   [${rec.priority.toUpperCase()}] ${rec.message}\n`;
      text += `   → ${rec.action}\n`;
    });
    text += '\n';
  }

  text += '='.repeat(50) + '\n';
  return text;
}

module.exports = {
  generateDailyDigest,
  formatDigestAsText
};

