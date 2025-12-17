# Phase 3 — Capital Intelligence & Governance

**Date**: 2025-12-17  
**Status**: ✅ COMPLETE

## Executive Summary

Phase 3 introduces capital intelligence to the system, answering **"How much capital is allocated, to whom, and under what conditions?"** This phase preserves Phase 1 execution governance and Phase 2 regime gating while adding sophisticated capital management.

**Key Principle**: Capital intelligence is conservative by design. It preserves capital, prevents bleed, and ensures capital is allocated only when conditions are favorable.

## Design Philosophy

### Core Principles

1. **Capital pools are isolated**
   - Losses in one pool do NOT affect the other
   - Reporting remains independent
   - Clear separation of concerns

2. **Strategies never self-allocate**
   - All allocation decisions are centralized
   - Strategies only consume what they are granted
   - No strategy can bypass capital controls

3. **Probation removes capital automatically**
   - Capital decay is automatic, not manual
   - Prevents capital bleed without killing learning
   - Recovery restores eligibility, not capital

4. **Regime confidence scales allocation**
   - Higher confidence → more capital (aggressive strategies)
   - Lower confidence → less capital
   - UNKNOWN regime → zero capital

5. **Arbitrage capital is protected**
   - Minimum capital guarantees
   - Does not compete equally with directional strategies
   - Anchors system returns

## System Architecture

### Components

1. **Capital Pools** (`core/capital/capital_pool.ts`)
   - Isolated pools by strategy type
   - Tracks allocation, drawdown, availability
   - Independent reporting

2. **Strategy Capital Accounts** (`core/capital/strategy_capital_account.ts`)
   - Each strategy receives a capital account
   - Tracks allocated capital, peak capital, drawdown
   - Centralized account management

3. **Capital Allocator** (`core/capital/capital_allocator.ts`)
   - Centralized allocation logic
   - Implements probation decay
   - Implements regime-confidence scaling
   - Enforces arbitrage guarantees

4. **Capital Gate** (`core/capital/capital_gate.ts`)
   - Checks capital availability BEFORE Phase 1 governance
   - Verifies strategy has allocated capital
   - Verifies trade size ≤ allocated capital

## Capital Pool Architecture

### Pool Types

```typescript
enum CapitalPoolType {
  DIRECTIONAL,  // For volatility and trend strategies
  ARBITRAGE     // For funding/carry and statistical arbitrage
}
```

### Pool Isolation

**Key Rule**: Pools are completely isolated.

- **DIRECTIONAL Pool**:
  - Used by volatility and trend strategies
  - Can experience drawdowns
  - Capital can be reduced during unfavorable conditions

- **ARBITRAGE Pool**:
  - Used by funding/carry and statistical arbitrage
  - Protected minimum capital
  - Stable, boring, capital-efficient

**Isolation Benefits**:
- Losses in directional pool don't affect arbitrage pool
- Arbitrage strategies maintain minimum capital
- Clear separation for reporting and analysis

### Pool Metrics

Each pool tracks:

```typescript
{
  totalCapital: number;        // Total capital in pool
  allocatedCapital: number;    // Capital currently allocated to strategies
  availableCapital: number;    // Capital available for allocation
  maxDrawdown: number;         // Maximum allowed drawdown (%)
  currentDrawdown: number;     // Current drawdown (%)
  peakCapital: number;         // Highest capital level reached
}
```

## Strategy Capital Accounts

### Account Structure

Each strategy receives a capital account:

```typescript
{
  strategyId: string;
  poolType: CapitalPoolType;
  allocatedCapital: number;
  peakCapital: number;
  currentDrawdown: number;
  state: StrategyState;
  createdAt: Date;
  updatedAt: Date;
}
```

### Allocation Rules

1. **Strategies never self-allocate**
   - All allocation goes through `CapitalAllocator`
   - Strategies request capital, but don't grant it
   - Centralized decision-making

2. **Allocation is conditional**
   - Strategy must be ACTIVE or PROBATION
   - Pool must have available capital
   - Pool must not exceed max drawdown

3. **Capital is tracked per strategy**
   - Each strategy has its own account
   - Drawdown is calculated per strategy
   - Peak capital is tracked per strategy

## Probation → Zero Capital Decay

### Decay Logic

**STEP 3**: When a strategy enters PROBATION:

1. **Immediate reduction**
   - Allocated capital is reduced by decay rate (default 50%)
   - Capital is released back to pool

2. **Continued decay**
   - If probation persists, capital continues to decay
   - After N periods (default 2), capital → 0

3. **Strategy continues**
   - Strategy may continue running in SIM/OBSERVE_ONLY
   - No capital deployed
   - Learning continues without capital risk

### Decay Configuration

```typescript
{
  probationDecayRate: 50,        // 50% reduction per period
  probationDecayPeriods: 2      // Zero after 2 periods
}
```

### Example

```
Strategy enters PROBATION with $100 allocated:
Period 1: $100 → $50 (50% decay)
Period 2: $50 → $25 (50% decay)
Period 3: $25 → $0 (zero capital)
```

