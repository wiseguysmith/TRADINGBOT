# Phase 6 — Arbitrage Execution Layer

**Date**: 2025-12-17  
**Status**: ✅ COMPLETE

## Executive Summary

Phase 6 introduces live arbitrage execution in a way that is capital-efficient, low drawdown, regime-aware, fully governed, observable, and replayable. This phase answers **"How do we safely monetize inefficiencies without adding directional risk?"**

**Key Principle**: Arbitrage is infrastructure, not alpha. It is low variance, capital preservation first, and always explainable.

## Design Philosophy

### Core Principles

1. **Infrastructure, not alpha**
   - Arbitrage provides steady returns
   - Not a source of excitement
   - Boring by design

2. **Low variance**
   - Small edges, frequent trades
   - Capital preservation first
   - Stop immediately when conditions degrade

3. **Always explainable**
   - Every trade has clear rationale
   - Edge size, fees, slippage all tracked
   - Attribution shows profit source

4. **Fully governed**
   - Every leg goes through full governance stack
   - No execution bypasses
   - Capital isolated to ARBITRAGE pool

5. **Fail safely**
   - Partial execution neutralized immediately
   - No heroics, no retries, no gambling
   - Failures logged and alerted

## Arbitrage Strategy Types

### 1. Funding / Carry Arbitrage (Single Exchange)

**Description**: Long spot + short perp (or inverse) to capture funding rate differentials.

**Characteristics**:
- Single exchange only
- No cross-exchange transfers
- No timing games
- Captures funding rate payments

**Execution**:
- Positive funding rate → Short perp, long spot
- Negative funding rate → Long perp, short spot
- Requires significant funding rate to cover fees

**Constraints**:
- Minimum funding rate: 0.01%
- Minimum edge: 0.1% after fees
- Only in FAVORABLE regime

### 2. Basis / Instrument Arbitrage (Same Asset)

**Description**: Spot vs perp mispricing, basis compression/expansion.

**Characteristics**:
- Same asset, different instruments
- No cross-asset stat arb
- Basis reversion strategy
- Requires historical basis data

**Execution**:
- Positive basis → Short perp, long spot (expect compression)
- Negative basis → Long perp, short spot (expect compression)
- Requires 2+ standard deviations deviation

**Constraints**:
- Minimum basis deviation: 2σ
- Minimum edge: 0.15% after fees
- Only in FAVORABLE regime

### Explicitly Excluded (For Now)

- ❌ Cross-exchange arbitrage
- ❌ Triangular arbitrage
- ❌ Latency-sensitive arbitrage

## Architecture

### Components

1. **Arbitrage Types** (`core/arbitrage/arbitrage_types.ts`)
   - Type definitions for signals, legs, results
   - Execution configuration

2. **Base Arbitrage Strategy** (`strategies/arbitrage/base_arbitrage_strategy.ts`)
   - Abstract base class for all arbitrage strategies
   - Signal generation interface
   - Profitability checks

3. **Funding Arbitrage** (`strategies/arbitrage/funding_arbitrage.ts`)
   - Single-exchange funding rate arbitrage
   - Generates signals based on funding rate

4. **Basis Arbitrage** (`strategies/arbitrage/basis_arbitrage.ts`)
   - Spot vs perp basis arbitrage
   - Generates signals based on basis deviation

5. **Arbitrage Executor** (`core/arbitrage/arbitrage_executor.ts`)
   - Translates signals to TradeRequests
   - Executes through full governance stack
   - Handles partial execution

6. **Arbitrage Manager** (`core/arbitrage/arbitrage_manager.ts`)
   - Coordinates strategy execution
   - Enforces regime & health gating
   - Capital constraints

## Execution Flow

### Full Governance Stack

Every arbitrage leg goes through:

```
1. CapitalGate
   ↓
2. RegimeGate
   ↓
3. PermissionGate
   ↓
4. RiskGovernor
   ↓
5. ExecutionManager
```

**No bypasses. Ever.**

### Signal Processing

```
1. Strategy generates signal
   ↓
2. ArbitrageManager checks eligibility:
   - Regime = FAVORABLE?
   - Regime confidence ≥ threshold?
   - System health OK?
   - Capital available?
   ↓
3. If eligible → ArbitrageExecutor
   ↓
4. Executor converts legs to TradeRequests
   ↓
5. Each leg executes through governance
   ↓
6. Results aggregated
   ↓
7. Partial execution → Neutralize exposure
```

## Regime & Health Gating

### Eligibility Requirements

Arbitrage may execute ONLY if:

1. **Regime = FAVORABLE**
   - No arbitrage in UNFAVORABLE or UNKNOWN regimes
   - Regime confidence ≥ 0.6 (configurable)

2. **System Health = OK**
   - Health monitor reports healthy
   - No active SAFE MODE

