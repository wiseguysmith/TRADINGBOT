# Phase 2 Upgrade: Unified Config + Database Foundation

## ✅ Completed

### 1. Unified Config System

**Created:** `src/config/index.ts`
- Single source of truth for all configuration
- Loads from `.env` file
- Includes validation function
- Exports `CONFIG` object with all settings

**Updated:**
- `src/services/quant/quantConfig.ts` - Now imports from unified config

### 2. Database Schema (Prisma)

**Created:** `prisma/schema.prisma`

#### Models Created:

1. **Trade**
   - Trade execution records
   - Links to Signal and Position
   - Tracks P&L, fees, slippage, latency
   - Indexed by symbol, status, strategy, exchange

2. **Position**
   - Open/closed positions
   - Tracks unrealized/realized P&L
   - Links to multiple trades
   - Indexed by symbol, status

3. **Signal**
   - Combined TS + Python signals
   - Stores technical and quant components
   - Links to trades
   - Indexed by symbol, timestamp, action

4. **StrategyConfig**
   - Strategy configurations
   - Stores parameters as JSON
   - Tracks performance metrics
   - Indexed by type, enabled status

5. **PerformanceSnapshot**
   - Portfolio performance snapshots
   - Daily metrics, risk metrics
   - Strategy breakdown
   - Indexed by timestamp

6. **MarketDataCache**
   - Cached OHLCV data
   - Optional indicator caching
   - TTL-based expiration
   - Indexed by symbol, timeframe

7. **RiskEvent**
   - Risk management events
   - Tracks warnings, errors, blocks
   - Resolution tracking
   - Indexed by type, severity

**Created:** `src/lib/prisma.ts`
- Prisma Client singleton
- Prevents multiple instances
- Development logging enabled

### 3. Environment Variables

Add to `.env`:

```env
# Database
DATABASE_URL=file:./autobread.db

# Exchanges
KRAKEN_API_KEY=your_key
KRAKEN_API_SECRET=your_secret
KUCOIN_API_KEY=your_key
KUCOIN_API_SECRET=your_secret
KUCOIN_API_PASSPHRASE=your_passphrase

# Quant Server
PYTHON_API_URL=http://localhost:8000

# Trading
POLLING_INTERVAL_MS=1000
RISK_LIMIT_DAILY_LOSS=0.03
MAX_POSITION_SIZE=0.1
MAX_DAILY_TRADES=50
MAX_DRAWDOWN_PERCENTAGE=25
RISK_PER_TRADE_PERCENTAGE=20

# Quant Signals
QUANT_TIMEOUT_MS=2000
QUANT_RETRY_COUNT=3
QUANT_SIGNAL_WEIGHT=0.5
TRADITIONAL_SIGNAL_WEIGHT=0.5

# External Data
EXTERNAL_DATA_ENABLED=true
GOOGLE_TRENDS_ENABLED=true
GITHUB_API_KEY=your_key

# Notifications
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id
```

## 📋 Next Steps

### 1. Install Prisma

```bash
npm install prisma @prisma/client --save-dev
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Create Database

```bash
npx prisma migrate dev --name init
```

### 4. Update Python Config

Update `python_api/config/settings.py` to read from same `.env`:

```python
from dotenv import load_dotenv
import os

# Load from root .env
load_dotenv(dotenv_path=Path(__file__).parent.parent.parent / '.env')

QUANT_API_HOST = os.getenv("QUANT_API_HOST", "0.0.0.0")
QUANT_API_PORT = int(os.getenv("QUANT_API_PORT", "8000"))
# ... etc
```

### 5. Migrate Existing Code

Update all services to use `CONFIG` from `src/config/index.ts`:

- `src/services/krakenWrapper.ts`
- `src/services/kucoinWrapper.ts`
- `src/services/riskManager.ts`
- `src/services/strategyService.ts`
- `src/services/liveTradingEngine.ts`
- `src/services/productionTradingEngine.ts`

### 6. Create Database Service Layer

Create services for:
- Trade persistence
- Signal logging
- Performance tracking
- Market data caching

## 📁 File Structure

```
src/
├── config/
│   └── index.ts          ✅ Unified config
├── lib/
│   └── prisma.ts         ✅ Prisma client singleton
└── services/
    └── quant/
        └── quantConfig.ts ✅ Updated to use unified config

prisma/
├── schema.prisma          ✅ Database schema
└── .gitignore            ✅ Ignore DB files
```

## 🎯 Benefits

1. **Single Config Source** - All config in one place
2. **Type Safety** - TypeScript types for all config
3. **Validation** - Config validation on startup
4. **Database Ready** - Full schema for trades, signals, performance
5. **Python Compatible** - Python can read same `.env`
6. **Production Ready** - PostgreSQL support ready

## ⚠️ Important Notes

- SQLite for development (file:./autobread.db)
- PostgreSQL for production (set DATABASE_URL)
- Prisma migrations track schema changes
- Database files ignored in git (.gitignore)

---

**Status:** ✅ Phase 2 Foundation Complete
**Next:** Install Prisma and run migrations

