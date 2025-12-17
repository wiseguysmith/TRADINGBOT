# AutoBread - AI-Powered Crypto Trading Bot

## 🚀 Project Overview

AutoBread is a sophisticated, full-stack cryptocurrency trading bot that combines multiple trading strategies with real-time market data, advanced risk management, and a modern web interface. The bot is designed to operate autonomously while providing comprehensive monitoring and control capabilities.

## 🏗️ Architecture Overview

### **Core Components**

#### **1. Trading Engine (`src/services/liveTradingEngine.ts`)**
- **Purpose**: Simulates live trading with real-time performance tracking
- **Features**: 
  - Generates simulated trades every 5 seconds
  - Tracks portfolio performance, win rates, and risk metrics
  - Manages multiple concurrent strategies
  - Provides historical data for visual charts

#### **2. Exchange Integration (`src/services/krakenWrapper.ts`)**
- **Exchanges**: Kraken (primary), Binance, CoinGecko
- **Libraries**: Custom wrappers using `axios` for HTTP requests
- **Features**:
  - Real-time market data fetching
  - Order placement and management
  - Balance and position tracking
  - Rate limiting and error handling

#### **3. Strategy Engine (`src/utils/strategies.ts`)**
- **Strategies Implemented**:
  - **Mean Reversion**: RSI + Bollinger Bands
  - **Trend Following**: EMA crossovers with volume confirmation
  - **Arbitrage**: Cross-exchange and triangular arbitrage
  - **Grid Trading**: Automated buy/sell at price levels
  - **Volatility Breakout**: ATR-based breakout detection

#### **4. Risk Management (`src/services/riskManager.ts`)**
- **Risk Profiles**: Conservative, Moderate, Aggressive
- **Features**:
  - Dynamic position sizing based on volatility
  - Adaptive stop-loss and take-profit levels
  - Daily loss limits and drawdown protection
  - Autonomous risk adjustment based on market conditions

#### **5. Backtesting Engine (`src/services/backtestingEngine.ts`)**
- **Purpose**: Test strategies on historical data
- **Features**:
  - Real market data integration (Kraken, Binance, CoinGecko)
  - Comprehensive performance metrics (Sharpe, Sortino, Calmar ratios)
  - Strategy optimization with parameter sweeping
  - Data quality validation and scoring

#### **6. Market Data Service (`src/services/marketDataService.ts`)**
- **Data Sources**: Kraken, Binance, CoinGecko APIs
- **Features**:
  - Intelligent caching with time-based expiration
  - Data validation and quality scoring
  - Rate limiting and error handling
  - Multiple timeframe support (1m to 1d)

## 📊 Current Features

### **Live Trading (Simulated)**
- Real-time portfolio tracking
- Multi-strategy execution
- Performance analytics
- Visual progress charts
- Trade history and statistics

### **Risk Management**
- 3-tier risk profiles (Conservative/Moderate/Aggressive)
- Dynamic position sizing
- Adaptive stop-loss/take-profit
- Daily loss limits
- Maximum drawdown protection

### **Strategy Portfolio**
- **Mean Reversion** (40% allocation)
- **Arbitrage** (30% allocation)
- **Grid Trading** (20% allocation)
- **ML Prediction** (10% allocation)

### **User Interface**
- Modern, responsive dashboard
- Real-time performance metrics
- Interactive progress charts
- Strategy performance tracking
- Trade history and analytics

## 🔧 Technical Stack

### **Frontend**
- **Framework**: Next.js 14 with React 18
- **Styling**: Tailwind CSS
- **Charts**: Custom Canvas-based charts + ApexCharts
- **State Management**: React hooks

### **Backend**
- **Runtime**: Node.js with TypeScript
- **API**: Next.js API routes
- **HTTP Client**: Axios
- **Authentication**: JWT with bcryptjs

### **Data & Analytics**
- **Market Data**: Kraken, Binance, CoinGecko APIs
- **Caching**: In-memory with time-based expiration
- **Validation**: Custom data quality scoring
- **Indicators**: RSI, MACD, Bollinger Bands, EMA, ATR

### **Notifications**
- **SMS**: Twilio integration
- **Telegram**: Custom bot integration
- **Email**: Ready for integration

## 🚦 Current Status

### **✅ Completed**
- Live trading simulation engine
- Multi-strategy framework
- Real-time performance tracking
- Risk management system
- Backtesting engine with real data
- Modern web interface
- API integrations (Kraken, Binance, CoinGecko)
- Telegram notifications
- Data caching and validation

### **🔄 In Progress**
- Real trade execution (currently simulated)
- Advanced ML models
- Social trading features
- Mobile app development

### **📋 Planned**
- Real-time market data feeds
- Advanced sentiment analysis
- Copy trading functionality
- White-label SaaS platform

## 🎯 User Interaction Points

