const { KrakenWrapper } = require('./src/services/krakenWrapper');
require('dotenv').config();

async function executeMicroTrade() {
  try {
    console.log('🚀 Starting micro-trade validation...');
    
    // Initialize Kraken wrapper
    const kraken = new KrakenWrapper(
      process.env.KRAKEN_API_KEY,
      process.env.KRAKEN_API_SECRET
    );
    
    // Test 1: Check balance
    console.log('📊 Checking account balance...');
    const balance = await kraken.getBalance();
    console.log('Balance result:', balance);
    
    if (balance.error && balance.error.length > 0) {
      throw new Error(`Balance check failed: ${balance.error.join(', ')}`);
    }
    
    // Test 2: Get current BTC price
    console.log('💰 Getting current BTC price...');
    const ticker = await kraken.getTickerInformation(['XBTUSD']);
    console.log('Ticker result:', ticker);
    
    if (ticker.error && ticker.error.length > 0) {
      throw new Error(`Ticker check failed: ${ticker.error.join(', ')}`);
    }
    
    // Test 3: Execute micro-trade (only if balance is sufficient)
    const btcPrice = parseFloat(ticker.result.XXBTZUSD.c[0]);
    const microAmount = 0.0001; // ~$5 worth of BTC
    const estimatedCost = btcPrice * microAmount;
    
    console.log(`💸 Estimated cost: $${estimatedCost.toFixed(2)}`);
    
    // Check if we have enough balance
    const usdBalance = parseFloat(balance.result.ZUSD || '0');
    if (usdBalance < estimatedCost) {
      console.log(`⚠️  Insufficient USD balance. Need $${estimatedCost.toFixed(2)}, have $${usdBalance.toFixed(2)}`);
      console.log('💰 Please add funds to test real trading');
      return;
    }
    
    console.log('✅ Sufficient balance, proceeding with micro-trade...');
    
    // Execute micro-trade
    const orderData = {
      pair: 'XBTUSD',
      type: 'buy',
      ordertype: 'market',
      volume: microAmount.toString()
    };
    
    console.log('📈 Executing micro-trade...');
    const result = await kraken.addOrder(orderData);
    console.log('Micro-trade result:', result);
    
    // Validate order execution
    if (result.error && result.error.length > 0) {
      throw new Error(`Trade failed: ${result.error.join(', ')}`);
    }
    
    console.log('✅ Micro-trade executed successfully!');
    console.log('Order ID:', result.result.txid[0]);
    
    // Test 4: Check order status
    console.log('🔍 Checking order status...');
    const orderStatus = await kraken.getOrderStatus(result.result.txid[0]);
    console.log('Order status:', orderStatus);
    
    return result;
    
  } catch (error) {
    console.error('❌ Micro-trade failed:', error.message);
    console.error('Full error:', error);
    throw error;
  }
}

async function testKrakenConnection() {
  try {
    console.log('🔗 Testing Kraken API connection...');
    
    const kraken = new KrakenWrapper(
      process.env.KRAKEN_API_KEY,
      process.env.KRAKEN_API_SECRET
    );
    
    // Test public endpoints
    console.log('📊 Testing public endpoints...');
    const pairs = await kraken.getTradablePairs();
    console.log('Tradable pairs count:', Object.keys(pairs.result || {}).length);
    
    // Test private endpoints
    console.log('🔐 Testing private endpoints...');
    const balance = await kraken.getBalance();
    console.log('Balance check successful:', !balance.error);
    
    console.log('✅ Kraken API connection test passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Kraken API connection test failed:', error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('🤖 AutoBread Real Trading Validation');
    console.log('=====================================');
    
    // Check environment variables
    if (!process.env.KRAKEN_API_KEY || !process.env.KRAKEN_API_SECRET) {
      console.error('❌ Missing Kraken API credentials in .env file');
      console.log('Please add:');
      console.log('KRAKEN_API_KEY=your_api_key');
      console.log('KRAKEN_API_SECRET=your_api_secret');
      return;
    }
    
    // Test connection first
    const connectionOk = await testKrakenConnection();
    if (!connectionOk) {
      console.error('❌ Cannot proceed without valid API connection');
      return;
    }
    
    // Execute micro-trade
    await executeMicroTrade();
    
    console.log('🎉 Real trading validation completed successfully!');
    console.log('Next steps:');
    console.log('1. Review the trade results above');
    console.log('2. Check your Kraken account for the executed trade');
    console.log('3. Proceed with implementing real trading engine');
    
  } catch (error) {
    console.error('💥 Validation failed:', error.message);
    console.log('Please check your API credentials and try again');
  }
}

// Run the test
if (require.main === module) {
  main();
}

module.exports = { executeMicroTrade, testKrakenConnection }; 