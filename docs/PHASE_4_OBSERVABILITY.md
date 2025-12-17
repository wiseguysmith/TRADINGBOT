# Phase 4 — Observability, Attribution & Replay

**Date**: 2025-12-17  
**Status**: ✅ COMPLETE

## Executive Summary

Phase 4 introduces full observability and attribution to the system, answering **"What happened, why did it happen, and can we prove it?"** This phase adds visibility without changing any execution, risk, regime, or capital logic.

**Key Principle**: Observability comes before optimization. We must understand what happened before we can improve it.

## Design Philosophy

### Core Principles

1. **Every decision generates an event**
   - No silent failures
   - No hidden decisions
   - Complete audit trail

2. **Snapshots are immutable**
   - Once created, never modified
   - Append-only storage
   - Historical record preserved

3. **Attribution explains outcomes**
   - Not just what happened, but why
   - Layer-by-layer breakdown
   - Honest performance diagnosis

4. **Replay is deterministic**
   - Same inputs → same outputs
   - No randomness
   - Verifiable results

5. **Investor interfaces are read-only**
   - No execution hooks
   - No governance bypass
   - View-only access

## System Architecture

### Components

1. **Event Log** (`core/observability/event_log.ts`)
   - Append-only log of all system events
   - Immutable event IDs
   - Queryable by type, strategy, date range

2. **Daily Snapshots** (`core/observability/daily_snapshot.ts`)
   - End-of-day immutable snapshots
   - Complete system state capture
   - Used for investor reporting

3. **Attribution Engine** (`core/observability/attribution_engine.ts`)
   - Attributes outcomes to layers
   - Explains why trades happened or didn't
   - Performance diagnosis

4. **Replay Engine** (`core/replay/replay_engine.ts`)
   - Deterministic replay of past days
   - Uses event log and snapshots
   - Produces identical outcomes

