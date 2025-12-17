# 🚀 KuCoin API Setup Guide for AutoBread

## 📋 Why KuCoin?

KuCoin is often the **easiest exchange** for automated trading bots because:
- ✅ **Lower KYC requirements**
- ✅ **API trading allowed**
- ✅ **Lower minimum deposits**
- ✅ **More lenient rate limits**
- ✅ **Good liquidity for major pairs**

## 🔧 Step-by-Step Setup

### **Step 1: Create KuCoin Account**
1. Go to [KuCoin.com](https://www.kucoin.com)
2. Click "Sign Up"
3. Use email or phone verification
4. **Basic KYC**: Upload ID (passport/driver's license)
5. Wait for verification (usually 24-48 hours)

### **Step 2: Fund Your Account**
1. **Minimum Deposit**: $10-50 USD
2. **Payment Methods**:
   - Bank transfer
   - Credit card
   - Crypto deposit
3. **Recommended**: Start with $50-100 for testing

### **Step 3: Enable API Trading**
1. Go to **API Management** in your account
2. Click **"Create API"**
3. **Permissions to Enable**:
   - ✅ **Spot Trading**
   - ✅ **Futures Trading** (if needed)
   - ❌ **Withdraw** (disable for security)
   - ❌ **Transfer** (disable for security)
4. **Security Settings**:
   - Enable **IP Whitelist** (recommended)
   - Set **Trading Password**
   - Enable **2FA**

### **Step 4: Get API Credentials**
```javascript
// Your API credentials will look like:
const KUCOIN_CONFIG = {
  apiKey: 'your_api_key_here',
  apiSecret: 'your_api_secret_here',
  passphrase: 'your_trading_password_here',
  sandbox: false // Set to true for testing
};
```

### **Step 5: Test API Connection**
```javascript
// Test script for KuCoin
const KuCoin = require('kucoin-node-sdk');

async function testKuCoinConnection() {
  try {
    const client = new KuCoin({
      apiKey: process.env.KUCOIN_API_KEY,
      secretKey: process.env.KUCOIN_SECRET_KEY,
      passphrase: process.env.KUCOIN_PASSPHRASE,
      environment: 'live'
    });

    // Test account info
    const account = await client.getAccounts();
    console.log('✅ KuCoin connection successful');
    console.log('Account balance:', account.data);

    // Test market data
    const ticker = await client.getTicker('BTC-USDT');
    console.log('BTC price:', ticker.data.price);

    return true;
  } catch (error) {
    console.error('❌ KuCoin connection failed:', error);
    return false;
  }
}
```

## 🔧 **KuCoin Integration for AutoBread**

### **Create KuCoin Wrapper**
```typescript
// src/services/kucoinWrapper.ts
import axios from 'axios';
import crypto from 'crypto';

export class KuCoinWrapper {
  private apiKey: string;
  private apiSecret: string;
  private passphrase: string;
  private baseUrl: string = 'https://api.kucoin.com';

  constructor(apiKey: string, apiSecret: string, passphrase: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.passphrase = passphrase;
  }

  private async makeRequest(method: string, endpoint: string, data: any = {}) {
    const timestamp = Date.now().toString();
    const signature = this.createSignature(method, endpoint, timestamp, data);
    const passphrase = this.createPassphrase(timestamp);

    const headers = {
      'KC-API-KEY': this.apiKey,
      'KC-API-SIGN': signature,
      'KC-API-TIMESTAMP': timestamp,
      'KC-API-PASSPHRASE': passphrase,
      'KC-API-KEY-VERSION': '2'
    };

    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers,
        data: method === 'POST' ? data : undefined,
        params: method === 'GET' ? data : undefined
      });

      return response.data;
    } catch (error) {
      console.error('KuCoin API error:', error.response?.data || error.message);
      throw error;
    }
  }

  private createSignature(method: string, endpoint: string, timestamp: string, data: any): string {
    const message = timestamp + method + endpoint + JSON.stringify(data);
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(message)
      .digest('base64');
  }

  private createPassphrase(timestamp: string): string {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(this.passphrase + timestamp)
      .digest('base64');
  }

  // Get account balance
  async getBalance() {
    return this.makeRequest('GET', '/api/v1/accounts');
  }

  // Get market data
  async getTicker(symbol: string) {
    return this.makeRequest('GET', `/api/v1/market/orderbook/level1?symbol=${symbol}`);
  }

  // Place order
  async placeOrder(orderData: {
    symbol: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    size: string;
    price?: string;
  }) {
    return this.makeRequest('POST', '/api/v1/orders', orderData);
  }

  // Get order status
  async getOrder(orderId: string) {
    return this.makeRequest('GET', `/api/v1/orders/${orderId}`);
  }

  // Cancel order
  async cancelOrder(orderId: string) {
    return this.makeRequest('DELETE', `/api/v1/orders/${orderId}`);
  }
}
```

### **Update Environment Variables**
```bash
# .env file
KUCOIN_API_KEY=your_kucoin_api_key
KUCOIN_SECRET_KEY=your_kucoin_secret_key
KUCOIN_PASSPHRASE=your_trading_password
KUCOIN_SANDBOX=false
```

### **Test KuCoin Integration**
```javascript
// test-kucoin.js
const { KuCoinWrapper } = require('./src/services/kucoinWrapper');
require('dotenv').config();

async function testKuCoinTrading() {
  try {
    console.log('🚀 Testing KuCoin API Trading...');
    
    const kucoin = new KuCoinWrapper(
      process.env.KUCOIN_API_KEY,
      process.env.KUCOIN_SECRET_KEY,
      process.env.KUCOIN_PASSPHRASE
    );

    // Test 1: Get balance
    console.log('📊 Checking balance...');
    const balance = await kucoin.getBalance();
    console.log('Balance:', balance.data);

    // Test 2: Get BTC price
    console.log('💰 Getting BTC price...');
    const ticker = await kucoin.getTicker('BTC-USDT');
    console.log('BTC price:', ticker.data.price);

    // Test 3: Place small test order (if balance sufficient)
    const usdtBalance = balance.data.find(acc => acc.currency === 'USDT');
    if (usdtBalance && parseFloat(usdtBalance.available) > 10) {
      console.log('📈 Placing test order...');
      const order = await kucoin.placeOrder({
        symbol: 'BTC-USDT',
        side: 'buy',
        type: 'market',
        size: '0.0001' // ~$5 worth
      });
      console.log('Order placed:', order.data);
    } else {
      console.log('⚠️ Insufficient USDT balance for test order');
    }

    console.log('✅ KuCoin trading test completed!');
    
  } catch (error) {
    console.error('❌ KuCoin test failed:', error.message);
  }
}

testKuCoinTrading();
```

## 🎯 **Alternative Exchanges**

### **If KuCoin Doesn't Work:**

#### **1. Bybit**
- ✅ **Easy API setup**
- ✅ **Good for automated trading**
- ❌ **Requires KYC**

#### **2. OKX**
- ✅ **API trading allowed**
- ✅ **Lower requirements**
- ❌ **May have regional restrictions**

#### **3. Gate.io**
- ✅ **API trading supported**
- ✅ **Lower minimums**
- ❌ **Less liquidity**

## 🚨 **Important Considerations**

### **Legal & Compliance**
1. **Check your country's regulations**
2. **Ensure automated trading is legal**
3. **Pay taxes on trading profits**
4. **Keep detailed records**

### **Security Best Practices**
1. **Never share API keys**
2. **Use IP whitelisting**
3. **Disable withdrawal permissions**
4. **Use strong passwords**
5. **Enable 2FA**

### **Risk Management**
1. **Start with small amounts**
2. **Test thoroughly before scaling**
3. **Set strict loss limits**
4. **Monitor continuously**

## 📞 **Support Resources**

- **KuCoin Support**: [support.kucoin.com](https://support.kucoin.com)
- **API Documentation**: [docs.kucoin.com](https://docs.kucoin.com)
- **Community**: [Reddit r/kucoin](https://reddit.com/r/kucoin)

---

**KuCoin is often the easiest exchange to get started with API trading. Follow this guide step-by-step, and you should be able to get your AutoBread bot trading with real money!** 🚀 