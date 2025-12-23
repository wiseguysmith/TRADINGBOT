# Validation Execution Plan

**Status**: ✅ IMPLEMENTED

## Overview

This document describes the formal validation infrastructure for ensuring execution confidence before deploying real capital. The validation system enforces hard requirements and provides clear visibility into validation progress.

## Absolute Rules (Non-Negotiable)

- ❌ **No strategy changes** during validation
- ❌ **No parameter tuning** during validation
- ❌ **No execution logic changes** during validation
- ❌ **No governance changes** during validation
- ❌ **No "small improvements"** during validation

If any logic changes are required, **STOP and ask**.

## Validation Targets

- **Shadow trades**: ≥ 500
- **Minimum runtime**: ≥ 100 active trading days
- **Confidence goal**: ≥ 90%
- **Real capital**: ❌ NOT allowed during validation

## Execution Modes

### 1. Simulation Mode (SIM)

- **Purpose**: Paper trading with fake capital
- **Capital**: Fake capital only
- **Governance**: Full governance pipeline active
- **Execution**: Simulated (fees, slippage, latency simulated)
- **Capital Mutations**: Allowed only in simulation state
- **Real Orders**: Never placed

### 2. Shadow Mode (SHADOW)

- **Purpose**: Observe real markets, simulate execution, measure accuracy
- **Capital**: No capital (read-only observation)
- **Market Data**: Real Coinbase Advanced Trade API
- **Execution**: Simulated (uses `SimulatedExecutionAdapter`)
- **Tracking**: Measures execution accuracy vs real market outcomes
- **Metrics Tracked**:
  - Would this have filled?
  - At what price?
  - Execution error
  - Slippage delta
  - Latency sensitivity
- **Real Orders**: Never placed
- **Capital Mutations**: Never occur

### 3. Sentinel Mode (SENTINEL)

- **Purpose**: Infrastructure testing only (NOT proof of profitability)
- **Capital**: Hard-capped at $50-$100
- **Max Loss**: 100% (explicit)
- **Exchange Adapters**: REAL (Kraken)
- **Execution Type**: Labeled as `SENTINEL` in events
- **Confidence**: Explicitly excluded from confidence calculations
- **Purpose**:
  - Verify API auth
  - Verify order routing
  - Verify fee accounting
  - Verify cancel / failure handling
- **Real Orders**: YES (but with hard-capped capital)
- **Capital Mutations**: YES (but capped)

**⚠️ IMPORTANT**: Sentinel mode is for infrastructure testing only. It is NOT proof of profitability and trades are excluded from confidence calculations.

## Confidence Gate

The Confidence Gate is a **hard block** that prevents REAL execution mode unless all validation requirements are met.

### Requirements

1. **Shadow Trades**: ≥ 500
2. **Runtime Days**: ≥ 100 active trading days
3. **Confidence Score**: ≥ 90%
4. **Regime Coverage**: All regimes covered (minimum trades per regime)
5. **Unsafe Combinations**: Zero unsafe strategy×regime combinations

### Enforcement

- **Location**: `core/validation/confidence_gate.ts`
- **Check Point**: Before any REAL execution in `ExecutionManager`
- **Behavior**: Throws hard error if requirements not met
- **Event**: Emits `CONFIDENCE_GATE_BLOCKED` event
- **Bypass**: Cannot be bypassed

### Example Error

```
[CONFIDENCE_GATE] REAL execution blocked: Shadow trades 250 < 500 required; Runtime 45.2 days < 100 required; Confidence score 75.3% < 90% required
```

## Runtime Tracker

Tracks active trading days for confidence gate enforcement.

- **Location**: `core/validation/runtime_tracker.ts`
- **Definition**: An "active trading day" is a day where at least one trade was executed (SIMULATED, SHADOW, or SENTINEL)
- **Tracking**: Records distinct calendar days (YYYY-MM-DD format)
- **Replayability**: Can reconstruct from event log

## Validation Runner

### SIM + SHADOW Parallel Execution

**Script**: `scripts/run-validation-mode.ts`

Runs both SIM and SHADOW modes simultaneously:

- **SIM Mode**: Paper trading with fake capital
- **SHADOW Mode**: Simulated execution + real market observation
- **Both modes**: Run in parallel, independent governance systems
- **Status Reporting**: Every minute showing validation progress
- **Auto-Stop**: Stops when all requirements met

**Usage**:
```bash
npm run validation
```

