# Phase 2 — Regime-Aware Strategy Governance

**Date**: 2025-12-17  
**Status**: ✅ COMPLETE

## Executive Summary

Phase 2 implements regime-aware strategy governance, ensuring the system trades only during favorable market conditions. This phase answers **WHEN to trade**, not HOW MUCH or HOW FAST.

## Design Philosophy

### Core Principles

1. **Regimes filter trades; they do NOT predict price**
   - Regimes identify market conditions
   - Strategies declare which regimes they work in
   - System blocks trades in incompatible regimes

2. **Simplicity > cleverness**
   - No ML, no optimization
   - Simple, explainable metrics
   - Clear rules, not black boxes

3. **Explainability > performance**
   - Every regime decision has a reason
   - Metrics are transparent
   - Logs explain why trades are blocked

4. **Safety is the default**
   - If regime is unclear → UNKNOWN
   - If confidence is low → UNKNOWN
   - UNKNOWN → no capital deployed

## System Architecture

### Components

1. **Regime Detector** (`core/regime_detector.ts`)
   - Detects system-wide market regime
   - Uses simple, explainable metrics
   - Returns regime + confidence + reason

2. **Strategy Metadata Registry** (`core/strategy_metadata.ts`)
   - Centralized registry for strategy metadata
   - Each strategy declares allowed regimes
   - Manages strategy lifecycle states

3. **Regime Gate** (`core/regime_gate.ts`)
   - Checks regime eligibility BEFORE Phase 1 governance
   - Blocks trades if regime is incompatible
   - Updates price history for regime detection

4. **Governance Integration** (`core/governance_integration.ts`)
   - Integrates regime checks into execution flow
   - Provides `executeTradeWithRegimeCheck()` helper
   - Maintains backward compatibility

## Market Regimes

### Exactly Three Regimes

The system recognizes exactly three market regimes:

#### 1. FAVORABLE
**Definition**: Structure + volatility present

**Characteristics**:
- Volatility expansion OR high volatility
- Strong trend OR stable correlation
- Clear market structure

**When it occurs**:
- Trending markets with volatility
- Volatility expansion periods
- Markets with predictable structure

**Strategy eligibility**: Volatility strategies, trend following, statistical arbitrage

#### 2. UNFAVORABLE
**Definition**: Chop, random spikes, poor structure

**Characteristics**:
- Low volatility AND contraction
- Weak trend AND unstable correlation
- Random, unpredictable movements

**When it occurs**:
- Range-bound choppy markets
- Low volatility periods
- Unstable, unpredictable markets

**Strategy eligibility**: Most strategies blocked (safety first)

#### 3. UNKNOWN
**Definition**: Insufficient confidence or unclear signals

**Characteristics**:
- Insufficient data
- Conflicting signals
- Low confidence in regime detection

**When it occurs**:
- Market transitions
- Insufficient price history
- Ambiguous market conditions

**Strategy eligibility**: Conservative strategies only (funding arbitrage, mean reversion)

### Regime Detection Metrics

The regime detector uses four simple metrics:

1. **Realized Volatility**
   - Standard deviation of returns
   - Measures price movement magnitude

2. **Volatility Expansion/Contraction**
   - Change in volatility vs. previous period
   - Positive = expansion, Negative = contraction

3. **Trend Strength**
   - Linear regression R-squared
   - Measures how well prices follow a trend
   - 0 = no trend, 1 = perfect trend

4. **Correlation Stability**
   - Autocorrelation of returns
   - Measures predictability of structure
   - Higher = more stable/predictable

### Regime Detection Rules

**FAVORABLE**:
- Volatility > threshold OR volatility expanding
- AND (trend strength > threshold OR correlation stable)

**UNFAVORABLE**:
- Low volatility AND contracting
- OR (weak trend AND unstable correlation)

**UNKNOWN**:
- Default when unclear
- Insufficient data
- Low confidence

## Strategy Metadata

### Required Metadata

Each strategy must declare:

```typescript
{
  strategyId: string;              // Unique identifier
  strategyType: 'VOLATILITY' | 'STAT_ARB' | 'FUNDING_ARB';
  allowedRegimes: MarketRegime[];  // Regimes this strategy can trade in
  riskProfile: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  description: string;             // Human-readable description
}
```

