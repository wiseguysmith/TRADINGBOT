# Paper Trading Guide

## Overview

Paper trading allows you to test your trading strategies using **real market data** but **simulated execution** - meaning no real orders are placed and no real money is at risk. This is the perfect way to validate your strategies before going live.

## Key Features

- ✅ **Real Market Data**: Uses live prices from Kraken/KuCoin
- ✅ **Simulated Execution**: No real orders placed - completely safe
- ✅ **Full Governance Pipeline**: All risk management and governance checks execute
- ✅ **Realistic Simulation**: Includes fees, slippage, and latency
- ✅ **Perfect for Testing**: Test strategies safely before risking real capital

## Quick Start

### Option 1: Standalone Paper Trading Script

```bash
npm run paper-trading
```

This runs the dedicated paper trading script that initializes everything in simulation mode.

### Option 2: Via Main Entry Point

```bash
node main.js start --mode=simulation
```

Or set in your `.env` file:
```env
TRADING_MODE=simulation
```

Then run:
```bash
node main.js start
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Enable paper trading mode
TRADING_MODE=simulation

# Initial capital for paper trading (fake money)
PAPER_TRADING_INITIAL_CAPITAL=100

# Trading pairs to monitor (comma-separated)
PAPER_TRADING_PAIRS=BTC/USD,ETH/USD

# Optional: Simulation parameters
SIMULATION_LATENCY_MS=100
SIMULATION_FEES_MAKER=0.001
SIMULATION_FEES_TAKER=0.002
```

### Configuration Options

| Variable | Default | Description |
|---------|---------|-------------|
| `TRADING_MODE` | `real` | Set to `simulation` for paper trading |
| `PAPER_TRADING_INITIAL_CAPITAL` | `100` | Starting capital in USD (fake money) |
| `PAPER_TRADING_PAIRS` | `BTC/USD,ETH/USD` | Comma-separated list of trading pairs |
| `SIMULATION_LATENCY_MS` | `100` | Simulated network latency in milliseconds |
| `SIMULATION_FEES_MAKER` | `0.001` | Maker fee (0.1%) |
| `SIMULATION_FEES_TAKER` | `0.002` | Taker fee (0.2%) |

## How It Works

### Architecture Flow

```
Real Market Data (Kraken/KuCoin API)
    ↓
MarketDataService (Live Prices)
    ↓
SimulatedExecutionAdapter (Simulated Orders)
    ↓
ExecutionManager (SIMULATION mode)
    ↓
GovernanceSystem (Full Checks)
    ↓
LiveTradingEngine (Strategy Execution)
```

### Key Components

1. **MarketDataService**: Fetches real-time prices from exchanges
2. **SimulatedExecutionAdapter**: Simulates order execution with realistic fees/slippage
3. **ExecutionManager**: Routes to simulated execution (never places real orders)
4. **GovernanceSystem**: Full risk management and governance checks
5. **LiveTradingEngine**: Executes strategies based on market data

## What Gets Simulated

### ✅ Simulated (Fake)
- Order execution
- Capital/balance changes
- Position tracking
- Fees and slippage
- Trade history

### ✅ Real (Live)
- Market prices
- Market data feeds
- Exchange connectivity
- Strategy signals
- Risk calculations

## Safety Guarantees

### No Real Orders

The `SimulatedExecutionAdapter` **NEVER** places real orders. It:
- Generates fake order IDs (prefixed with `SIM_`)
- Simulates execution based on real market prices
- Calculates fees and slippage realistically
- Updates simulated balances only

### Verification

To verify no real orders are placed:
1. Check your exchange account - no orders should appear
2. Look for `SIM_` prefix in order IDs in logs
3. Check execution mode: should show `SIMULATION`
4. All trades will have `executionType: 'SIMULATED'` in logs

## Monitoring Paper Trading

### Status Updates

The paper trading script logs status updates every minute:
- Number of simulated trades executed
- Current system mode
- Risk state

### Execution History

All simulated trades are logged with:
- Order ID (prefixed with `SIM_`)
- Execution type: `SIMULATED`
- Fees and slippage calculations
- Full governance pipeline results

### Observability

