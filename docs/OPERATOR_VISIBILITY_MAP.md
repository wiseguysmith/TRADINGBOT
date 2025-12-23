# Operator Visibility Map

**Purpose**: Map all existing operator-facing visibility components and propose minimal Operator Dashboard structure.

**Status**: Analysis Complete - Ready for Implementation

---

## 1. READ-ONLY API ENDPOINTS

### ✅ Observability APIs (`/api/observability/`)

#### `/api/observability/snapshots`
- **File**: `src/pages/api/observability/snapshots.ts`
- **Method**: GET only ✅
- **Purpose**: Daily immutable snapshots
- **Status**: ✅ Implemented (reads from governance system)
- **Returns**: Snapshot data for date range or most recent
- **Use Case**: Historical system state, daily summaries

#### `/api/observability/events`
- **File**: `src/pages/api/observability/events.ts`
- **Method**: GET only ✅
- **Purpose**: Event log access with filtering
- **Status**: ✅ Implemented (reads from EventLog)
- **Filters**: `eventType`, `strategyId`, `startDate`, `endDate`
- **Use Case**: Debugging, audit trails, trade attribution

#### `/api/observability/attribution`
- **File**: `src/pages/api/observability/attribution.ts`
- **Method**: GET only ✅
- **Purpose**: Trade attribution breakdowns
- **Status**: ✅ Implemented
- **Returns**: PnL attribution by strategy, regime, capital pool
- **Use Case**: Performance analysis, strategy evaluation

#### `/api/observability/replay`
- **File**: `src/pages/api/observability/replay.ts`
- **Method**: GET only ✅
- **Purpose**: Deterministic replay results
- **Status**: ✅ Implemented
- **Returns**: Replay data for date range
- **Use Case**: Debugging, verification, investor questions

#### `/api/observability/parity-summary`
- **File**: `src/pages/api/observability/parity-summary.ts`
- **Method**: GET only ✅
- **Purpose**: Shadow trading parity summary (Phase 9)
- **Status**: ⚠️ Placeholder (returns 503 when shadow mode not active)
- **Returns**: Parity metrics comparing simulated vs observed execution
- **Use Case**: Execution accuracy validation, confidence assessment
- **Note**: Currently requires shadow mode to be active; future: persist to storage

#### `/api/observability/confidence-report`
- **File**: `src/pages/api/observability/confidence-report.ts`
- **Method**: GET only ✅
- **Purpose**: Confidence accumulation reports (Phase 10)
- **Status**: ✅ Implemented (reads from `reports/` directory)
- **Query Params**: `date` (optional), `format` (json|text)
- **Returns**: Confidence report JSON or text
- **Use Case**: Execution readiness assessment, regime coverage tracking

### ✅ Health APIs (`/api/health/`)

#### `/api/health`
- **File**: `src/pages/api/health/index.ts`
- **Method**: GET only ✅
- **Purpose**: System health status
- **Status**: ✅ Implemented
- **Returns**: Health status, uptime, last updates

#### `/api/health/status`
- **File**: `src/pages/api/health/status.ts`
- **Method**: GET only ✅
- **Purpose**: Detailed system status
- **Status**: ✅ Implemented
- **Returns**: System mode, risk state, current regime, trading allowed
- **Includes**: Current regime detection (regime + confidence)

#### `/api/health/uptime`
- **File**: `src/pages/api/health/uptime.ts`
- **Method**: GET only ✅
- **Purpose**: System uptime
- **Status**: ✅ Implemented
- **Returns**: Uptime in seconds and human-readable format

#### `/api/health/last_snapshot`
- **File**: `src/pages/api/health/last_snapshot.ts`
- **Method**: GET only ✅
- **Purpose**: Most recent snapshot
- **Status**: ✅ Implemented
- **Returns**: Last snapshot date, equity, drawdown, trades

### ✅ Account APIs (`/api/accounts/`)

