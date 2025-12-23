# How to Start SIM Mode

## Quick Answer

**You're already in the project directory!** Just run:

```bash
npm run paper-trading
```

## Step-by-Step Instructions

### If you're on Windows (PowerShell/CMD):

1. **Open a terminal** (PowerShell or Command Prompt)
2. **Navigate to project** (if not already there):
   ```powershell
   cd c:\Users\18593\AI-Trading-Bot
   ```
3. **Start SIM mode**:
   ```powershell
   npm run paper-trading
   ```

### If you're on Linux/WSL:

1. **Open a terminal**
2. **Navigate to project**:
   ```bash
   cd /mnt/c/Users/18593/AI-Trading-Bot
   ```
   (Note: In WSL, Windows paths are under `/mnt/c/`)
3. **Start SIM mode**:
   ```bash
   npm run paper-trading
   ```

## What You Should See

When SIM mode starts successfully, you'll see:

```
📈 PAPER TRADING ACTIVE
═══════════════════════════════════════════════════════════
   Mode: SIMULATION (no real orders)
   Market Data: REAL (live prices)
   Execution: SIMULATED (fake capital)
   Press Ctrl+C to stop

✅ Paper trading is now running...
   Monitoring pairs: BTC/USD, ETH/USD
   Waiting for trading signals...
```

Then every minute, you'll see status updates:
```
[STATUS] Simulated trades executed: 1
[STATUS] System mode: AGGRESSIVE
[STATUS] Risk state: ACTIVE
```

## Verify It's Working

1. **Check the terminal** - You should see trade logs
2. **Check the dashboard** - Open `http://localhost:3000/operator/simulation`
3. **Check the API** - `http://localhost:3000/api/observability/simulation-status`

## Troubleshooting

**"Command not found" or "npm: command not found":**
- Make sure Node.js is installed: `node --version`
- Make sure npm is installed: `npm --version`

**"Cannot find module" errors:**
- Install dependencies: `npm install`

**Dashboard shows "No SIM trades yet":**
- This is normal - wait 1-2 minutes for trades to generate
- Check the terminal running `npm run paper-trading` for trade logs

**"Next.js server not running":**
- Start it first: `npm run dev` (in a separate terminal)
- Keep it running while SIM mode is active

## Two Terminals Needed

You need **TWO terminals** running:

1. **Terminal 1**: Next.js dev server
   ```bash
   npm run dev
   ```
   (Keep this running - shows dashboard)

2. **Terminal 2**: SIM mode
   ```bash
   npm run paper-trading
   ```
   (Shows trade execution logs)

Both must be running for the full system to work!