### Why This Works

- **Prevents capital bleed**: Capital is removed automatically
- **Preserves learning**: Strategy continues running without capital
- **Recovery path**: Strategy can recover without capital loss
- **No human approval**: Automatic, deterministic

## Regime-Confidence-Based Risk Scaling

### Scaling Logic (Aggressive Strategies Only)

**STEP 4**: For aggressive strategies, capital allocation scales with regime confidence:

```
confidence < 0.4  → 0 capital (UNKNOWN regime)
0.4 - 0.6        → 50% of requested allocation
0.6 - 0.8        → 100% of requested allocation
> 0.8            → 150% of requested allocation (max multiplier)
```

### Configuration

```typescript
{
  minConfidenceForAllocation: 0.4,    // Minimum confidence to allocate
  maxConfidenceMultiplier: 1.5       // Max allocation multiplier
}
```

### Rules

1. **UNKNOWN regime = zero capital**
   - No capital allocated regardless of confidence
   - Safety first

2. **Scaling affects allocation only**
   - Execution logic unchanged
   - Only capital amount changes

3. **Hard pool limits still apply**
   - Scaling cannot exceed pool availability
   - Max drawdown limits still enforced

### Example

```
Aggressive strategy requests $100:
- Confidence 0.3 (UNKNOWN) → $0
- Confidence 0.5 → $50 (50% scaling)
- Confidence 0.7 → $100 (100% scaling)
- Confidence 0.9 → $150 (150% scaling, if pool allows)
```

### Why This Works

- **Leans in when confident**: More capital when conditions are favorable
- **Pulls back when uncertain**: Less capital when conditions are unclear
- **Prevents gambling**: Zero capital in UNKNOWN regime
- **Scales with opportunity**: Higher confidence = more capital

## Arbitrage Minimum Capital Guarantee

### Guarantee Rules

**STEP 5**: Arbitrage pool enforces:

1. **Pool-level minimum**
   - Arbitrage pool must maintain minimum capital (default $100)
   - Below minimum → warnings, but allocation continues if possible

2. **Strategy-level minimum**
   - Each arbitrage strategy gets minimum allocation (default $50)
   - Prevents starvation of arbitrage strategies

3. **Protected from directional volatility**
   - Arbitrage pool is separate from directional pool
   - Directional losses don't affect arbitrage capital

### Configuration

```typescript
{
  arbitrageMinCapital: 100,              // Minimum pool capital
  arbitrageMinAllocationPerStrategy: 50  // Minimum per strategy
}
```

### Why This Works

- **Stable returns**: Arbitrage strategies anchor system returns
- **Capital efficiency**: Arbitrage is capital-efficient
- **Reduces stress**: Stable, boring returns reduce volatility
- **Protected allocation**: Arbitrage doesn't compete equally with directional

## Capital Governance Integration

### Execution Flow

**STEP 6**: Capital checks occur BEFORE Phase 1 governance:

```
Strategy generates signal
  ↓
CapitalGate.checkCapital() ← PHASE 3 (FIRST)
  ↓ (if capital available)
RegimeGate.checkEligibility() ← PHASE 2
  ↓ (if regime compatible)
Phase 1: PermissionGate.checkPermission()
  ↓ (if approved)
Phase 1: RiskGovernor.approveTrade()
  ↓ (if approved)
ExecutionManager.executeTrade()
```

### Capital Check Details

Before Phase 1 governance:

1. **Verify strategy has capital account**
   - Strategy must be registered
   - Account must exist

2. **Verify allocation > 0**
   - Strategy must have allocated capital
   - Zero capital → block execution

3. **Verify trade size ≤ allocated capital**
   - Trade value must not exceed allocation
   - Excess → block execution

### Blocking Behavior

- Capital mismatches are logged but not treated as failures
- System defaults to safety (no capital deployed)
- No alerts triggered for capital blocks
- Clear reason provided in logs

## Usage Examples

### Basic Usage

```typescript
import { GovernanceSystem } from './core/governance_integration';

// Initialize with capital governance enabled
const governance = new GovernanceSystem({
  initialMode: 'AGGRESSIVE',
  initialCapital: 1000,
  enableRegimeGovernance: true,
  enableCapitalGovernance: true,
  directionalCapital: 700,  // 70% directional
  arbitrageCapital: 300     // 30% arbitrage
});

// Allocate capital to strategy
if (governance.capitalAllocator) {
  const allocated = governance.capitalAllocator.allocateToStrategy(
    'volatility_breakout',
    100,  // Request $100
    regimeResult  // Current regime
  );
  console.log(`Allocated: $${allocated}`);
}

// Execute trade (capital check happens automatically)
const result = await governance.executeTradeWithRegimeCheck(
  tradeRequest,
  'BTC/USD',
  regimeResult
);

if (result.capitalBlocked) {
  console.log(`Blocked by capital: ${result.capitalReason}`);
}
```

### Probation Decay

```typescript
// Strategy enters probation
strategyRegistry.updateStrategyState('my_strategy', StrategyState.PROBATION);

// Capital automatically decays
// Period 1: $100 → $50
// Period 2: $50 → $25
// Period 3: $25 → $0
```