#### `/api/accounts`
- **File**: `src/pages/api/accounts/index.ts`
- **Method**: GET only ✅
- **Purpose**: List all accounts with summaries
- **Status**: ✅ Implemented (Phase 7)
- **Returns**: Account list with equity, PnL, drawdown, state

#### `/api/accounts/[accountId]`
- **File**: `src/pages/api/accounts/[accountId].ts`
- **Method**: GET only ✅
- **Purpose**: Account details
- **Status**: ✅ Implemented
- **Returns**: Full account details, capital metrics, strategies

#### `/api/accounts/[accountId]/snapshots`
- **File**: `src/pages/api/accounts/[accountId]/snapshots.ts`
- **Method**: GET only ✅
- **Purpose**: Account-scoped snapshots
- **Status**: ✅ Implemented
- **Returns**: Snapshots for specific account

#### `/api/accounts/[accountId]/events`
- **File**: `src/pages/api/accounts/[accountId]/events.ts`
- **Method**: GET only ✅
- **Purpose**: Account-scoped events
- **Status**: ✅ Implemented
- **Returns**: Events filtered by account

### ⚠️ Trading APIs (GET Only - Read-Only Performance)

#### `/api/trading/production`
- **File**: `src/pages/api/trading/production.ts`
- **Method**: GET ✅ (read-only performance), POST ❌ (controls)
- **Purpose**: Production trading performance
- **Status**: ✅ GET implemented, POST exists but should be restricted
- **Returns**: Performance metrics, recent trades, balance
- **Note**: POST methods exist for controls - should be removed or admin-restricted

#### `/api/trading/performance`
- **File**: `src/pages/api/trading/performance.ts`
- **Method**: GET ✅ (read-only)
- **Purpose**: Performance metrics
- **Status**: ✅ Implemented
- **Returns**: Performance data, strategies, trades

### ❌ Strategy APIs (May Have Controls)

#### `/api/strategies/list`
- **File**: `src/pages/api/strategies/list.ts`
- **Method**: GET ✅
- **Purpose**: List strategies
- **Status**: ✅ Read-only
- **Use Case**: Strategy listing

#### `/api/strategies/metadata`
- **File**: `src/pages/api/strategies/metadata.ts`
- **Method**: GET ✅
- **Purpose**: Strategy metadata
- **Status**: ✅ Read-only
- **Use Case**: Strategy details

---

## 2. EXISTING UI COMPONENTS

### ✅ Operator Pages (Read-Only)

#### `/operator/overview`
- **File**: `src/pages/operator/overview.tsx`
- **Status**: ✅ Read-only operator dashboard
- **Displays**:
  - System mode and risk state
  - Health status and uptime
  - Current regime + confidence
  - Last snapshot timestamp
  - System details (memory, error rate, execution queue)
- **APIs Used**: `/api/health/status`, `/api/health`, `/api/health/last_snapshot`
- **Design**: Calm, low-stress, read-only
- **Suitable**: ✅ Perfect for operator dashboard

#### `/operator/accounts`
- **File**: `src/pages/operator/accounts.tsx`
- **Status**: ✅ Read-only account listing
- **Displays**:
  - Account list with summaries
  - Equity, PnL, drawdown
  - Account state
  - Enabled strategies
- **APIs Used**: `/api/accounts`
- **Suitable**: ✅ Perfect for operator dashboard

#### `/operator/snapshots`
- **File**: `src/pages/operator/snapshots.tsx`
- **Status**: ✅ Read-only snapshot viewer
- **APIs Used**: `/api/observability/snapshots`
- **Suitable**: ✅ Perfect for operator dashboard

#### `/operator/events`
- **File**: `src/pages/operator/events.tsx`
- **Status**: ✅ Read-only event log viewer
- **APIs Used**: `/api/observability/events`
- **Suitable**: ✅ Perfect for operator dashboard

### ⚠️ Dashboard Components (May Have Controls)

