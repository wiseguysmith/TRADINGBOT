# Quick Start: Validation Mode

## How to Start SIM Mode

You have **two options** to start simulation/validation mode:

### Option 1: Paper Trading (SIM Only) - Recommended for Testing

**Command:**
```bash
npm run paper-trading
```

**What it does:**
- Starts SIM mode (simulated execution with fake capital)
- Uses real market data
- Generates SIM trades
- Shows trades in dashboard at `/operator/simulation`

**To see it running:**
- Open a terminal/command prompt
- Navigate to project directory: `cd c:\Users\18593\AI-Trading-Bot`
- Run: `npm run paper-trading`
- You'll see console output showing trades being executed
- Dashboard updates at: `http://localhost:3000/operator/simulation`

### Option 2: Full Validation (SIM + SHADOW)

**Command:**
```bash
npm run validation
```

**What it does:**
- Runs SIM mode AND SHADOW mode in parallel
- Accumulates shadow trades for confidence validation
- More complex, takes longer to see results

**For quick testing, use Option 1 (paper-trading)**

## Prerequisites

1. **Next.js dev server MUST be running:**
   ```bash
   npm run dev
   ```
   - Keep this running in one terminal
   - Should show: "Ready on http://localhost:3000"

2. **Then start SIM mode in another terminal:**
   ```bash
   npm run paper-trading
   ```

## What You Should See

### In the Terminal Running `npm run paper-trading`:
```
📈 PAPER TRADING ACTIVE
   Mode: SIMULATION (no real orders)
   Market Data: REAL (live prices)
   Execution: SIMULATED (fake capital)
   
✅ Paper trading is now running...
   Monitoring pairs: BTC/USD, ETH/USD
   Waiting for trading signals...

[STATUS] Simulated trades executed: X
[STATUS] System mode: AGGRESSIVE
[STATUS] Risk state: ACTIVE
```

### In the Dashboard (`http://localhost:3000/operator/simulation`):
- Live trades feed updating
- Performance metrics (Capital, PnL, Win Rate)
- Open positions
- Strategy performance

## Troubleshooting

**"System is not live" / No trades appearing:**
1. ✅ Check Next.js is running: `http://localhost:3000` should load
2. ✅ Check paper-trading script is running (should see console output)
3. ⏳ Wait 1-2 minutes - trades depend on market conditions
4. ✅ Check dashboard: `http://localhost:3000/operator/simulation`

**No console output:**
- Make sure you're running in a visible terminal (not background)
- Check for errors in the terminal

**Dashboard shows "No SIM trades yet":**
- This is normal if script just started
- Trades will appear as they're generated
- Check the terminal running `npm run paper-trading` for trade logs

## Quick Verification

**Check if system is running:**
```bash
# Check API
curl http://localhost:3000/api/observability/simulation-status

# Should return:
# {"success":true,"status":{"isActive":true,"tradeCount":X,...}}
```

**Check dashboard:**
- Open browser: `http://localhost:3000/operator/simulation`
- Should show live updates every 5 seconds
