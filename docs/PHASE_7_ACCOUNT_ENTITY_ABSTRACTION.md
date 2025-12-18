# Phase 7: Account & Entity Abstraction

## Objective

Enable one system to operate for many accounts, such that:
- Capital is never mixed
- Risk is never mixed
- Shutdowns are account-local
- Strategies are shared but participation is per-account
- Execution & governance remain global

## Core Concepts

### Entity (Lightweight, Future-Proof)

An Entity represents ownership/control and can own one or more accounts. It is mostly metadata for now, designed to be future-proof.

**Responsibilities:**
- Unique ID
- Display name
- List of owned accounts
- Metadata (extensible)

**Location:** `core/accounts/entity.ts`

### Account (Primary Focus)

Each Account is a first-class abstraction that owns:

**Capital:**
- Starting capital
- Current equity
- Capital pools (Directional / Arbitrage)
- Allocation history

**Risk Rules:**
- Max drawdown
- Kill-switch thresholds
- Probation rules
- Max daily loss
- Max position size

**Strategy Permissions:**
- Explicit opt-in per strategy
- Default = no strategies enabled
- No implicit participation

**State:**
- Account lifecycle states: `ACTIVE`, `PROBATION`, `OBSERVE_ONLY`, `SHUTDOWN`
- State is account-scoped, not global

**Observability:**
- Own PnL
- Own drawdown
- Own trade history
- Own snapshots & attribution

**Location:** `core/accounts/account.ts`

## Strategy Participation Model

**Key Principle:** Strategies are defined globally, but accounts decide participation.

**Flow:**
```
Strategy Signal (global)
  ↓
For each account with strategy enabled:
  Account Strategy Permission Check
  Account CapitalGate
  Account RegimeGate
  Account RiskGovernor
  Global ExecutionManager
```

**Rules:**
- Strategies emit signals without account knowledge
- Accounts decide whether they participate
- Execution is routed per eligible account
- Each account executes independently with full isolation

## Execution Flow

After Phase 7, execution becomes:

```
Strategy Signal
  ↓
Account Strategy Permission Check (account-scoped)
  ↓
Account CapitalGate (account-scoped)
  ↓
Account RegimeGate (uses global regime, account-scoped eligibility)
  ↓
Account RiskGovernor (account-scoped)
  ↓
Global ExecutionManager (unchanged)
```

**Key Points:**
- Same pipeline, repeated per account
- Fully isolated outcomes
- Global ExecutionManager ensures no execution bypasses

## What Remains Global

These remain singletons / global services:
- **ExecutionManager** - Single execution authority
- **Exchange adapters** - Shared execution infrastructure
- **Regime detection** - System-wide market regime
- **Health monitoring** - System health checks
- **Observability infrastructure** - Event log, snapshots
- **Replay engine** - Deterministic replay

Accounts consume these — they do not fork them.

## Invariants

Phase 7 enforces these invariants:

1. **No account can affect another account's capital**
   - Each account has isolated capital pools
   - Capital operations are account-scoped

2. **No account can bypass global governance**
   - All execution routes through ExecutionManager
   - Account-specific checks occur before global execution

3. **No strategy executes without explicit account permission**
   - Default = no strategies enabled
   - Explicit opt-in required per account

4. **Shutdown of one account does NOT affect others**
   - Account state is account-scoped
   - Global system continues operating

5. **Observability is account-scoped by default**
   - Events include accountId
   - Snapshots are per-account
   - Attribution is per-account

6. **Replay remains deterministic per account**
   - Account-scoped replay preserves determinism
   - Can replay individual account behavior

## Implementation Details

### Account Manager

**Location:** `core/accounts/account_manager.ts`

Manages account lifecycle and ensures isolation:
- Account creation
- Strategy enable/disable per account
- Account state management
- Isolation verification

### Account Governance Router

**Location:** `core/accounts/account_governance.ts`

Routes trade requests through account-specific governance:
- `AccountCapitalGate` - Checks account's capital pools
- `AccountPermissionGate` - Uses account's risk governor
- `AccountGovernanceRouter` - Orchestrates account-scoped checks

### Account Signal Router

**Location:** `core/accounts/account_signal_router.ts`

Routes strategy signals to all eligible accounts:
- Finds accounts with strategy enabled
- Routes signal to each account independently
- Returns results for all accounts

### Governance Integration

**Location:** `core/governance_integration.ts`