#### `ProductionDashboard`
- **File**: `src/components/ProductionDashboard.tsx`
- **Status**: ⚠️ Modified to remove controls (see line 39-40)
- **Displays**: Production performance, trades, balance
- **APIs Used**: `/api/trading/production` (GET only)
- **Controls Removed**: ✅ Execution controls removed (commented)
- **Suitable**: ✅ Can be reused (controls already removed)

#### `AdvancedTradingDashboard`
- **File**: `src/components/AdvancedTradingDashboard.tsx`
- **Status**: Unknown (needs review)
- **Use Case**: Strategy performance visualization
- **Suitable**: ⚠️ Review needed - may have controls

#### `ProgressChart`
- **File**: `src/components/ProgressChart.tsx`
- **Status**: ✅ Read-only chart component
- **Use Case**: Visualization
- **Suitable**: ✅ Can be reused

### ❌ Client-Facing Components (Not Suitable)

#### `UserDashboard`
- **File**: `src/components/UserDashboard.tsx`
- **Status**: ❌ Client-facing
- **Suitable**: ❌ Not for operator

#### `SaasDashboard`
- **File**: `src/components/SaasDashboard.tsx`
- **Status**: ❌ Client-facing
- **Suitable**: ❌ Not for operator

#### `dashboard.tsx`
- **File**: `src/pages/dashboard.tsx`
- **Status**: ⚠️ Modified to remove controls (see line 69-70)
- **Suitable**: ⚠️ Review needed - may have client-facing elements

---

## 3. PROPOSED MINIMAL OPERATOR DASHBOARD STRUCTURE

### Dashboard Layout

```
/operator/
├── overview          ✅ EXISTS - System status, health, regime
├── accounts          ✅ EXISTS - Account listing
├── snapshots         ✅ EXISTS - Snapshot viewer
├── events            ✅ EXISTS - Event log
├── confidence        ❌ NEW - Confidence & parity dashboard
└── parity            ❌ NEW - Parity metrics (or merge with confidence)
```

### New Page: `/operator/confidence`

**Purpose**: "Are we ready for live trading?"

**Displays**:
1. **Confidence Summary Card**
   - Overall confidence score (0-100)
   - Ready for live trading (boolean)
   - Readiness factors (coverage, confidence, unsafe, trend)

2. **Regime Coverage Card**
   - Total shadow trades
   - Coverage by regime (FAVORABLE, UNFAVORABLE, UNKNOWN)
   - Progress bars showing X/Y trades per regime
   - Coverage percentage

3. **Confidence Metrics Card**
   - Confidence by strategy (table)
   - Confidence by regime (table)
   - Overall confidence trend (chart)

4. **Unsafe Combinations Alert**
   - List of unsafe strategy×regime combinations
   - Reasons why unsafe
   - Red alert styling if any exist

5. **Trend Analysis Card**
   - Overall trend (IMPROVING/DEGRADING/STABLE)
   - Trend confidence
   - Current window metrics
   - Trend chart (if multiple snapshots)

**APIs Used**:
- `/api/observability/confidence-report` (most recent)
- `/api/observability/confidence-report?date=YYYY-MM-DD` (specific date)

**Design**: 
- Calm, read-only
- Green/yellow/red status indicators
- Progress bars for coverage
- Tables for metrics
- Charts for trends

### New Page: `/operator/parity` (Optional - Can Merge with Confidence)

**Purpose**: "How accurate is our execution simulation?"

**Displays**:
1. **Parity Summary Card**
   - Fill match statistics
   - Price error statistics
   - Slippage error statistics
   - Overall confidence score

2. **Trade Records Table**
   - Individual shadow trade records
   - Decision price vs observed price
   - Fill match status
   - Price error

**APIs Used**:
- `/api/observability/parity-summary` (when shadow mode active)

**Design**: 
- Read-only tables
- Color-coded accuracy indicators
- Expandable rows for details

---

## 4. FILE REUSE RECOMMENDATIONS

### ✅ Files to Reuse As-Is

1. **`src/pages/operator/overview.tsx`**
   - ✅ Already read-only
   - ✅ Uses correct APIs
   - ✅ Good design pattern
   - **Action**: Keep as-is, add link to confidence page