### Strategy Types

1. **VOLATILITY**
   - Strategies that profit from volatility
   - Examples: Volatility breakout, trend following
   - Typically allowed in FAVORABLE regime

2. **STAT_ARB** (Statistical Arbitrage)
   - Mean reversion, pairs trading, grid trading
   - Can work in FAVORABLE or UNKNOWN regimes
   - Requires some market structure

3. **FUNDING_ARB** (Funding/Carry Arbitrage)
   - Market-neutral strategies
   - Can work in FAVORABLE or UNKNOWN regimes
   - Less dependent on market structure

### Strategy Lifecycle States

```typescript
enum StrategyState {
  DISABLED,   // Not registered or explicitly disabled
  SIM,        // Simulation/testing mode
  ACTIVE,     // Active and eligible for execution
  PROBATION,  // Underperforming, reduced frequency
  PAUSED      // Temporarily paused
}
```

**Rules**:
- Only `ACTIVE` and `PROBATION` strategies can execute
- `DISABLED` and `PAUSED` strategies are blocked
- Lifecycle transitions are centralized (not in strategies)

## Execution Flow

### Phase 2 Integration

```
Strategy generates signal
  ↓
RegimeGate.checkEligibility()
  ↓ (if eligible)
Phase 1: PermissionGate.checkPermission()
  ↓ (if approved)
Phase 1: RiskGovernor.approveTrade()
  ↓ (if approved)
ExecutionManager.executeTrade()
  ↓
Exchange execution
```

### Regime Check Details

**Before Phase 1 governance**:
1. Get current regime for symbol
2. Check strategy's `allowedRegimes`
3. Check strategy's lifecycle state
4. If incompatible → block execution (no Phase 1 check)
5. If compatible → proceed to Phase 1 governance

**Blocking behavior**:
- Regime mismatches are logged but not treated as failures
- System defaults to safety (no capital deployed)
- No alerts triggered for regime blocks

## Safe Default Behavior

### When Regime is UNKNOWN

- System enters OBSERVE_ONLY behavior naturally
- No capital deployed
- No alerts triggered
- Strategies that allow UNKNOWN regime may still execute (conservative only)

### When No Strategies are Eligible

- System waits for regime change
- No forced trading
- Silence is success

### When Confidence is Low

- Default to UNKNOWN regime
- Block aggressive strategies
- Allow only conservative strategies

## Default Strategy Registrations

The system includes default registrations for common strategies:

1. **volatility_breakout** (VOLATILITY)
   - Allowed: FAVORABLE
   - Risk: AGGRESSIVE

2. **trend_following** (VOLATILITY)
   - Allowed: FAVORABLE
   - Risk: MODERATE

3. **mean_reversion** (STAT_ARB)
   - Allowed: FAVORABLE, UNKNOWN
   - Risk: MODERATE

4. **statistical_arbitrage** (STAT_ARB)
   - Allowed: FAVORABLE
   - Risk: MODERATE

5. **funding_arbitrage** (FUNDING_ARB)
   - Allowed: FAVORABLE, UNKNOWN
   - Risk: CONSERVATIVE

6. **grid_trading** (STAT_ARB)
   - Allowed: FAVORABLE, UNKNOWN
   - Risk: MODERATE

## Usage Examples

### Basic Usage

```typescript
import { GovernanceSystem } from './core/governance_integration';

// Initialize with regime governance enabled
const governance = new GovernanceSystem({
  initialMode: 'AGGRESSIVE',
  initialCapital: 1000,
  enableRegimeGovernance: true // Enable Phase 2
});

// Update price history for regime detection
governance.updatePriceHistory('BTC/USD', 50000);

// Execute trade (regime check happens automatically)
const result = await governance.executeTradeWithRegimeCheck(
  tradeRequest,
  'BTC/USD'
);

if (result.regimeBlocked) {
  console.log(`Blocked by regime: ${result.regimeReason}`);
}
```

### Strategy Registration