### Regime-Confidence Scaling

```typescript
// Aggressive strategy with high confidence
const regimeResult = {
  regime: MarketRegime.FAVORABLE,
  confidence: 0.9
};

// Allocates 150% of requested (if pool allows)
const allocated = capitalAllocator.allocateToStrategy(
  'aggressive_strategy',
  100,
  regimeResult
);
// Result: $150 allocated
```

### Arbitrage Guarantee

```typescript
// Arbitrage strategy always gets minimum
const allocated = capitalAllocator.allocateToStrategy(
  'funding_arbitrage',
  30,  // Request $30
  undefined  // No regime scaling for arbitrage
);
// Result: $50 allocated (minimum guarantee)
```

## Integration with Existing Code

### Backward Compatibility

Phase 3 is **opt-in** and maintains backward compatibility:

- If `capitalGate` is `null` or `undefined`, capital checks are skipped
- Existing code using `ExecutionManager.executeTrade()` continues to work
- New code can use `executeTradeWithRegimeCheck()` for capital awareness

### Engine Updates

Engines have been updated to support capital checks:

- `LiveTradingEngine` - Accepts optional `capitalGate` parameter
- Capital checks happen automatically in execution flow

### Migration Path

1. **Phase 1 & 2 only** (current):
   ```typescript
   const governance = new GovernanceSystem({
     enableCapitalGovernance: false // or omit
   });
   ```

2. **Phase 3 enabled**:
   ```typescript
   const governance = new GovernanceSystem({
     enableCapitalGovernance: true,
     directionalCapital: 700,
     arbitrageCapital: 300
   });
   ```

## Success Criteria

✅ **Phase 3 is complete**:

- [x] Capital pools are isolated
- [x] Strategies cannot self-allocate
- [x] Probation removes capital automatically
- [x] Aggressive risk scales with regime confidence
- [x] Arbitrage capital is guaranteed
- [x] Phase 1 & 2 remain untouched
- [x] Capital checks occur before Phase 1 governance

## What Phase 3 Does NOT Do

Phase 3 explicitly does NOT:

- ❌ Modify ExecutionManager (Phase 1 untouched)
- ❌ Modify PermissionGate or RiskGovernor (Phase 1 untouched)
- ❌ Modify exchange adapters
- ❌ Change regime detection logic (Phase 2 untouched)
- ❌ Add ML or optimization
- ❌ Add dashboards or UI
- ❌ Add arbitrage execution (Phase 4)
- ❌ Tune strategies
- ❌ Optimize parameters

## Why Capital Intelligence is Conservative by Design

### Design Principles

1. **Capital preservation over growth**
   - System prioritizes preserving capital
   - Growth is secondary to survival

2. **Automatic capital removal**
   - Probation → zero capital automatically
   - No manual intervention required
   - Prevents capital bleed

3. **Scaling with confidence**
   - More capital when confident
   - Less capital when uncertain
   - Zero capital when unknown

4. **Protected arbitrage capital**
   - Minimum guarantees
   - Isolation from directional volatility
   - Stable returns anchor

5. **Centralized allocation**
   - Strategies cannot self-allocate
   - All decisions are centralized
   - Clear audit trail

### Investor Readiness

Capital intelligence is designed to be:

- **Explainable**: Every allocation decision has a reason
- **Auditable**: Clear tracking of capital flows
- **Conservative**: Safety first, growth second
- **Transparent**: Clear reporting of pool metrics
- **Automated**: No manual intervention required

## Next Steps

Phase 3 is complete. The system now:

1. Manages capital through isolated pools
2. Allocates capital based on regime confidence
3. Automatically removes capital during probation
4. Guarantees minimum arbitrage capital
5. Checks capital before Phase 1 governance

**Wait for Phase 4 instructions** (Scale & Longevity).

---

## Appendix: Capital Allocation Flow

### Complete Flow

```
1. Strategy requests capital
   ↓
2. CapitalAllocator.allocateToStrategy()
   ↓
3. Check strategy state
   - PROBATION → decay logic
   - DISABLED/PAUSED → zero allocation
   - ACTIVE → continue
   ↓
4. Get appropriate pool
   - ARBITRAGE → arbitrage pool (with guarantees)
   - DIRECTIONAL → directional pool
   ↓
5. Check regime confidence (aggressive strategies)
   - UNKNOWN → zero capital
   - Low confidence → reduced allocation
   - High confidence → increased allocation
   ↓
6. Allocate from pool
   - Check pool availability
   - Check max drawdown
   - Allocate capital
   ↓
7. Update strategy account
   - Record allocation
   - Update peak capital
   - Calculate drawdown
```

### Capital Check Flow

```
1. Trade request arrives
   ↓
2. CapitalGate.checkCapital()
   ↓
3. Get strategy account
   - Account exists?
   - Allocation > 0?
   ↓
4. Check trade value
   - Trade value ≤ allocated capital?
   ↓
5. If all checks pass → proceed to regime gate
   If any check fails → block execution
```

