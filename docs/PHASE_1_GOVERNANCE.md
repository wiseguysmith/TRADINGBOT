# Phase 1: Governance & Survival

## Overview

Phase 1 implements the core governance infrastructure that ensures the trading system **cannot execute unauthorized trades** and **cannot blow up silently**. This phase focuses exclusively on establishing authoritative risk control, not on trading strategies, capital allocation, or advanced features.

## What Phase 1 Provides

### Guarantees

1. **No trade can execute without passing the permission gate**
   - All execution paths must go through `ExecutionManager`
   - Permission gate combines Mode Controller and Risk Governor decisions
   - No bypass paths exist

2. **Risk Governor can fully shut down the system**
   - Auto-shutdown on drawdown limits
   - Auto-shutdown on daily loss limits
   - Manual shutdown capability
   - SHUTDOWN state blocks all new trades

3. **Observe-only mode is enforced**
   - Strategies can run and generate signals
   - Performance can be tracked
   - No capital is deployed
   - Perfect for testing and development

4. **Risk is authoritative, not advisory**
   - Risk checks block execution, not just log warnings
   - No "logging-only" failures
   - Denials are enforced at the execution layer

5. **Existing strategy logic still runs under governance**
   - Strategies don't need to be rewritten
   - They run normally but execution is gated
   - Governance is transparent to strategy code

## Architecture

### The 3 Core Components

#### 1. Control Plane (Mode Controller)

**Location:** `core/mode_controller.ts`

**Purpose:** Central authority for system mode management.

**Modes:**
- `AGGRESSIVE` - Trading allowed (subject to risk governor)
- `OBSERVE_ONLY` - No capital deployment, strategies run in simulation

**Responsibilities:**
- Maintain current system mode
- Expose read-only permissions
- Log all mode changes immutably

**Key Methods:**
```typescript
getMode(): SystemMode
getPermissions(): ModePermissions
setMode(mode: SystemMode, reason?: string): void
isTradingAllowed(): boolean
```

**Rules:**
- OBSERVE_ONLY → `tradingAllowed = false`
- AGGRESSIVE → `tradingAllowed = true` (subject to risk governor)
- Mode switching must be explicit and centralized
- No strategy may override mode permissions

#### 2. Risk Governor

**Location:** `src/services/riskGovernor.ts`

**Purpose:** Supreme authority over trade execution. Enforces all risk limits.

**States:**
- `ACTIVE` - Normal operation
- `PROBATION` - Approaching limits, extra caution
- `PAUSED` - New trades blocked, existing positions can close
- `SHUTDOWN` - Complete halt, no new trades

**Responsibilities:**
- Track system-wide drawdown
- Track per-strategy drawdown
- Track per-asset exposure
- Enforce max drawdown limits
- Enforce max daily loss limits
- Auto-transition to SHUTDOWN when limits exceeded

**Key Methods:**
```typescript
getRiskState(): RiskState
approveTrade(request: TradeRequest): boolean
recordTradeExecution(result: TradeResult): void
setState(state: RiskState, reason: string): void
```

**Rules:**
- If state is SHUTDOWN → `approveTrade()` MUST always return `false`
- If drawdown exceeds limits → automatically transition to SHUTDOWN
- No logging-only failures — denials must block execution
- Auto-shutdown allowed without human approval

**Risk Limits (Default):**
- Max system drawdown: 25%
- Max system daily loss: $1000
- Max strategy drawdown: 30%
- Max strategy daily loss: $500
- Max asset exposure: $2000
- Max position size: 30%

#### 3. Pre-Trade Permission Gate

**Location:** `core/permission_gate.ts`

**Purpose:** Single point of authorization between signal generation and execution.

**Responsibilities:**
- Combine Mode Controller permissions
- Combine Risk Governor approval
- Return single boolean decision
- Fast O(1) checks, no network calls

**Key Methods:**
```typescript
checkPermission(request: TradeRequest): PermissionResult
isTradingAllowed(): boolean
getPermissionStatus(): PermissionStatus
```

**Rules:**
- Permission checks must be fast and deterministic
- No network calls
- No side effects
- If permission is denied → execution must not occur

**Decision Flow:**
```
1. Check Mode Controller → tradingAllowed?
2. Check Risk Governor → approveTrade()?
3. Return combined decision
```

### Execution Manager

**Location:** `core/execution_manager.ts`

**Purpose:** Centralized trade execution that enforces governance.

**Responsibilities:**
- Accept trade requests
- Check permission gate (MANDATORY)
- Execute trade if approved
- Record execution in Risk Governor (MANDATORY)
- Maintain execution history

**Key Methods:**
```typescript
executeTrade(request: TradeRequest): Promise<TradeResult>
isExecutionAllowed(): boolean
getExecutionHistory(): ExecutionHistory[]
```

**Execution Flow:**
```
Strategy generates signal
  ↓
Build TradeRequest
  ↓
ExecutionManager.executeTrade()
  ↓
PermissionGate.checkPermission() ← MANDATORY CHECK
  ↓
If approved → Execute trade
  ↓
RiskGovernor.recordTradeExecution() ← MANDATORY UPDATE
```

