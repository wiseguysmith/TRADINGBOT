# Phase 8: Formal Risk Budgeting

## Objective

Each account must have a formal, explicit risk budget that:
- Limits how much risk the account may express
- Adapts conservatively to market regime confidence
- Decays aggressively on losses
- Recovers slowly after drawdowns
- Allocates risk across strategies by performance
- Is explainable, deterministic, and observable

**This is not optimization. This is risk governance.**

## Core Concepts

### 1. Account Risk Budget (Foundational)

**Location:** `core/risk_budget/account_risk_budget.ts`

Each account has a risk budget with:

**Properties:**
- `baselineRiskPct` - Fixed, conservative baseline (e.g., 2%)
- `maxRiskPct` - Absolute cap (e.g., 5%)
- `currentRiskPct` - Dynamic current risk
- `drawdownPenaltyFactor` - Multiplier for drawdown penalty (e.g., 1.5)
- `recoveryRate` - Recovery rate per period (e.g., 0.1% per day)
- `regimeScalingFactor` - Current regime-based scaling (0.6 to 1.0)

**Rules:**
- Baseline risk is fixed per account
- Current risk = baseline × modifiers
- Risk can never exceed maxRiskPct
- Risk is account-scoped only
- Effective risk = currentRiskPct × regimeScalingFactor (capped at maxRiskPct)

### 2. Regime-Adaptive Overlay (Conservative)

**Location:** `core/risk_budget/account_risk_budget.ts` (applyRegimeScaling method)

Scales risk only upward based on regime confidence.

**Rules:**
- Only applies in FAVORABLE regime
- No scaling in UNKNOWN / UNFAVORABLE
- Scales from 0.6 to 1.0 based on confidence
- Confidence 0.4 → 0.6 scaling
- Confidence 1.0 → 1.0 scaling (no additional scaling)
- Capped, monotonic, explainable

**Example:**
```
baselineRisk = 2%
regime = FAVORABLE
confidence = 0.7
scalingFactor = 0.6 + (0.7 - 0.4) * (0.4 / 0.6) = 0.8
effectiveRisk = 2% × 0.8 = 1.6%
```

### 3. Loss Decay & Recovery Model (Critical)

**Location:** `core/risk_budget/account_risk_budget.ts` (applyDrawdownPenalty, applyRecovery methods)

**On Loss / Drawdown:**
- Immediately reduces currentRiskPct
- Penalty = drawdown × penaltyFactor
- Example: 10% drawdown × 1.5 = 15% risk reduction
- Triggers probation if thresholds breached

**On Recovery:**
- Risk recovers slowly over time
- Recovery rate is capped (e.g., 0.1% per day)
- Recovery pauses if regime worsens (UNFAVORABLE)
- No instant rebounds
- Recovery is slower than decay

**Example:**
```
baselineRisk = 2%
currentRisk = 2%
drawdown = 10%
penalty = 10% × 1.5 = 15%
newRisk = 2% - 15% = 0% (capped at 0)

After 10 days (FAVORABLE regime):
recovery = 10 days × 0.1% = 1%
newRisk = 0% + 1% = 1%
```

### 4. Strategy-Weighted Risk Allocation

**Location:** `core/risk_budget/strategy_risk_allocator.ts`

Distributes account risk budget across enabled strategies.

**Weights based on:**
- Recent P&L (40% weight)
- Win rate (30% weight)
- Stability score (20% weight)
- Drawdown contribution (10% penalty)

**Rules:**
- Poorly performing strategies get less risk
- New strategies start at minimal weight (0.1%)
- Strategies in probation get zero allocation
- Allocation always sums to ≤ account risk budget
- No strategy can self-allocate

**Example:**
```
Account effective risk = 2%
Strategy A: performance score = 0.8, weight = 0.5 → 1.0% allocation
Strategy B: performance score = 0.4, weight = 0.3 → 0.6% allocation
Strategy C: performance score = 0.2, weight = 0.2 → 0.4% allocation
Total = 2.0%
```

### 5. Risk Budget Gate (Pre-Execution)

**Location:** `core/risk_budget/account_risk_budget_gate.ts`

**Execution Order:**
```
AccountRiskBudgetGate  ← PHASE 8 (this gate)
↓
AccountCapitalGate     ← PHASE 7
↓
RegimeGate             ← PHASE 2
↓
PermissionGate         ← PHASE 1
↓
RiskGovernor           ← PHASE 1
↓
ExecutionManager
```

**Checks:**
- Trade risk percentage = (trade value / account equity) × 100
- Compare against strategy's allocated risk percentage
- Compare against account's effective risk budget
- Block if either limit exceeded

## Integration

### Account Integration

**Location:** `core/accounts/account.ts`

Accounts now include:
- `riskBudget: AccountRiskBudget | null`
- `strategyRiskAllocator: StrategyRiskAllocator | null`

**Configuration:**
```typescript
const account = accountManager.createAccount({
  accountId: 'account-1',
  displayName: 'Account 1',
  startingCapital: 10000,
  enableRiskBudget: true,
  riskBudgetConfig: {
    accountId: 'account-1',
    baselineRiskPct: 2.0,
    maxRiskPct: 5.0,
    drawdownPenaltyFactor: 1.5,
    recoveryRate: 0.1 // 0.1% per day
  }
});
```

### Governance Integration

**Location:** `core/accounts/account_governance.ts`