5. **Observability Hooks** (`core/observability/observability_integration.ts`)
   - Integrates logging into governance
   - Non-invasive (doesn't modify logic)
   - Adds visibility without changing behavior

## Event Log

### Event Types

The system logs the following event types:

```typescript
enum EventType {
  SIGNAL_GENERATED,        // Strategy generated a signal
  CAPITAL_CHECK,           // Capital gate checked
  REGIME_CHECK,            // Regime gate checked
  PERMISSION_CHECK,        // Permission gate checked
  RISK_CHECK,              // Risk governor checked
  TRADE_EXECUTED,          // Trade executed successfully
  TRADE_BLOCKED,           // Trade blocked by governance
  CAPITAL_UPDATE,          // Capital allocation changed
  STRATEGY_STATE_CHANGE,   // Strategy state changed
  SYSTEM_MODE_CHANGE,      // System mode changed
  REGIME_DETECTED,         // Regime detected for symbol
  POOL_UPDATE              // Capital pool updated
}
```

### Event Structure

Every event includes:

```typescript
{
  eventId: string;           // Immutable unique identifier
  timestamp: Date;           // When the event occurred
  eventType: EventType;      // Type of event
  strategyId?: string;       // Strategy involved (if applicable)
  systemMode?: string;       // System mode at time of event
  regime?: string;           // Current regime (if applicable)
  regimeConfidence?: number; // Regime confidence (if applicable)
  capitalAllocation?: number; // Capital allocation (if applicable)
  reason: string;            // Human-readable explanation
  metadata?: Record<string, any>; // Additional context
}
```

### Event Log Rules

1. **Append-only**
   - Events cannot be deleted
   - Events cannot be modified
   - Events cannot be overwritten

2. **Immutable**
   - Once appended, event is permanent
   - Event ID is unique and immutable
   - Timestamp is accurate

3. **Queryable**
   - By event type
   - By strategy
   - By date range
   - By symbol

## Daily Snapshots

### Snapshot Contents

Each daily snapshot captures:

```typescript
{
  snapshotId: string;              // Unique snapshot ID
  date: string;                   // YYYY-MM-DD format
  timestamp: Date;                // When snapshot was created
  
  // System state
  systemMode: string;             // Current system mode
  riskState: string;              // Current risk state
  
  // Equity metrics
  totalSystemEquity: number;      // Total system equity
  directionalPoolEquity: number;  // Directional pool equity
  arbitragePoolEquity: number;    // Arbitrage pool equity
  
  // Per-strategy PnL
  strategyPnL: Map<string, number>; // PnL per strategy
  
  // Drawdowns
  systemDrawdown: number;          // System-wide drawdown
  directionalPoolDrawdown: number; // Directional pool drawdown
  arbitragePoolDrawdown: number;  // Arbitrage pool drawdown
  strategyDrawdowns: Map<string, number>; // Per-strategy drawdown
  
  // Regime distribution
  regimeDistribution: {
    FAVORABLE: number;    // Count of FAVORABLE detections
    UNFAVORABLE: number; // Count of UNFAVORABLE detections
    UNKNOWN: number;     // Count of UNKNOWN detections
  };
  
  // Trade statistics
  tradesAttempted: number;  // Total trades attempted
  tradesBlocked: number;    // Total trades blocked
  tradesExecuted: number;   // Total trades executed
  
  // Blocking reasons breakdown
  blockingReasons: {
    CAPITAL: number;     // Blocked by capital gate
    REGIME: number;      // Blocked by regime gate
    PERMISSION: number; // Blocked by permission gate
    RISK: number;       // Blocked by risk governor
  };
  
  // Capital allocation summary
  capitalAllocation: Map<string, number>; // Per-strategy allocation
  
  // Event summary
  totalEvents: number;                    // Total events for the day
  eventTypes: Map<EventType, number>;     // Count by event type
}
```

### Snapshot Rules

1. **Immutable**
   - Once created, never modified
   - Historical record preserved
   - Used for investor reporting

2. **One per day**
   - Generated at end of trading day
   - Complete system state capture
   - Append-only storage

3. **Queryable**
   - By date
   - By date range
   - Most recent snapshot

## Attribution Engine

### Attribution Layers

The attribution engine attributes outcomes to four layers:

1. **Capital Layer**
   - Was trade blocked due to insufficient capital?
   - What was allocated vs. requested?
   - Why was capital insufficient?

2. **Regime Layer**
   - Was trade blocked due to regime mismatch?
   - What was current regime vs. allowed regimes?
   - Why was regime incompatible?

3. **Permission Layer**
   - Was trade blocked due to mode restrictions?
   - What was system mode?
   - Why was trading not allowed?

4. **Risk Layer**
   - Was trade blocked due to drawdown or limits?
   - What was risk state?
   - Why was risk check failed?

5. **Execution Layer**
   - Was trade executed successfully?
   - What was slippage?
   - What were fees?

### Attribution Result

For each trade (executed or blocked), attribution includes:

```typescript
{
  tradeId: string;
  strategyId: string;
  pair: string;
  timestamp: Date;
  
  // Layer decisions
  capitalLayer: { checked, allowed, reason, ... };
  regimeLayer: { checked, allowed, reason, ... };
  permissionLayer: { checked, allowed, reason, ... };
  riskLayer: { checked, allowed, reason, ... };
  executionLayer: { executed, orderId, executedValue, ... };
  
  // Final outcome
  finalOutcome: 'EXECUTED' | 'BLOCKED';
  blockingLayer?: 'CAPITAL' | 'REGIME' | 'PERMISSION' | 'RISK';
  
  // Attribution summary
  attribution: {
    layer: string;      // Which layer made the decision
    reason: string;     // Why
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  };
}
```

### Why Attribution Matters

1. **Honest Performance Diagnosis**
   - Understand why trades didn't execute
   - Identify bottlenecks
   - Measure layer effectiveness

2. **Non-Emotional Tuning**
   - Data-driven decisions
   - Clear cause-and-effect
   - Objective analysis

3. **Investor Confidence**
   - Transparent decision-making
   - Explainable outcomes
   - Audit trail

## Replay Engine

### Replay Capabilities

The replay engine can replay:

- **Single day**: Replay a specific trading day
- **Date range**: Replay multiple days
- **Deterministic**: Same inputs → same outputs

### Replay Process

1. **Load events** for the day from event log
2. **Load snapshot** for the day (for validation)
3. **Replay events** in chronological order
4. **Validate** against snapshot
5. **Report** discrepancies (if any)

### Replay Rules

1. **No execution**
   - Replay does NOT execute real trades
   - Replay uses recorded decisions
   - Replay is read-only

2. **Deterministic**
   - Same events → same outcome
   - No randomness
   - Verifiable

3. **Identical outcomes**
   - Replay should match snapshot
   - Discrepancies are reported
   - Used for debugging

### Use Cases

1. **Debugging**
   - Understand what happened on a specific day
   - Identify issues
   - Verify behavior

2. **Audits**
   - Prove system behavior
   - Verify governance
   - Demonstrate compliance

3. **Investor Questions**
   - Explain specific outcomes
   - Show decision process
   - Build confidence

## Read-Only Investor Interfaces

### API Endpoints

**Daily Snapshots** (`/api/observability/snapshots`)
- `GET /api/observability/snapshots?date=YYYY-MM-DD` - Get snapshot for date
- `GET /api/observability/snapshots?startDate=...&endDate=...` - Get snapshots in range
- `GET /api/observability/snapshots` - Get most recent snapshot

**Attribution** (`/api/observability/attribution`)
- `GET /api/observability/attribution?tradeId=...` - Get attribution for trade
- `GET /api/observability/attribution?startDate=...&endDate=...` - Get attribution summary

**Replay** (`/api/observability/replay`)
- `GET /api/observability/replay?date=YYYY-MM-DD` - Replay specific day
- `GET /api/observability/replay?startDate=...&endDate=...` - Replay date range

**Events** (`/api/observability/events`)
- `GET /api/observability/events` - Get all events (with filters)
- `GET /api/observability/events?eventType=...` - Filter by type
- `GET /api/observability/events?strategyId=...` - Filter by strategy
- `GET /api/observability/events?startDate=...&endDate=...` - Filter by date range

### API Rules

1. **Read-only**
   - No POST, PUT, DELETE methods
   - No execution hooks
   - No governance bypass

2. **No adapter imports**
   - APIs don't import exchange adapters
   - APIs don't execute trades
   - APIs only read observability data

3. **Investor-friendly**
   - Clear responses
   - Well-documented
   - Error handling

## Integration with Governance

### Observability Hooks

Observability hooks are integrated into governance system:

```typescript
// Capital check
observabilityHooks.logCapitalCheck(strategyId, tradeValue, result, systemMode);

// Regime check
observabilityHooks.logRegimeCheck(strategyId, symbol, result, systemMode);

// Permission check
observabilityHooks.logPermissionCheck(strategyId, result, systemMode);

// Risk check
observabilityHooks.logRiskCheck(strategyId, allowed, riskState, drawdown, reason, systemMode);

// Trade executed
observabilityHooks.logTradeExecuted(request, result, systemMode, regime, confidence);

// Trade blocked
observabilityHooks.logTradeBlocked(request, blockingLayer, reason, systemMode, regime, confidence);
```

### Non-Invasive Integration

**Key Principle**: Observability hooks do NOT modify execution logic.

- Hooks are called AFTER decisions are made
- Hooks only log, they don't change behavior
- Execution logic remains untouched

## Usage Examples

### Generate Daily Snapshot

```typescript
import { GovernanceSystem } from './core/governance_integration';

const governance = new GovernanceSystem({
  enableObservability: true
});

// At end of trading day
const snapshot = governance.snapshotGenerator.generateSnapshot(
  new Date(),
  governance.eventLog,
  governance.modeController.getMode(),
  governance.riskGovernor.getRiskState(),
  governance.directionalPool.getMetrics(),
  governance.arbitragePool.getMetrics(),
  strategyPnL,      // From your PnL tracking
  strategyDrawdowns, // From your drawdown tracking
  capitalAllocation  // From capital allocator
);
```

### Attribute a Trade

```typescript
const attribution = governance.attributionEngine.attributeTrade(
  governance.eventLog,
  'volatility_breakout',
  'BTC/USD',
  tradeTimestamp
);

console.log(`Trade ${attribution.tradeId}:`);
console.log(`  Outcome: ${attribution.finalOutcome}`);
console.log(`  Blocking Layer: ${attribution.blockingLayer}`);
console.log(`  Reason: ${attribution.attribution.reason}`);
```

### Replay a Day

```typescript
const replayResult = governance.replayEngine.replayDay(
  '2025-12-17',
  governance.eventLog,
  governance.snapshotGenerator.getSnapshot('2025-12-17')
);

console.log(`Replayed ${replayResult.date}:`);
console.log(`  Events: ${replayResult.eventsReplayed}`);
console.log(`  Trades Executed: ${replayResult.outcome.tradesExecuted}`);
console.log(`  Trades Blocked: ${replayResult.outcome.tradesBlocked}`);
```

### Query Events

```typescript
// Get all trade executions
const executions = governance.eventLog.getEventsByType(EventType.TRADE_EXECUTED);

// Get events for a strategy
const strategyEvents = governance.eventLog.getEventsByStrategy('volatility_breakout');

// Get events for a day
const dayEvents = governance.eventLog.getEventsForDay(new Date('2025-12-17'));

// Get events in date range
const rangeEvents = governance.eventLog.getEventsInRange(
  new Date('2025-12-01'),
  new Date('2025-12-17')
);
```

## Success Criteria

✅ **Phase 4 is complete**:

- [x] Every decision generates an event
- [x] Daily snapshots are immutable
- [x] Attribution explains why trades happened or didn't
- [x] Past days can be replayed deterministically
- [x] Dashboards are read-only
- [x] No execution logic was modified
- [x] Phase 1-3 remain untouched

## What Phase 4 Does NOT Do

Phase 4 explicitly does NOT:

- ❌ Modify ExecutionManager (Phase 1 untouched)
- ❌ Modify CapitalGate, RegimeGate, PermissionGate, or RiskGovernor
- ❌ Add new strategies
- ❌ Tune parameters
- ❌ Add ML or optimization
- ❌ Add execution shortcuts
- ❌ Change system behavior

## Why Observability Comes Before Optimization

### Principle

**You cannot optimize what you cannot measure.**

### Benefits

1. **Understand Before Improving**
   - Know what's happening
   - Identify bottlenecks
   - Measure effectiveness

2. **Data-Driven Decisions**
   - Objective analysis
   - Clear cause-and-effect
   - Non-emotional tuning

3. **Investor Confidence**
   - Transparent operations
   - Explainable outcomes
   - Audit trail

4. **Debugging**
   - Replay past days
   - Understand issues
   - Verify fixes

### Future Optimization

With observability in place:

- Can measure layer effectiveness
- Can identify optimization opportunities
- Can tune with data, not guesses
- Can verify improvements

## Next Steps

Phase 4 is complete. The system now:

1. Logs every decision as an event
2. Creates immutable daily snapshots
3. Attributes outcomes to layers
4. Can replay past days deterministically
5. Exposes read-only investor interfaces

**Wait for Phase 5 instructions** (if applicable).

---

## Appendix: Event Flow Example

### Complete Trade Flow with Observability

```
1. Strategy generates signal
   ↓
   Event: SIGNAL_GENERATED

2. CapitalGate.checkCapital()
   ↓
   Event: CAPITAL_CHECK
   ↓ (if allowed)

3. RegimeGate.checkEligibility()
   ↓
   Event: REGIME_CHECK
   ↓ (if allowed)

4. PermissionGate.checkPermission()
   ↓
   Event: PERMISSION_CHECK
   ↓ (if allowed)

5. RiskGovernor.approveTrade()
   ↓
   Event: RISK_CHECK
   ↓ (if approved)

6. ExecutionManager.executeTrade()
   ↓
   Event: TRADE_EXECUTED or TRADE_BLOCKED

7. Attribution Engine analyzes events
   ↓
   Attribution Result: Explains why trade executed or was blocked
```

### Daily Snapshot Generation

```
End of Trading Day:
1. Collect all events for the day
2. Calculate metrics:
   - Total equity
   - Per-strategy PnL
   - Drawdowns
   - Regime distribution
   - Trade statistics
   - Blocking reasons
3. Create immutable snapshot
4. Store snapshot (append-only)
5. Snapshot available for:
   - Investor reporting
   - Replay validation
   - Historical analysis
```