**Configuration** (`.env`):
```env
PAPER_TRADING_INITIAL_CAPITAL=100
CONFIDENCE_TRADING_PAIRS=BTC/USD,ETH/USD
CONFIDENCE_STRATEGIES=momentum,mean_reversion,trend_following,volatility,statistical_arb
CONFIDENCE_TRADE_INTERVAL_MS=60000
CONFIDENCE_REPORT_INTERVAL_HOURS=24
CONFIDENCE_MAX_RUNTIME_DAYS=30
```

### Sentinel Mode Runner

**Script**: `scripts/run-sentinel-mode.ts`

Runs infrastructure testing with real exchange adapters:

- **Capital Cap**: $50-$100 (hard-capped)
- **Max Loss**: 100% (explicit)
- **Exchange**: Real Kraken adapter
- **Purpose**: Infrastructure testing only
- **Excluded**: From confidence calculations

**Usage**:
```bash
npm run sentinel
```

**Configuration** (`.env`):
```env
SENTINEL_CAPITAL_CAP=100
SENTINEL_TRADING_PAIRS=BTC/USD
SENTINEL_STRATEGIES=momentum
SENTINEL_TRADE_INTERVAL_MS=300000
KRAKEN_API_KEY=your_key
KRAKEN_API_SECRET=your_secret
```

## Operator Visibility

### Validation Status API

**Endpoint**: `GET /api/observability/validation-status`

Returns current validation status:
- Shadow trade count progress
- Runtime days progress
- Confidence score
- Confidence gate status
- Blocking reasons (if any)

### Operator Confidence Page

**Location**: `/operator/confidence`

Displays:
- **Validation Status Card**: Progress bars for all requirements
- **REAL Execution Status**: ✅ YES or ❌ NO with blocking reasons
- **Regime Coverage**: Progress per regime
- **Confidence Metrics**: By strategy and regime
- **Parity Metrics**: Fill match %, price error, slippage delta
- **Trends**: Confidence trends over time
- **Unsafe Combinations**: Flagged combinations requiring attention

## Implementation Details

### ExecutionManager Updates

- Added `SENTINEL` execution mode
- Added confidence gate check before REAL execution
- Added runtime tracker integration
- Added sentinel capital cap enforcement

### Event Log Updates

- Added `CONFIDENCE_GATE_BLOCKED` event type
- Added `ConfidenceGateBlockedEvent` interface
- Added observability hook for confidence gate blocked

### New Components

1. **ConfidenceGate** (`core/validation/confidence_gate.ts`)
   - Hard blocks REAL execution
   - Checks all requirements
   - Emits blocking events

2. **RuntimeTracker** (`core/validation/runtime_tracker.ts`)
   - Tracks active trading days
   - Replayable from event log
   - Used by confidence gate

3. **Validation Runner** (`scripts/run-validation-mode.ts`)
   - Runs SIM + SHADOW in parallel
   - Status reporting
   - Auto-stop on completion

4. **Sentinel Runner** (`scripts/run-sentinel-mode.ts`)
   - Infrastructure testing
   - Hard-capped capital
   - Real exchange adapters

## Usage Workflow

### 1. Start Validation

```bash
npm run validation
```

This starts SIM + SHADOW modes in parallel. The system will:
- Accumulate shadow trades
- Track runtime days
- Generate confidence reports
- Display status every minute

### 2. Monitor Progress

Visit `/operator/confidence` to see:
- Validation status progress bars
- Current requirements status
- Blocking reasons (if any)

### 3. Check API Status

```bash
curl http://localhost:3000/api/observability/validation-status
```

### 4. Run Sentinel (Optional)

For infrastructure testing:

```bash
npm run sentinel
```

⚠️ **Warning**: Sentinel uses real exchange adapters with real capital (capped).

### 5. Validation Complete

When all requirements are met:
- Shadow trades ≥ 500 ✅
- Runtime ≥ 100 days ✅
- Confidence ≥ 90% ✅
- All regimes covered ✅
- No unsafe combinations ✅

The validation runner will display:
```
✅ VALIDATION COMPLETE - All requirements met!
```

REAL execution mode will now be allowed (confidence gate will pass).

## Constraints Met

- ✅ No strategy changes
- ✅ No parameter tuning
- ✅ No execution logic changes (except validation infrastructure)
- ✅ No governance changes
- ✅ No "small improvements"
- ✅ Real capital NOT allowed during validation (except Sentinel with hard cap)
- ✅ All logic deterministic and replayable
- ✅ Full governance pipeline untouched

## Next Steps

After validation is complete:

1. Review confidence reports
2. Address any unsafe combinations
3. Verify all requirements met
4. Proceed to REAL execution mode (confidence gate will allow)

## Questions?

If any logic changes are required during validation, **STOP and ask**. The validation phase is about evidence, not improvement.
