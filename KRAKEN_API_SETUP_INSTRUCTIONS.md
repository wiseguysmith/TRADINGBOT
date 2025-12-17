# Kraken API Setup Instructions

## 🔧 Fix Your API Key Issue

Your current API key is invalid. Follow these steps to create a new one:

### Step 1: Go to Kraken API Settings
1. Visit: https://www.kraken.com/u/settings/api
2. Log in to your Kraken account

### Step 2: Create New API Key
1. Click "Add API Key"
2. **Name**: `AutoBread Trading Bot`
3. **Permissions** (check these boxes):
   - ✅ **Query Funds** (required to read balance)
   - ✅ **Trade** (required to place orders)
   - ✅ **Query Open Orders & Trades** (required to check orders)
4. **IP Restrictions**: Leave blank for now
5. Click "Generate API Key"

### Step 3: Copy Credentials
- **API Key**: Copy the public key (starts with something like `rWNGTgOa...`)
- **Private Key**: Copy the private key (starts with something like `uCU6V5/j...`)

### Step 4: Update .env File
Replace your current credentials in the `.env` file:

```
KRAKEN_API_KEY=your_new_api_key_here
KRAKEN_API_SECRET=your_new_private_key_here
```

### Step 5: Test the Connection
Run this command to verify:
```bash
node test-kraken-direct.js
```

You should see:
- ✅ Public API working!
- ✅ Private API working!
- ✅ Balance data received (no errors)

### Step 6: Start Real Trading
Once the API test passes, you can:
1. Visit: http://localhost:3003/production
2. Click "Start Production Trading"
3. Watch real money trades execute!

## ⚠️ Important Notes:
- Keep your API keys secure
- Never share your private key
- Start with small amounts for testing
- The bot will trade with your actual Kraken balance 