2. **`src/pages/operator/accounts.tsx`**
   - ✅ Already read-only
   - ✅ Uses correct APIs
   - **Action**: Keep as-is

3. **`src/pages/operator/snapshots.tsx`**
   - ✅ Already read-only
   - **Action**: Keep as-is

4. **`src/pages/operator/events.tsx`**
   - ✅ Already read-only
   - **Action**: Keep as-is

5. **`src/components/ProgressChart.tsx`**
   - ✅ Read-only chart component
   - **Action**: Reuse for coverage progress bars

### ⚠️ Files to Review/Modify

1. **`src/components/ProductionDashboard.tsx`**
   - ⚠️ Controls already removed (commented)
   - **Action**: Verify no execution controls remain
   - **Reuse**: Performance visualization components only

2. **`src/pages/dashboard.tsx`**
   - ⚠️ Controls removed (commented)
   - **Action**: Review for client-facing elements
   - **Reuse**: Visualization components only

### ❌ Files NOT to Reuse

1. **`src/components/UserDashboard.tsx`**
   - ❌ Client-facing
   - **Action**: Do not reuse

2. **`src/components/SaasDashboard.tsx`**
   - ❌ Client-facing
   - **Action**: Do not reuse

3. **`src/pages/production.tsx`**
   - ❌ May have execution controls
   - **Action**: Do not reuse

---

## 5. IMPLEMENTATION PLAN

### Option A: Extend Existing Operator Pages (Recommended)

**Advantages**:
- ✅ Consistent with existing operator UI
- ✅ Reuses existing patterns
- ✅ Minimal new code
- ✅ Already read-only

**Steps**:
1. Create `/operator/confidence.tsx` following same pattern as `/operator/overview.tsx`
2. Add navigation link in operator pages
3. Use existing card/table components
4. Fetch from `/api/observability/confidence-report`
5. Display confidence metrics, coverage, trends

**Files to Create**:
- `src/pages/operator/confidence.tsx` (new)

**Files to Modify**:
- `src/pages/operator/overview.tsx` (add navigation link)
- `src/pages/operator/accounts.tsx` (add navigation link)
- `src/pages/operator/snapshots.tsx` (add navigation link)
- `src/pages/operator/events.tsx` (add navigation link)

### Option B: CLI-First Alternative

**If UI reuse is insufficient**, recommend CLI tool:

**File**: `scripts/operator-dashboard-cli.ts`

**Features**:
- Fetch confidence report via API
- Display formatted text output
- Show parity summary
- Show regime coverage
- Show unsafe combinations

**Advantages**:
- ✅ No UI dependencies
- ✅ Works in any environment
- ✅ Easy to script/automate
- ✅ Can pipe to files

**Disadvantages**:
- ❌ Less visual
- ❌ No real-time updates
- ❌ Requires manual refresh

---

## 6. VISUAL MAP: How Operator Sees Bot Activity

### Current Visibility (Existing)

```
Operator Overview (/operator/overview)
├── System Status
│   ├── Mode (AGGRESSIVE/OBSERVE_ONLY)
│   ├── Risk State
│   └── Trading Allowed
├── Health Status
│   ├── Healthy/Unhealthy
│   ├── Uptime
│   └── Last Updates
├── Market Regime
│   ├── Current Regime (FAVORABLE/UNFAVORABLE/UNKNOWN)
│   └── Confidence %
└── Last Snapshot
    ├── Date
    ├── System Equity
    ├── Drawdown
    └── Trades Executed

Operator Accounts (/operator/accounts)
├── Account List
│   ├── Account ID
│   ├── Equity
│   ├── P&L
│   ├── Drawdown
│   ├── State
│   └── Strategies
└── Summary Stats
    ├── Total Accounts
    ├── Total Equity
    ├── Total P&L
    └── Active Accounts

Operator Snapshots (/operator/snapshots)
└── Daily Snapshots
    ├── Date Selection
    └── Snapshot Details

Operator Events (/operator/events)
└── Event Log
    ├── Filters (type, strategy, date)
    └── Event List
```