3. **Capital Available**
   - ARBITRAGE pool has available capital
   - Trade size ≤ max capital per trade
   - Capital gate approves

4. **System Mode**
   - Not in OBSERVE_ONLY mode
   - Not in SHUTDOWN state

### Silent Ignoring

If any condition fails:
- Signal is **ignored** (not an error)
- Event logged (TRADE_BLOCKED)
- No alert (silence is success)
- System remains idle

## Capital Constraints

### Strict Isolation

- Arbitrage strategies draw **ONLY** from ARBITRAGE pool
- Never borrow from DIRECTIONAL pool
- Respect minimum capital floor
- Respect per-trade exposure limits

### Capital Sizing

- **Conservative**: Small position sizes
- **Capped**: Maximum capital per trade
- **Edge-adjusted**: Larger edge → slightly more capital (within bounds)

### Capital Gate Integration

Each leg checks capital before execution:
- Strategy has allocated capital?
- Allocation > 0?
- Trade size ≤ allocated capital?

If any check fails → Trade blocked.

## Observability & Attribution

### Event Types

Every arbitrage attempt emits events:

- `SIGNAL_GENERATED` - Arbitrage signal generated
- `CAPITAL_CHECK` - Capital gate check
- `REGIME_CHECK` - Regime gate check
- `TRADE_EXECUTED` - Leg executed
- `TRADE_BLOCKED` - Leg blocked
- `ARB_COMPLETED` - Arbitrage completed successfully
- `ARB_ABORTED` - Arbitrage aborted

### Attribution

Attribution shows:

- **Profit source**: Funding, basis, etc.
- **Fees**: Total fees paid
- **Slippage**: Actual vs expected slippage
- **Execution delay**: Time to execute
- **Blocking layer**: Which layer blocked/allowed execution

### Replay

Replay reproduces arbitrage behavior exactly:
- Uses event log
- Uses snapshots
- Never executes real trades
- Identical outcomes

## Failure Handling

### Failure Scenarios

1. **One leg fills, other fails**
   - Partial execution detected
   - Neutralization triggered immediately
   - CRITICAL alert emitted

2. **Slippage exceeds threshold**
   - Default: 0.1% max slippage
   - Neutralization triggered
   - CRITICAL alert emitted

3. **Execution delay exceeds tolerance**
   - Default: 5 seconds max delay
   - Neutralization triggered
   - CRITICAL alert emitted

### Neutralization Process

When partial execution occurs:

1. **Detect executed legs**
   - Identify which legs succeeded

2. **Create opposite trades**
   - For each executed leg, create opposite trade
   - Same size, opposite side

3. **Execute neutralization**
   - Through full governance stack
   - Log neutralization events

4. **Alert if neutralization fails**
   - CRITICAL alert
   - Manual intervention required

### No Heroics

- ❌ No retries
- ❌ No gambling
- ❌ No heroics
- ✅ Immediate neutralization
- ✅ Log and alert
- ✅ Manual intervention if needed

## Integration with Governance

### GovernanceSystem Integration

Arbitrage integrates with existing governance:

```typescript
const governance = new GovernanceSystem({
  enableCapitalGovernance: true,
  enableRegimeGovernance: true,
  arbitrageCapital: 10000
});

const arbitrageManager = new ArbitrageManager(
  governance.executionManager,
  governance.modeController,
  governance.regimeDetector,
  governance.capitalGate,
  governance.healthMonitor,
  governance.eventLog,
  governance.alertManager
);
```

### Strategy Registration

```typescript
// Register strategies
const fundingArb = new FundingArbitrageStrategy('kraken', 'BTC');
arbitrageManager.registerStrategy(fundingArb);

const basisArb = new BasisArbitrageStrategy('kraken', 'BTC');
arbitrageManager.registerStrategy(basisArb);
```

### Running Strategies

```typescript
// Poll strategies for signals
const marketData = new Map();
marketData.set('funding_arb_kraken_BTC', {
  spotPrice: 50000,
  perpPrice: 50100,
  fundingRate: 0.0001,
  fundingRate8h: 0.0001,
  nextFundingTime: new Date(),
  volume24h: 1000000,
  openInterest: 5000000
});

const results = await arbitrageManager.runStrategies(marketData);
```

## Usage Examples

### Funding Arbitrage

```typescript
import { FundingArbitrageStrategy } from './strategies/arbitrage';

const strategy = new FundingArbitrageStrategy('kraken', 'BTC');

const marketData = {
  spotPrice: 50000,
  perpPrice: 50100,
  fundingRate: 0.0001,  // 0.01% funding rate
  fundingRate8h: 0.0001,
  nextFundingTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
  volume24h: 1000000,
  openInterest: 5000000
};

const signal = await strategy.generateSignal(marketData, new Map());

if (signal) {
  console.log(`Edge: ${signal.edgePercent.toFixed(2)}%`);
  console.log(`Confidence: ${signal.confidence.toFixed(2)}`);
  console.log(`Legs: ${signal.legs.length}`);
}
```

