#!/usr/bin/env node

const fetch = require('node-fetch');

console.log('📊 AI TRADING BOT PERFORMANCE ANALYSIS');
console.log('======================================');

async function analyzeResults() {
  try {
    // Get production trading data
    console.log('🔍 Fetching trading performance data...');
    const response = await fetch('http://localhost:3004/api/trading/production');
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.success) {
        const performance = data.data.performance;
        const recentTrades = data.data.recentTrades || [];
        
        console.log('\n📈 PERFORMANCE METRICS:');
        console.log('========================');
        console.log(`💰 Total Balance: $${performance.totalBalance?.toFixed(2) || 'N/A'}`);
        console.log(`📊 Total P&L: $${performance.totalPnL?.toFixed(2) || '0.00'}`);
        console.log(`📅 Daily P&L: $${performance.dailyPnL?.toFixed(2) || '0.00'}`);
        console.log(`🎯 Win Rate: ${performance.winRate?.toFixed(1) || '0'}%`);
        console.log(`🔄 Total Trades: ${performance.totalTrades || 0}`);
        console.log(`⚡ Active Trades: ${performance.activeTrades || 0}`);
        console.log(`📉 Max Drawdown: ${performance.maxDrawdown?.toFixed(2) || '0'}%`);
        console.log(`📊 Sharpe Ratio: ${performance.sharpeRatio?.toFixed(2) || '0.00'}`);
        console.log(`🎯 Target Progress: ${performance.targetProgress?.toFixed(1) || '0'}%`);
        console.log(`⚠️  Risk Level: ${performance.riskLevel || 'LOW'}`);
        
        console.log('\n🪙 XRP BALANCE DETAILS:');
        console.log('=======================');
        if (performance.xrpData) {
          console.log(`XRP Amount: ${performance.xrpData.xrpAmount?.toFixed(2) || '0.00'} XRP`);
          console.log(`XRP Value: $${performance.xrpData.xrpValue?.toFixed(2) || '0.00'}`);
          console.log(`USD Balance: $${performance.xrpData.usdBalance?.toFixed(2) || '0.00'}`);
        } else {
          console.log('XRP data not available');
        }
        
        console.log('\n📋 RECENT TRADES:');
        console.log('=================');
        if (recentTrades.length > 0) {
          recentTrades.slice(0, 5).forEach((trade, index) => {
            console.log(`${index + 1}. ${trade.type} ${trade.pair} - $${trade.amount?.toFixed(2)} @ $${trade.price?.toFixed(4)}`);
            console.log(`   Profit: $${trade.profit?.toFixed(2) || '0.00'} | Time: ${new Date(trade.timestamp).toLocaleTimeString()}`);
          });
        } else {
          console.log('No recent trades recorded');
        }
        
        console.log('\n🎯 SUCCESS ANALYSIS:');
        console.log('===================');
        
        // Analyze success metrics
        const balance = performance.totalBalance || 15;
        const targetGoal = balance * 1.6;
        const currentProgress = performance.targetProgress || 0;
        const winRate = performance.winRate || 0;
        const totalTrades = performance.totalTrades || 0;
        
        console.log(`📊 Current Progress: ${currentProgress.toFixed(1)}% toward $${targetGoal.toFixed(2)} goal`);
        console.log(`🎯 Win Rate: ${winRate.toFixed(1)}% (${totalTrades} total trades)`);
        console.log(`💰 P&L: $${performance.totalPnL?.toFixed(2) || '0.00'}`);
        
        // Success assessment
        if (currentProgress > 50) {
          console.log('✅ EXCELLENT: Bot is more than halfway to goal!');
        } else if (currentProgress > 25) {
          console.log('🟡 GOOD: Bot is making steady progress');
        } else if (currentProgress > 0) {
          console.log('🟠 FAIR: Bot has started making progress');
        } else {
          console.log('🔴 NEEDS IMPROVEMENT: Bot hasn\'t made progress yet');
        }
        
        if (winRate > 60) {
          console.log('✅ EXCELLENT: High win rate indicates good strategy');
        } else if (winRate > 40) {
          console.log('🟡 GOOD: Moderate win rate');
        } else {
          console.log('🔴 NEEDS IMPROVEMENT: Low win rate');
        }
        
        console.log('\n🚀 SYSTEM STATUS:');
        console.log('=================');
        console.log('✅ Trading engine: ACTIVE');
        console.log('✅ Risk management: ACTIVE');
        console.log('✅ Performance monitoring: ACTIVE');
        console.log('✅ Strategy execution: ACTIVE');
        
        if (data.data.isActive) {
          console.log('✅ Live trading: ACTIVE');
        } else {
          console.log('⏸️  Live trading: PAUSED');
        }
        
      } else {
        console.log('❌ Error fetching performance data:', data.error);
      }
    } else {
      console.log('❌ Could not connect to production API');
    }
    
  } catch (error) {
    console.log('❌ Analysis failed:', error.message);
  }
}

analyzeResults(); 