```typescript
import { StrategyMetadataRegistry, StrategyState } from './core/strategy_metadata';
import { MarketRegime } from './core/regime_detector';

const registry = new StrategyMetadataRegistry();

// Register a new strategy
registry.registerStrategy({
  strategyId: 'my_custom_strategy',
  strategyType: 'VOLATILITY',
  allowedRegimes: [MarketRegime.FAVORABLE],
  riskProfile: 'MODERATE',
  description: 'My custom volatility strategy'
});

// Activate strategy
registry.updateStrategyState('my_custom_strategy', StrategyState.ACTIVE);
```

### Checking Regime Eligibility

```typescript
// Get current regime
const regimeResult = governance.getCurrentRegime('BTC/USD');
console.log(`Current regime: ${regimeResult.regime}`);
console.log(`Confidence: ${regimeResult.confidence}`);
console.log(`Reason: ${regimeResult.reason}`);

// Get eligible strategies
const eligible = governance.getEligibleStrategies('BTC/USD');
console.log(`Eligible strategies: ${eligible.join(', ')}`);
```

## Integration with Existing Code

### Backward Compatibility

Phase 2 is **opt-in** and maintains backward compatibility:

- If `regimeGate` is `null` or `undefined`, regime checks are skipped
- Existing code using `ExecutionManager.executeTrade()` continues to work
- New code can use `executeTradeWithRegimeCheck()` for regime awareness

### Engine Updates

Engines have been updated to support regime checks:

- `LiveTradingEngine` - Accepts optional `regimeGate` parameter
- `TradingService` - Accepts optional `regimeGate` parameter
- Price updates automatically feed regime detector

### Migration Path

1. **Phase 1 only** (current):
   ```typescript
   const governance = new GovernanceSystem({
     enableRegimeGovernance: false // or omit
   });
   ```

2. **Phase 2 enabled**:
   ```typescript
   const governance = new GovernanceSystem({
     enableRegimeGovernance: true
   });
   ```

## Success Criteria

✅ **Phase 2 is complete**:

- [x] Regime detection is system-wide
- [x] Exactly three regimes exist (FAVORABLE, UNFAVORABLE, UNKNOWN)
- [x] Strategies declare metadata
- [x] Strategies are blocked if regime is incompatible
- [x] No execution logic was modified (Phase 1 untouched)
- [x] Phase 1 governance remains intact
- [x] Safe default behavior (UNKNOWN → no capital)
- [x] Backward compatibility maintained

## What Phase 2 Does NOT Do

Phase 2 explicitly does NOT:

- ❌ Modify execution logic (Phase 1 untouched)
- ❌ Add capital allocation logic (Phase 3)
- ❌ Add arbitrage execution (Phase 3)
- ❌ Add ML or clustering
- ❌ Add dashboards or reports
- ❌ Optimize for performance
- ❌ Predict price direction

## Next Steps

Phase 2 is complete. The system now:

1. Detects market regimes using simple, explainable metrics
2. Blocks trades when regime is incompatible
3. Defaults to safety when regime is unclear
4. Maintains Phase 1 governance integrity

**Wait for Phase 3 instructions** (Capital Intelligence).

---

## Appendix: Regime Detection Algorithm

### Step 1: Calculate Metrics

```typescript
// From price history (last 20 periods)
realizedVolatility = stdDev(returns)
volatilityExpansion = (currentVol - previousVol) / previousVol
trendStrength = rSquared(linearRegression(prices))
correlationStability = autocorrelation(returns, lag=1)
```

### Step 2: Determine Regime

```typescript
if (hasVolatility && hasStructure) {
  return FAVORABLE;
}

if (isChoppy || isUnstructured) {
  return UNFAVORABLE;
}

return UNKNOWN; // Default to safety
```

### Step 3: Calculate Confidence

```typescript
if (regime === FAVORABLE) {
  confidence = (volatilitySignal + structureSignal) / 2;
} else if (regime === UNFAVORABLE) {
  confidence = (choppySignal + unstructuredSignal) / 2;
} else {
  confidence = 0; // UNKNOWN has no confidence
}
```

### Step 4: Generate Explanation

```typescript
reason = `${regime} regime (${confidence}% confidence): ` +
         `Volatility: ${volatility}%, ` +
         `Trend: ${trendStrength}%, ` +
         `Structure: ${correlationStability}%`;
```