### **Dashboard (`/dashboard`)**
- **Start/Stop Trading**: Control the bot's operation
- **Performance Metrics**: Real-time balance, P&L, win rate
- **Progress Chart**: Visual representation of portfolio growth
- **Strategy Performance**: Individual strategy tracking
- **Recent Trades**: Live trade history

### **Analytics (`/analytics`)**
- **Detailed Metrics**: Sharpe ratio, max drawdown, profit factor
- **Performance Analysis**: Win/loss statistics, consecutive trades
- **Risk Assessment**: Current risk profile and market conditions

### **Configuration**
- **Risk Profile**: Conservative/Moderate/Aggressive
- **Strategy Allocation**: Adjust strategy percentages
- **API Keys**: Kraken, Binance, Telegram setup
- **Notifications**: Alert preferences

## 🧪 Testing & Backtesting

### **Backtesting Framework**
- **Engine**: Custom backtesting engine
- **Data**: Real historical data from multiple exchanges
- **Metrics**: 15+ performance indicators
- **Optimization**: Parameter sweeping and optimization

### **Testing Scripts**
- `test-live-trading.js`: Live trading engine testing
- `test-real-data.js`: Market data integration testing
- `test-telegram.js`: Notification system testing
- `test-api.js`: API connectivity testing

## 🔐 Security & Risk Management

### **Risk Controls**
- Maximum daily loss limits
- Position size limits
- Stop-loss and take-profit orders
- Drawdown protection
- Volatility-based adjustments

### **Security Features**
- API key encryption
- Rate limiting
- Error handling and logging
- Data validation
- Secure authentication

## 📈 Performance Metrics

### **Key Indicators**
- **Total Return**: Overall portfolio performance
- **Sharpe Ratio**: Risk-adjusted returns
- **Max Drawdown**: Largest peak-to-trough decline
- **Win Rate**: Percentage of profitable trades
- **Profit Factor**: Ratio of gross profit to gross loss

### **Risk Metrics**
- **Value at Risk (VaR)**: Potential loss estimation
- **Expected Shortfall**: Average loss beyond VaR
- **Calmar Ratio**: Return vs max drawdown
- **Sortino Ratio**: Downside risk-adjusted returns

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ and npm
- Kraken API key and secret
- Binance API key and secret (optional)
- Telegram bot token (optional)

### **Installation**
```bash
# Clone the repository
git clone <repository-url>
cd AI-Trading-Bot

# Install dependencies
npm install

# Set up environment variables
cp env-template.txt .env
# Edit .env with your API keys

# Start development server
npm run dev
```

### **Configuration**
1. **API Keys**: Add Kraken and Binance credentials to `.env`
2. **Risk Profile**: Choose Conservative/Moderate/Aggressive
3. **Initial Investment**: Set starting capital
4. **Notifications**: Configure Telegram/SMS alerts

### **Testing**
```bash
# Test API connections
npm run test-api

# Test live trading
node test-live-trading.js

# Test market data
node test-real-data.js
```

## 📱 User Experience

### **For Non-Technical Users**
- **Simple Dashboard**: One-click start/stop trading
- **Visual Progress**: Clear charts showing money growth
- **Easy Configuration**: Dropdown menus for settings
- **Real-time Updates**: Live performance tracking
- **Mobile Responsive**: Works on all devices

### **For Advanced Users**
- **Strategy Customization**: Adjust parameters and allocations
- **Backtesting**: Test strategies on historical data
- **API Access**: Programmatic control and monitoring
- **Detailed Analytics**: Comprehensive performance metrics

## 🎯 Success Metrics

### **Performance Targets**
- **Monthly Return**: 20% target
- **Max Drawdown**: 10% limit
- **Win Rate**: 60%+ target
- **Sharpe Ratio**: >1.5 target

### **Risk Management**
- **Daily Loss Limit**: 5% maximum
- **Position Size**: 1-5% per trade
- **Stop Loss**: 2-4% per trade
- **Take Profit**: 4-8% per trade

## 🔮 Future Roadmap

### **Phase 1: Production Ready**
- Real trade execution
- Advanced ML models
- Enhanced risk management
- Mobile app

### **Phase 2: SaaS Platform**
- Multi-tenant architecture
- Subscription management
- Strategy marketplace
- White-label solution

### **Phase 3: Advanced Features**
- Social trading
- Copy trading
- Advanced analytics
- AI-powered insights

## 📞 Support & Documentation

- **Setup Guide**: `AUTOBREAD_SETUP_GUIDE.md`
- **API Documentation**: `API_SETUP_GUIDE.md`
- **Safety Guidelines**: `SAFETY_GUIDE.md`
- **Business Plan**: `SAAS_BUSINESS_PLAN.md`

## ⚠️ Disclaimer

This is a trading bot for educational and research purposes. Cryptocurrency trading involves significant risk. Always start with small amounts and never invest more than you can afford to lose. Past performance does not guarantee future results.

---

**AutoBread** - The Future of Automated Trading 🤖📈