### Proposed Additional Visibility

```
Operator Confidence (/operator/confidence) [NEW]
├── Confidence Summary
│   ├── Overall Confidence Score (0-100)
│   ├── Ready for Live Trading (YES/NO)
│   └── Readiness Factors
│       ├── Coverage Met ✅/❌
│       ├── Confidence Met ✅/❌
│       ├── No Unsafe Combinations ✅/❌
│       └── Trend Stable ✅/❌
├── Regime Coverage
│   ├── Total Shadow Trades
│   ├── Coverage by Regime
│   │   ├── FAVORABLE: X/Y (Z%) [Progress Bar]
│   │   ├── UNFAVORABLE: X/Y (Z%) [Progress Bar]
│   │   └── UNKNOWN: X/Y (Z%) [Progress Bar]
│   └── Overall Coverage %
├── Confidence Metrics
│   ├── By Strategy (Table)
│   │   ├── Strategy Name
│   │   ├── Average Confidence
│   │   ├── Worst Case
│   │   ├── Std Dev
│   │   └── Is Confident ✅/❌
│   ├── By Regime (Table)
│   │   ├── Regime
│   │   ├── Average Confidence
│   │   ├── Worst Case
│   │   └── Is Confident ✅/❌
│   └── Overall Trend (Chart)
│       ├── Trend Direction (IMPROVING/DEGRADING/STABLE)
│       ├── Trend Confidence
│       └── Time Series Chart
├── Unsafe Combinations Alert
│   └── List of Unsafe Strategy×Regime Combinations
│       ├── Strategy × Regime
│       ├── Average Confidence
│       ├── Worst Case
│       └── Reason (why unsafe)
└── Recommendations & Warnings
    ├── Recommendations (actionable items)
    └── Warnings (critical issues)
```

---

## 7. SUMMARY

### Existing Read-Only APIs ✅

**Observability**:
- ✅ `/api/observability/snapshots`
- ✅ `/api/observability/events`
- ✅ `/api/observability/attribution`
- ✅ `/api/observability/replay`
- ✅ `/api/observability/parity-summary` (placeholder)
- ✅ `/api/observability/confidence-report` (implemented)

**Health**:
- ✅ `/api/health`
- ✅ `/api/health/status` (includes regime)
- ✅ `/api/health/uptime`
- ✅ `/api/health/last_snapshot`

**Accounts**:
- ✅ `/api/accounts`
- ✅ `/api/accounts/[accountId]`
- ✅ `/api/accounts/[accountId]/snapshots`
- ✅ `/api/accounts/[accountId]/events`

**Performance**:
- ✅ `/api/trading/production` (GET only)
- ✅ `/api/trading/performance` (GET only)

### Existing Read-Only UI ✅

**Operator Pages**:
- ✅ `/operator/overview` - System status, health, regime
- ✅ `/operator/accounts` - Account listing
- ✅ `/operator/snapshots` - Snapshot viewer
- ✅ `/operator/events` - Event log

**Components**:
- ✅ `ProgressChart` - Reusable chart component
- ⚠️ `ProductionDashboard` - Controls removed, verify

### Proposed Addition

**New Page**: `/operator/confidence`
- Purpose: Confidence accumulation & parity visibility
- APIs: `/api/observability/confidence-report`
- Design: Follow existing operator page patterns
- Components: Reuse cards, tables, charts from existing pages

### Implementation Recommendation

**✅ Option A: Extend Existing Operator Pages**

1. Create `src/pages/operator/confidence.tsx`
2. Follow pattern from `src/pages/operator/overview.tsx`
3. Add navigation links to all operator pages
4. Reuse `ProgressChart` for coverage visualization
5. Use existing card/table styling

**No execution controls needed** - all APIs are read-only ✅

---

**Status**: ✅ Analysis Complete

**Next Step**: Implement `/operator/confidence.tsx` following existing operator page patterns.
