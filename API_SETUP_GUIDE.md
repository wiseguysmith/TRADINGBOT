# 🔑 API Setup Guide for AI Trading Bot

## 📋 **Quick Setup Checklist**

- [ ] Kraken API Key & Secret
- [ ] Twilio Account SID & Auth Token (optional)
- [ ] Twilio Phone Number (optional)
- [ ] Create `.env` file
- [ ] Test API connections

---

## 🏦 **Step 1: Kraken API Setup (REQUIRED)**

### 1.1 Create Kraken Account
1. Go to [https://www.kraken.com](https://www.kraken.com)
2. Click **"Create Account"**
3. Complete verification (email, phone, ID)
4. **Important**: Enable 2FA for security

### 1.2 Generate API Keys
1. Login to Kraken
2. Go to **Settings** → **API** or visit: [https://www.kraken.com/u/settings/api](https://www.kraken.com/u/settings/api)
3. Click **"Add API Key"**
4. Fill in the form:
   - **Key Name**: `AI Trading Bot`
   - **Key Permissions**: Select these EXACT permissions:
     - ✅ **Query Funds**
     - ✅ **Query Open Orders & Trades**
     - ✅ **Query Closed Orders & Trades**
     - ✅ **Query Ledgers**
     - ✅ **Query Trade Balance**
     - ✅ **Query Open Orders**
     - ✅ **Add & Cancel Orders**
     - ❌ **Withdraw Funds** (leave unchecked)
     - ❌ **Transfer Between Spot & Staking** (leave unchecked)

### 1.3 Save Your Credentials
After creating the API key, you'll see:
- **API Key**: `Ql/SUgKLK9m6mJ7x...` (long string)
- **Private Key**: `kQH5WS/87p+...` (long string)

**⚠️ IMPORTANT**: Copy both immediately! You won't see the private key again.

### 1.4 Security Tips
- Store keys securely (password manager recommended)
- Never share your private key
- Use a dedicated Kraken account for bot trading
- Start with small amounts for testing

---

## 📱 **Step 2: Twilio Setup (OPTIONAL - for SMS notifications)**

### 2.1 Create Twilio Account
1. Go to [https://www.twilio.com](https://www.twilio.com)
2. Click **"Sign up for free"**
3. Complete registration
4. **Free account includes $15-20 credit**

### 2.2 Get Account Credentials
1. Go to [https://console.twilio.com/](https://console.twilio.com/)
2. Find your **Account SID** and **Auth Token**
3. Copy both values

### 2.3 Get Phone Number
1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Active numbers**
2. Click **"Get a trial number"**
3. Choose a number for sending SMS
4. Copy the phone number

### 2.4 Verify Your Phone (for receiving notifications)
1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Verified Caller IDs**
2. Add your personal phone number
3. Enter the verification code sent to your phone

---

## ⚙️ **Step 3: Create Environment File**

### 3.1 Copy Template
```bash
# Copy the template file
cp env-template.txt .env
```

### 3.2 Edit .env File
Open `.env` file and replace the placeholder values:

```env
# Kraken API (REQUIRED)
KRAKEN_API_KEY=Ql/SUgKLK9m6mJ7x...your_actual_api_key
KRAKEN_API_SECRET=kQH5WS/87p+...your_actual_private_key

# Twilio (OPTIONAL)
TWILIO_ACCOUNT_SID=AC1234567890abcdef...your_account_sid
TWILIO_AUTH_TOKEN=1234567890abcdef...your_auth_token
TWILIO_PHONE_NUMBER=+1234567890...your_twilio_number
NOTIFICATION_PHONE_NUMBER=+1234567890...your_personal_number

# Trading Configuration (already set for $100)
MAX_DRAWDOWN_PERCENTAGE=25
RISK_PER_TRADE_PERCENTAGE=20
VOLATILITY_LOOKBACK_PERIOD=14
```

---

## 🧪 **Step 4: Test Your Setup**

### 4.1 Start the Application
```bash
npm run dev
```

### 4.2 Check API Connections
1. Open [http://localhost:3000](http://localhost:3000)
2. Check the dashboard for any error messages
3. Look for "Live" status indicator
4. Try loading price charts

### 4.3 Test SMS Notifications (if using Twilio)
1. Enable auto-trading in test mode
2. Check if you receive SMS notifications
3. Verify phone numbers are correct

---

## 🔒 **Security Best Practices**

### API Key Security
- ✅ Use dedicated Kraken account for bot
- ✅ Enable 2FA on Kraken account
- ✅ Store keys in password manager
- ✅ Never commit `.env` file to git
- ✅ Use minimal required permissions

### Trading Safety
- ✅ Start with test mode
- ✅ Use small amounts initially
- ✅ Monitor bot performance daily
- ✅ Set up emergency stop procedures
- ✅ Keep backup of API keys

---

## 🚨 **Troubleshooting**

### Common Issues:

**"API Key Invalid" Error:**
- Check API key and secret are correct
- Verify API key permissions
- Ensure account is verified

**"Rate Limit Exceeded" Error:**
- Kraken has rate limits
- Bot respects these automatically
- Wait a few minutes and retry

**"Insufficient Funds" Error:**
- Add funds to your Kraken account
- Check minimum trade amounts
- Verify account verification level

**SMS Notifications Not Working:**
- Check Twilio credentials
- Verify phone numbers are correct
- Check Twilio account has credit
- Ensure phone number is verified

---

## 📞 **Support**

If you encounter issues:
1. Check Kraken API documentation
2. Check Twilio documentation
3. Review error messages in browser console
4. Ensure all environment variables are set correctly

---

## ✅ **Next Steps After API Setup**

1. **Test Mode**: Start with paper trading
2. **Monitor**: Watch performance for 1-2 weeks
3. **Adjust**: Fine-tune settings based on results
4. **Live Trading**: Switch to live mode when confident
5. **Scale**: Increase investment if successful

**Remember**: Start conservatively and only invest what you can afford to lose! 