`AccountGovernanceRouter` now includes:
- `accountRiskBudgetGate: AccountRiskBudgetGate | null`
- Risk budget check runs BEFORE capital gate

### Signal Router Integration

**Location:** `core/accounts/account_signal_router.ts`

Risk budget gate is initialized per account if risk budget is enabled.

## Observability

### Event Types

**PHASE 8 Event Types:**
- `RISK_BUDGET_INIT` - Risk budget initialized
- `RISK_BUDGET_SCALING` - Risk budget regime scaling changed
- `RISK_BUDGET_DECAY` - Risk budget decay applied
- `RISK_BUDGET_RECOVERY` - Risk budget recovery
- `RISK_BUDGET_ALLOCATION` - Strategy risk allocation changed
- `RISK_BUDGET_CHECK` - Risk budget check performed

**Location:** `core/observability/event_log.ts`, `core/observability/observability_integration.ts`

### Snapshots

Daily snapshots include:
- Baseline risk percentage
- Current risk percentage
- Effective risk percentage
- Regime scaling factor
- Strategy allocations
- Risk budget state

**Location:** `core/observability/daily_snapshot.ts` (to be extended)

### Replay

Replay reproduces:
- Identical risk values
- Identical block/allow decisions
- Deterministic risk budget behavior

**Location:** `core/replay/replay_engine.ts` (works with account-scoped events)

## Invariants

Phase 8 enforces these invariants:

1. **Risk is explicit, bounded, and explainable**
   - All risk values are explicit
   - Risk never exceeds maxRiskPct
   - All risk changes are logged

2. **Losses reduce future risk immediately**
   - Drawdown penalty applied immediately
   - No delay in risk reduction

3. **Recovery is slower than decay**
   - Recovery rate is capped
   - Recovery takes time
   - No instant rebounds

4. **Risk increases only in favorable regimes**
   - Regime scaling only in FAVORABLE
   - No scaling in UNKNOWN / UNFAVORABLE

5. **Strategies never control their own risk**
   - Risk allocation is centralized
   - Strategies cannot self-allocate

6. **Account shutdown overrides all risk logic**
   - Shutdown state blocks all trades
   - Risk budget checks are bypassed

7. **Replay reproduces exact risk behavior**
   - Deterministic risk calculations
   - Identical decisions on replay

## Usage Example

### Creating Account with Risk Budget

```typescript
import { AccountManager } from './core/accounts';
import { AccountRiskBudgetConfig } from './core/risk_budget';

const accountManager = new AccountManager();

const account = accountManager.createAccount({
  accountId: 'account-1',
  displayName: 'Account 1',
  startingCapital: 10000,
  enableRiskBudget: true,
  riskBudgetConfig: {
    accountId: 'account-1',
    baselineRiskPct: 2.0,
    maxRiskPct: 5.0,
    drawdownPenaltyFactor: 1.5,
    recoveryRate: 0.1
  },
  enabledStrategies: ['mean_reversion', 'momentum']
});

// Get risk budget summary
const summary = account.riskBudget?.getSummary();
console.log(summary);
// {
//   accountId: 'account-1',
//   baselineRiskPct: 2.0,
//   maxRiskPct: 5.0,
//   currentRiskPct: 2.0,
//   effectiveRiskPct: 2.0,
//   regimeScalingFactor: 1.0
// }
```

### Applying Regime Scaling

```typescript
// Apply regime scaling (called periodically)
account.applyRegimeScaling('FAVORABLE', 0.7);
// Effective risk = 2.0% × 0.8 = 1.6%
```

### Applying Drawdown Penalty

```typescript
// On drawdown event
account.updateEquity(-1000); // Loss of $1000
// Drawdown increases → risk budget decay applied automatically
```

### Strategy Risk Allocation

```typescript
// Update strategy performance metrics
account.strategyRiskAllocator?.updateStrategyMetrics({
  strategyId: 'mean_reversion',
  recentPnL: 500,
  drawdownContribution: 2.0,
  stabilityScore: 0.8,
  tradeCount: 50,
  winRate: 0.6,
  state: StrategyState.ACTIVE
});

// Get allocation
const allocation = account.strategyRiskAllocator?.getAllocation('mean_reversion');
console.log(allocation);
// {
//   strategyId: 'mean_reversion',
//   allocatedRiskPct: 1.0,
//   weight: 0.5,
//   performanceScore: 0.8
// }
```

## Success Criteria

Phase 8 is complete ONLY if:

✅ Risk budget is explicit and bounded  
✅ Losses reduce risk immediately  
✅ Recovery is slower than decay  
✅ Risk increases only in favorable regimes  
✅ Strategies cannot self-allocate risk  
✅ Account shutdown overrides risk logic  
✅ Replay reproduces exact risk behavior  
✅ Phases 1-7 remain untouched  

## Constraints

**DO NOT:**
- Modify ExecutionManager
- Modify exchange adapters
- Modify strategy logic
- Introduce ML or predictive models
- Introduce new strategies
- Tune alpha parameters
- Change regime detection logic
- Break replay determinism
- Introduce execution shortcuts

All logic must be:
- Deterministic
- Explainable
- Auditable

## Next Steps

After Phase 8:
1. Review invariants
2. Confirm risk budget behavior
3. Verify deterministic replay
4. Verify no execution bypasses
5. Seal Phase 8
6. Proceed to next phase

---

**Phase 8 Status:** ✅ Complete

**Date:** 2024

**Author:** CTO & Mentee