If observability is enabled:
- All trade events are logged
- Daily snapshots are generated
- Attribution tracking works
- Event log contains all simulated trades

## Example Output

```
🎯 ========================================
📊 PAPER TRADING MODE
🎯 ========================================

⚠️  IMPORTANT: This is SIMULATION mode
   - Real market data will be used
   - NO real orders will be placed
   - Perfect for testing strategies safely

📋 Configuration:
   Initial Capital: $100.00
   Trading Pairs: BTC/USD, ETH/USD
   Exchange: KRAKEN
   Simulation Latency: 100ms
   Maker Fee: 0.10%
   Taker Fee: 0.20%

📡 Step 1: Initializing Market Data Service...
✅ Market Data Service initialized

🎲 Step 2: Creating Simulated Execution Adapter...
✅ Simulated Execution Adapter created

🛡️  Step 3: Initializing Governance System (SIMULATION mode)...
✅ Governance System initialized
   Execution Mode: SIMULATION

🚀 Step 4: Initializing Live Trading Engine...
✅ Live Trading Engine initialized

═══════════════════════════════════════════════════════════
📈 PAPER TRADING ACTIVE
═══════════════════════════════════════════════════════════
   Mode: SIMULATION (no real orders)
   Market Data: REAL (live prices)
   Execution: SIMULATED (fake capital)
   Press Ctrl+C to stop
```

## Stopping Paper Trading

### Graceful Shutdown

Press `Ctrl+C` to stop paper trading gracefully. The system will:
1. Stop accepting new trades
2. Close any open simulated positions
3. Stop market data feeds
4. Print final statistics
5. Exit cleanly

### Final Statistics

On shutdown, you'll see:
- Total simulated trades executed
- Execution mode confirmation
- Trade events logged
- System state summary

## Troubleshooting

### Market Data Not Available

**Problem**: `No market data available for BTC/USD`

**Solution**: 
- Ensure API credentials are set in `.env`
- Check exchange connectivity
- Wait a few seconds for initial data to populate
- Verify trading pairs are correct

### No Trades Executing

**Problem**: Strategies not generating signals

**Solution**:
- Check system mode (should be `AGGRESSIVE` for trading)
- Verify risk limits aren't blocking trades
- Check strategy configuration
- Review governance logs

### TypeScript Errors

**Problem**: `Cannot find module 'ts-node'`

**Solution**:
```bash
npm install --save-dev ts-node
```

## Best Practices

### 1. Start Small

Begin with small initial capital ($100) to understand system behavior.

### 2. Monitor Closely

Watch the first few hours of paper trading to ensure everything works correctly.

### 3. Verify No Real Orders

Double-check your exchange account to confirm no real orders are placed.

### 4. Test Different Scenarios

- Test with different trading pairs
- Try different initial capital amounts
- Test risk management triggers
- Verify governance checks

### 5. Review Logs

Check execution history and event logs to understand system behavior.

## Transitioning to Live Trading

Once paper trading validates your strategies:

1. **Review Performance**: Analyze simulated trade results
2. **Adjust Parameters**: Fine-tune strategy parameters
3. **Test Risk Management**: Verify risk limits work correctly
4. **Switch to Real Mode**: Change `TRADING_MODE=real` in `.env`
5. **Start Small**: Begin with small real capital
6. **Monitor Closely**: Watch first real trades carefully

## FAQ

### Q: Does paper trading use real API keys?

A: Yes, but only for **reading** market data. No write/execute permissions are used.

### Q: Can I lose money in paper trading?

A: No. Paper trading uses fake capital. No real orders are placed.

### Q: How accurate is the simulation?

A: Very accurate. It uses real market prices and simulates realistic fees, slippage, and latency.

### Q: Can I run paper trading 24/7?

A: Yes, but monitor API rate limits. Market data APIs may have usage limits.

### Q: What's the difference between paper trading and backtesting?

A: Paper trading uses **live** market data in real-time. Backtesting uses **historical** data.

## Support

For issues or questions:
1. Check logs for error messages
2. Review this guide
3. Check `docs/PHASE_8_SIMULATION.md` for technical details
4. Review execution history for trade details

---

**Remember**: Paper trading is your safety net. Use it to validate everything before risking real capital! 🛡️