Updated to support account routing:
- `executeTradeForAccounts()` - Routes signals to all eligible accounts
- `executeTradeWithRegimeCheck()` - Preserved for backward compatibility (single-account mode)
- Account abstraction is optional (enabled via config)

## Observability

### Account-Scoped Events

All events now include optional `accountId`:
- `SIGNAL_GENERATED`
- `CAPITAL_CHECK`
- `REGIME_CHECK`
- `TRADE_EXECUTED`
- `TRADE_BLOCKED`
- `CAPITAL_UPDATE`
- `STRATEGY_STATE_CHANGE`

**Location:** `core/observability/event_log.ts`

### Account-Scoped Snapshots

Daily snapshots are generated per account:
- Account equity
- Account PnL
- Account drawdown
- Account trade statistics
- Account capital allocation

**Location:** `core/observability/daily_snapshot.ts` (to be extended)

### Account-Scoped Attribution

Attribution engine attributes outcomes per account:
- Which account made the decision
- Why trade was blocked or executed
- Account-specific performance metrics

**Location:** `core/observability/attribution_engine.ts` (to be extended)

## API Endpoints

### Read-Only Account APIs

**GET /api/accounts**
- List all accounts with summary information

**GET /api/accounts/[accountId]**
- Get detailed information for a specific account

**GET /api/accounts/[accountId]/snapshots**
- Get daily snapshots for a specific account

**GET /api/accounts/[accountId]/events**
- Get events for a specific account (with optional filters)

**Location:** `src/pages/api/accounts/`

## Usage Example

### Creating Accounts

```typescript
import { AccountManager, AccountConfig } from './core/accounts';
import { GovernanceSystem } from './core/governance_integration';

// Create account manager
const accountManager = new AccountManager();

// Create account 1
const account1 = accountManager.createAccount({
  accountId: 'account-1',
  displayName: 'Account 1',
  startingCapital: 10000,
  enabledStrategies: ['mean_reversion', 'momentum']
});

// Create account 2
const account2 = accountManager.createAccount({
  accountId: 'account-2',
  displayName: 'Account 2',
  startingCapital: 5000,
  enabledStrategies: ['mean_reversion'] // Only one strategy
});

// Initialize governance system with account abstraction
const governance = new GovernanceSystem({
  enableAccountAbstraction: true,
  phase7AccountManager: accountManager,
  // ... other config
});

// Route strategy signal to all eligible accounts
const request = createTradeRequest({
  strategy: 'mean_reversion',
  pair: 'BTC/USD',
  action: 'buy',
  amount: 0.01,
  price: 50000
});

const results = await governance.executeTradeForAccounts(request);
// Returns results for both account-1 and account-2
```

### Enabling/Disabling Strategies

```typescript
// Enable strategy for account
accountManager.enableStrategyForAccount('account-1', 'momentum');

// Disable strategy for account
accountManager.disableStrategyForAccount('account-1', 'mean_reversion');
```

### Account State Management

```typescript
// Set account state
accountManager.setAccountState('account-1', 'PROBATION', 'Drawdown threshold exceeded');

// Get account summary
const summary = account1.getSummary();
console.log(summary);
// {
//   accountId: 'account-1',
//   displayName: 'Account 1',
//   state: 'ACTIVE',
//   equity: 10000,
//   pnl: 0,
//   drawdown: 0,
//   enabledStrategies: ['mean_reversion', 'momentum'],
//   capitalMetrics: { ... }
// }
```

## Success Criteria

Phase 7 is complete ONLY if:

✅ Accounts have isolated capital pools  
✅ Accounts have isolated risk governors  
✅ Strategies require explicit account permission  
✅ Account shutdowns do not affect other accounts  
✅ Observability is account-scoped  
✅ Replay is deterministic per account  
✅ No execution bypasses exist  
✅ Phases 1-6 remain untouched  

## Constraints

**DO NOT:**
- Modify ExecutionManager
- Modify CapitalGate, RegimeGate, PermissionGate, or RiskGovernor logic
- Modify exchange adapters
- Modify strategy logic
- Introduce risk budgeting (Phase 8)
- Add new strategies
- Add dashboards or UI
- Add ML or optimization
- Break replay determinism
- Change execution timing

This is a structural phase only.

## Next Steps

After Phase 7:
1. Review invariants
2. Confirm account isolation
3. Verify no execution leaks
4. Verify no global state corruption
5. Seal Phase 7
6. Proceed to Phase 8 (Risk Budgeting)

---

**Phase 7 Status:** ✅ Complete

**Date:** 2024

**Author:** CTO & Mentee