### Basis Arbitrage

```typescript
import { BasisArbitrageStrategy } from './strategies/arbitrage';

const strategy = new BasisArbitrageStrategy('kraken', 'BTC');

const marketData = {
  spotPrice: 50000,
  perpPrice: 50100,
  basis: 100,
  basisPercent: 0.2,
  historicalBasisMean: 0.05,
  historicalBasisStd: 0.1,
  volume24h: 1000000,
  openInterest: 5000000
};

const signal = await strategy.generateSignal(marketData, new Map());

if (signal) {
  console.log(`Basis deviation: ${signal.edgePercent.toFixed(2)}%`);
  console.log(`Expected compression: ${signal.edgePercent * 0.5}%`);
}
```

## Success Criteria

✅ **Phase 6 is complete**:

- [x] Arbitrage executes through full governance
- [x] No execution bypass exists
- [x] Arbitrage capital is isolated
- [x] Failures flatten exposure immediately
- [x] Observability captures every attempt
- [x] Replay reproduces behavior exactly
- [x] Phases 1–5 remain untouched

## What Phase 6 Does NOT Do

Phase 6 explicitly does NOT:

- ❌ Modify ExecutionManager (Phase 1 untouched)
- ❌ Modify CapitalGate, RegimeGate, PermissionGate, or RiskGovernor
- ❌ Add cross-exchange arbitrage
- ❌ Add leverage
- ❌ Add ML or optimization
- ❌ Add execution shortcuts
- ❌ Change system behavior

## Why Arbitrage is Constrained

### Single-Exchange Only

**Reason**: Simpler risk management, no cross-exchange transfers, cleaner accounting.

**Future**: Cross-exchange arbitrage may be added later if needed, but requires:
- Cross-exchange fund transfers
- More complex risk management
- Higher operational complexity

### Boring is Good

**Reason**: Arbitrage should be infrastructure, not excitement.

**Design**: Small edges, frequent trades, capital preservation first.

### No Leverage

**Reason**: Leverage adds risk without improving edge.

**Design**: Use capital efficiently, not leverage.

### Regime-Aware

**Reason**: Arbitrage opportunities exist only in favorable conditions.

**Design**: Only trade in FAVORABLE regime with high confidence.

## Failure Handling Philosophy

### Immediate Neutralization

**Principle**: Better to neutralize immediately than hope for recovery.

**Process**:
1. Detect partial execution
2. Create opposite trades
3. Execute through governance
4. Alert if neutralization fails

### No Retries

**Principle**: If it failed once, retrying is gambling.

**Design**: Log failure, neutralize, alert, require manual intervention.

### No Heroics

**Principle**: Better to lose small than gamble big.

**Design**: Conservative thresholds, immediate action, clear alerts.

## Next Steps

Phase 6 is complete. The system now:

1. Executes arbitrage through full governance
2. Enforces regime & health gating
3. Isolates arbitrage capital
4. Handles failures safely
5. Provides full observability
6. Supports replay

**Wait for Phase 7 instructions** (if applicable).

---

## Appendix: Arbitrage Signal Structure

### Signal Fields

```typescript
{
  strategyId: string;
  arbitrageType: 'FUNDING_ARB' | 'BASIS_ARB';
  symbol: string;
  edgeSize: number;                  // Expected profit (absolute)
  edgePercent: number;               // Expected profit (%)
  confidence: number;                 // 0-1 confidence score
  estimatedFees: number;             // Estimated fees
  estimatedSlippage: number;         // Estimated slippage
  minimumProfitabilityThreshold: number;
  legs: ArbitrageLeg[];
  timestamp: Date;
}
```

### Leg Structure

```typescript
{
  legId: string;
  legType: 'SPOT_LONG' | 'SPOT_SHORT' | 'PERP_LONG' | 'PERP_SHORT';
  symbol: string;
  side: 'buy' | 'sell';
  size: number;
  expectedPrice: number;
  exchange: string;
  orderType: 'limit' | 'market';
  priority: number;                  // 1 = first, 2 = second
}
```

### Execution Result

```typescript
{
  success: boolean;
  strategyId: string;
  arbitrageType: 'FUNDING_ARB' | 'BASIS_ARB';
  symbol: string;
  legsExecuted: number;
  legsTotal: number;
  legResults: LegExecutionResult[];
  totalProfit: number;
  totalFees: number;
  totalSlippage: number;
  executionTimeMs: number;
  timestamp: Date;
  failureReason?: string;
  requiresNeutralization: boolean;
}
```