## Usage

### Basic Setup

```typescript
import { GovernanceSystem } from './core/governance_integration';
import { createTradeRequest } from './core/governance_integration';

// Initialize governance system
const governance = new GovernanceSystem({
  initialMode: 'OBSERVE_ONLY', // Start safe
  initialCapital: 1000,
  exchangeClient: krakenWrapper // Optional, for real execution
});

// Check if trading is allowed
if (governance.isTradingAllowed()) {
  // Generate signals, etc.
}

// Execute a trade
const request = createTradeRequest({
  strategy: 'mean_reversion',
  pair: 'BTC/USD',
  action: 'buy',
  amount: 0.01,
  price: 50000
});

const result = await governance.executionManager.executeTrade(request);
if (result.success) {
  console.log('Trade executed successfully');
} else {
  console.log('Trade was blocked by governance');
}
```

### Mode Management

```typescript
// Switch to AGGRESSIVE mode
governance.modeController.setMode('AGGRESSIVE', 'Manual activation');

// Check current mode
const mode = governance.modeController.getMode();
const permissions = governance.modeController.getPermissions();

// Switch back to OBSERVE_ONLY
governance.modeController.setMode('OBSERVE_ONLY', 'Risk management');
```

### Risk Management

```typescript
// Check risk state
const state = governance.riskGovernor.getRiskState();
const metrics = governance.riskGovernor.getRiskMetrics();

// Manual shutdown
governance.riskGovernor.setState('SHUTDOWN', 'Emergency stop');

// Check if trade would be approved
const request = createTradeRequest({...});
const approved = governance.riskGovernor.approveTrade(request);
```

## Integration with Existing Code

### Refactoring Existing Execution Paths

**Before (Direct Execution):**
```typescript
// ❌ Old way - bypasses governance
const orderResult = await kraken.placeBuyOrder(pair, amount, price);
```

**After (Governed Execution):**
```typescript
// ✅ New way - goes through governance
const request = createTradeRequest({
  strategy: 'mean_reversion',
  pair: pair,
  action: 'buy',
  amount: amount,
  price: price
});

const result = await governance.executionManager.executeTrade(request);
if (result.success) {
  // Trade executed
}
```

### Integration Points

1. **Trading Engines** (`liveTradingEngine.ts`, `realTradingEngine.ts`)
   - Replace direct `kraken.placeOrder()` calls
   - Use `ExecutionManager.executeTrade()` instead

2. **Strategy Services** (`strategyService.ts`)
   - Check `governance.isTradingAllowed()` before generating signals
   - Convert signals to `TradeRequest` format

3. **Main Entry Points** (`main.js`)
   - Initialize `GovernanceSystem` at startup
   - Pass governance instance to trading engines

## Fail-Safes

### Kill Switch

If Risk Governor enters SHUTDOWN:
- ✅ Immediately blocks all new trades
- ✅ Allows existing positions to be closed safely
- ✅ Logs shutdown reason immutably
- ✅ No human approval required for auto-shutdown

### Observe-Only Mode

When mode is OBSERVE_ONLY:
- ✅ Strategies may run
- ✅ Signals may be generated
- ✅ Performance may be tracked
- ✅ No capital may be deployed
- ✅ Perfect for testing and development

## Testing

Run the governance tests:

```bash
npm test core/__tests__/governance.test.ts
```

**Test Coverage:**
- ✅ OBSERVE_ONLY mode blocks trading
- ✅ SHUTDOWN state blocks all trades
- ✅ Permission gate blocks unauthorized trades
- ✅ Auto-shutdown on drawdown limits
- ✅ Execution history is maintained

## What Phase 1 Does NOT Include

**Intentionally excluded (future phases):**
- ❌ Regime detection (Phase 2)
- ❌ Capital allocation logic (Phase 3)
- ❌ Arbitrage integration (Phase 3)
- ❌ Dashboards and analytics (Phase 4)
- ❌ Futures support (Phase 4)
- ❌ Strategy lifecycle management (Phase 2)
- ❌ Advanced position sizing (Phase 3)

## Success Criteria

Phase 1 is complete when:

✅ No trade can execute without passing the permission gate  
✅ Risk Governor can fully shut down the system  
✅ Observe-only mode is enforced  
✅ Risk is authoritative, not advisory  
✅ Existing strategy logic still runs under governance  
✅ No future features were prematurely added  

## Next Steps

After Phase 1 is complete, proceed to:

**Phase 2: Edge Quality**
- Strategy metadata & lifecycle enforcement
- Regime detection and regime gating

**Phase 3: Capital Intelligence**
- Volatility-adjusted sizing
- Capital allocator
- Arbitrage integration

**Phase 4: Scale & Longevity**
- Investor dashboards
- Audit logs
- API and licensing hooks

## Questions?

If you have questions about Phase 1 governance:

1. Check this documentation
2. Review the test files (`core/__tests__/governance.test.ts`)
3. Examine the source code comments
4. Check execution history logs

---

**Remember:** Phase 1 is about survival, not performance. The system must be impossible to blow up silently, even if it means being overly conservative.

