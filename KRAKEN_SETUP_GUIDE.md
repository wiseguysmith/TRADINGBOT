# 🔑 Kraken API Setup Guide

## **Step 1: Create Kraken Account**
1. Go to [Kraken.com](https://www.kraken.com) and create an account
2. Complete identity verification (required for API access)
3. Add funds to your account (minimum $125 for XRP trading)

## **Step 2: Generate API Keys**
1. Log into your Kraken account
2. Go to **Security** → **API** → **Add API Key**
3. **IMPORTANT**: Enable these permissions:
   - ✅ **Query Funds** (required to read balance)
   - ✅ **Query Orders** (required to read order history)
   - ✅ **Add & Cancel Orders** (required for trading)
   - ❌ **Withdraw Funds** (disable for security)

## **Step 3: Configure Environment**
1. Copy your API Key and Private Key
2. Create a `.env` file in the project root:
   ```bash
   KRAKEN_API_KEY=your_api_key_here
   KRAKEN_API_SECRET=your_private_key_here
   ```

## **Step 4: Test Connection**
1. Start the development server: `npm run dev`
2. Open: `http://localhost:3002/production`
3. The dashboard should show your real Kraken balance

## **🔒 Security Best Practices**
- Never share your API keys
- Use API keys with minimal required permissions
- Regularly rotate your API keys
- Monitor your account activity
- Start with small amounts for testing

## **💰 XRP Trading Setup**
- **Initial Investment**: $125
- **Target**: $200 (60% profit)
- **Trading Pairs**: XRP/USD, XRP/USDT
- **Risk Management**: 20% max drawdown

## **🚨 Important Notes**
- This is real money trading - start small
- Monitor the dashboard closely
- Use emergency stop if needed
- Past performance doesn't guarantee future results

## **📞 Support**
If you encounter issues:
1. Check your API key permissions
2. Verify your account has sufficient funds
3. Ensure your account is verified
4. Check the console for error messages 