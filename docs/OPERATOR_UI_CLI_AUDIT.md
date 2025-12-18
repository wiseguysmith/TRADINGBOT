# Operator UI / CLI Audit Report

**Date:** 2024  
**Purpose:** Identify existing UI, dashboard, API routes, and reporting components suitable for internal, read-only operator interface or CLI  
**Scope:** Internal-only, read-only, no execution controls, no auth complexity

---

## Executive Summary

The repository has a **strong foundation** for an operator interface:

✅ **Excellent API infrastructure** - Well-structured read-only endpoints for observability, health, and accounts  
✅ **Existing dashboard components** - Multiple React components that can be repurposed  
✅ **CLI scripts** - Limited but useful for testing/validation  
⚠️ **Mixed client/operator code** - Some components include execution controls that need removal  
⚠️ **Incomplete implementations** - Many APIs are placeholders needing governance system integration  

**Recommendation:** The structure is **more naturally suited to a minimal internal web UI** than a CLI, but both are feasible.

---

## 1. EXISTING UI COMPONENTS & PAGES

### ✅ Suitable for Operator Use (with modifications)

#### **`src/pages/dashboard.tsx`** (551 lines)
**Current Purpose:** Main trading dashboard with real-time performance  
**Contains:**
- Performance metrics display (PnL, win rate, trades)
- Strategy performance tracking
- Recent trades list
- Historical data charts
- **⚠️ ISSUE:** Includes `controlTrading()` function (POST to `/api/trading/performance`)

**Recommendation:**
- ✅ **REPURPOSE** - Remove trading controls, keep read-only displays
- ✅ Extract performance display components
- ❌ Remove `controlTrading()` function
- ✅ Keep auto-refresh functionality

#### **`src/components/ProductionDashboard.tsx`** (445 lines)
**Current Purpose:** Production trading dashboard  
**Contains:**
- Production performance metrics
- Recent trades display
- Balance display
- Risk level indicators
- **⚠️ ISSUE:** Includes `controlProduction()` function (POST to `/api/trading/production`)

**Recommendation:**
- ✅ **REPURPOSE** - Remove production controls, keep monitoring displays
- ✅ Extract performance visualization components
- ❌ Remove `controlProduction()` function
- ✅ Keep error handling and loading states

#### **`src/components/AdvancedTradingDashboard.tsx`** (297 lines)
**Current Purpose:** Advanced trading dashboard with strategy scores  
**Contains:**
- Performance overview
- Strategy scores and allocation decisions
- Risk metrics display
- Tab-based navigation
- **✅ GOOD:** Read-only data fetching only

**Recommendation:**
- ✅ **REPURPOSE AS-IS** - Already read-only focused
- ✅ Extract strategy performance components
- ✅ Keep tab navigation for operator views

#### **`src/pages/analytics.tsx`** (293 lines)
**Current Purpose:** Analytics page  
**Contains:**
- Performance analytics
- Trade statistics
- Win/loss metrics
- **✅ GOOD:** Read-only analytics

**Recommendation:**
- ✅ **REPURPOSE AS-IS** - Already read-only
- ✅ Extract analytics components for operator use

#### **`src/components/ProgressChart.tsx`**
**Current Purpose:** Visual portfolio performance tracking  
**Contains:**
- Canvas-based line charts
- Real-time updates
- **✅ GOOD:** Pure visualization component

**Recommendation:**
- ✅ **REPURPOSE AS-IS** - Perfect for operator dashboard
- ✅ Use for account equity curves, drawdown charts

### ❌ Not Suitable (Client-Facing / Execution Controls)

#### **`src/pages/production.tsx`**
**Contains:** Production trading controls - **NOT SUITABLE** for operator (has execution)

#### **`src/pages/backtesting.tsx`**
**Contains:** Backtesting interface - **NOT SUITABLE** for operator (testing tool)

#### **`src/pages/saas.tsx`**
**Contains:** SaaS dashboard - **NOT SUITABLE** for operator (client-facing)

#### **`src/pages/strategies.tsx`**
**Contains:** Strategy management - **NOT SUITABLE** for operator (may have controls)

#### **`src/components/UserDashboard.tsx`**
**Contains:** User-facing dashboard - **NOT SUITABLE** for operator (client-facing)

#### **`src/components/StrategyBuilder.tsx`**
**Contains:** Strategy creation - **NOT SUITABLE** for operator (configuration tool)

#### **`src/components/AuthModal.tsx`**
**Contains:** Authentication UI - **NOT SUITABLE** for operator (assume trusted operator)

---

## 2. EXISTING API ENDPOINTS

### ✅ Excellent for Operator Dashboard (Read-Only)

#### **Observability APIs** (`/api/observability/`)
**Status:** ✅ Read-only, well-structured, needs implementation completion

- **`/api/observability/snapshots.ts`**
  - GET only ✅
  - Daily immutable snapshots
  - **Status:** Placeholder (needs governance system injection)
  - **Suitable for:** Operator dashboard, CLI

- **`/api/observability/events.ts`**
  - GET only ✅
  - Event log access with filters
  - **Status:** Placeholder (needs governance system injection)
  - **Suitable for:** Operator dashboard, CLI

- **`/api/observability/attribution.ts`**
  - GET only ✅
  - Trade attribution breakdowns
  - **Status:** Placeholder (needs governance system injection)
  - **Suitable for:** Operator dashboard, CLI

- **`/api/observability/replay.ts`**
  - GET only ✅
  - Deterministic replay results
  - **Status:** Placeholder (needs governance system injection)
  - **Suitable for:** Operator dashboard, CLI

#### **Health APIs** (`/api/health/`)
**Status:** ✅ Read-only, well-structured, needs implementation completion

- **`/api/health/index.ts`**
  - GET only ✅
  - System health status
  - **Status:** Placeholder (needs governance system injection)
  - **Suitable for:** Operator dashboard, CLI, monitoring

- **`/api/health/status.ts`**
  - GET only ✅
  - Detailed system status
  - **Status:** Placeholder (needs governance system injection)
  - **Suitable for:** Operator dashboard, CLI

- **`/api/health/uptime.ts`**
  - GET only ✅
  - System uptime
  - **Status:** Placeholder (needs governance system injection)
  - **Suitable for:** Operator dashboard, CLI, monitoring

- **`/api/health/last_snapshot.ts`**
  - GET only ✅
  - Most recent snapshot
  - **Status:** Placeholder (needs governance system injection)
  - **Suitable for:** Operator dashboard, CLI

#### **Account APIs** (`/api/accounts/`)
**Status:** ✅ Read-only, Phase 7 implementation, needs completion

- **`/api/accounts/index.ts`**
  - GET only ✅
  - List all accounts with summaries
  - **Status:** Placeholder (needs account manager injection)
  - **Suitable for:** Operator dashboard, CLI

- **`/api/accounts/[accountId].ts`**
  - GET only ✅
  - Account details
  - **Status:** Placeholder (needs account manager injection)
  - **Suitable for:** Operator dashboard, CLI

- **`/api/accounts/[accountId]/snapshots.ts`**
  - GET only ✅
  - Account-scoped snapshots
  - **Status:** Placeholder (needs snapshot generator injection)
  - **Suitable for:** Operator dashboard, CLI

- **`/api/accounts/[accountId]/events.ts`**
  - GET only ✅
  - Account-scoped events
  - **Status:** Placeholder (needs event log injection)
  - **Suitable for:** Operator dashboard, CLI

### ⚠️ Needs Modification (Has POST/PUT/DELETE)

#### **Trading APIs** (`/api/trading/`)
**Status:** ⚠️ Contains POST methods for execution control

- **`/api/trading/production.ts`**
  - GET ✅ (read-only performance data)
  - POST ❌ (start/stop/emergency_stop controls)
  - **Recommendation:** Split into:
    - `/api/trading/production` (GET only - keep)
    - `/api/trading/production/control` (POST - remove or restrict to admin)

- **`/api/trading/performance.ts`**
  - GET ✅ (read-only performance data)
  - POST ❌ (start/stop controls)
  - **Recommendation:** Split into:
    - `/api/trading/performance` (GET only - keep)
    - `/api/trading/performance/control` (POST - remove or restrict)

### ❌ Not Suitable for Operator

#### **`/api/auth/*`**
- Login/register endpoints
- **NOT SUITABLE** - Assume trusted operator

#### **`/api/backtest/*`**
- Backtesting endpoints
- **NOT SUITABLE** - Testing tool, not operator interface

#### **`/api/telegram/send.ts`**
- Notification sending
- **NOT SUITABLE** - May have execution controls

#### **`/api/notify.ts`**
- Notification endpoint
- **NOT SUITABLE** - May have execution controls

#### **`/api/market-data/fetch.ts`**
- POST method for fetching
- **NOT SUITABLE** - May trigger operations

#### **`/api/market-data/cache-stats.ts`**
- GET ✅ (read-only cache stats)
- DELETE ❌ (cache clearing)
- **Recommendation:** Keep GET, remove DELETE for operator

---

## 3. CLI SCRIPTS & TOOLING

### ✅ Suitable for Operator CLI

#### **`scripts/test-real-trade.ts`**
**Purpose:** Real trade validation script  
**Contains:**
- Environment guards ✅
- Governance routing ✅
- **Status:** Good example of CLI structure
- **Suitable for:** Reference implementation for operator CLI

**Recommendation:**
- ✅ Use as template for operator CLI commands
- ✅ Extract governance integration patterns

### ⚠️ Limited Operator Value

#### **`scripts/comprehensive-backtest.js`**
**Purpose:** Backtesting script  
**Status:** Testing tool, not operator interface

#### **`scripts/strategy-optimizer.js`**
**Purpose:** Strategy optimization  
**Status:** Testing tool, not operator interface

#### **`scripts/daily-digest-scheduler.js`**
**Purpose:** Daily digest scheduling  
**Status:** May be useful for operator monitoring

#### **`scripts/setup-production.js`**
**Purpose:** Production setup  
**Status:** Setup tool, not operator interface

---

## 4. STRUCTURE ANALYSIS

### Current Structure Assessment

**Web UI Structure:** ✅ **STRONG**
- Next.js pages structure (`src/pages/`)
- React components (`src/components/`)
- API routes (`src/pages/api/`)
- Well-organized, component-based

**CLI Structure:** ⚠️ **WEAK**
- Limited CLI scripts
- No CLI framework (no Commander.js, yargs, etc.)
- Scripts are ad-hoc, not structured CLI

### Recommendation: **Minimal Internal Web UI**

**Rationale:**
1. ✅ Existing Next.js infrastructure
2. ✅ React components already built
3. ✅ API routes already structured
4. ✅ Component reusability
5. ✅ Better for real-time monitoring
6. ✅ Easier to visualize data

**CLI Alternative:**
- Would require building CLI framework from scratch
- Less suitable for real-time monitoring
- Better for batch operations and scripting

---

## 5. SPECIFIC FINDINGS

### Files Showing System State / Health / Performance

✅ **`src/pages/dashboard.tsx`**
- Shows: Performance metrics, strategies, trades
- **Action:** Remove controls, keep displays

✅ **`src/components/ProductionDashboard.tsx`**
- Shows: Production performance, risk levels
- **Action:** Remove controls, keep displays

✅ **`src/components/AdvancedTradingDashboard.tsx`**
- Shows: Strategy scores, allocation decisions
- **Action:** Use as-is (already read-only)

✅ **`src/pages/analytics.tsx`**
- Shows: Analytics, trade statistics
- **Action:** Use as-is (already read-only)

### Files Showing Account-Level Information

✅ **`src/pages/api/accounts/index.ts`**
- Shows: Account summaries
- **Action:** Complete implementation

✅ **`src/pages/api/accounts/[accountId].ts`**
- Shows: Account details
- **Action:** Complete implementation

✅ **`src/pages/api/accounts/[accountId]/snapshots.ts`**
- Shows: Account snapshots
- **Action:** Complete implementation

✅ **`src/pages/api/accounts/[accountId]/events.ts`**
- Shows: Account events
- **Action:** Complete implementation

### API Endpoints Suitable for Operator Dashboard

**Read-Only Observability:**
- ✅ `/api/observability/snapshots` - Daily snapshots
- ✅ `/api/observability/events` - Event log
- ✅ `/api/observability/attribution` - Attribution breakdowns
- ✅ `/api/observability/replay` - Replay results

**Read-Only Health:**
- ✅ `/api/health` - System health
- ✅ `/api/health/status` - Detailed status
- ✅ `/api/health/uptime` - Uptime
- ✅ `/api/health/last_snapshot` - Last snapshot

**Read-Only Accounts:**
- ✅ `/api/accounts` - List accounts
- ✅ `/api/accounts/[accountId]` - Account details
- ✅ `/api/accounts/[accountId]/snapshots` - Account snapshots
- ✅ `/api/accounts/[accountId]/events` - Account events

**Read-Only Performance:**
- ✅ `/api/trading/production` (GET only) - Production performance
- ✅ `/api/trading/performance` (GET only) - Performance metrics

### API Endpoints Suitable for CLI

**Same as Dashboard:**
- All read-only endpoints above are CLI-friendly
- JSON responses work well for CLI parsing
- Filter parameters work well for CLI arguments

**CLI-Specific Considerations:**
- ✅ Event log filtering (`?eventType=...&startDate=...&endDate=...`)
- ✅ Snapshot date ranges (`?startDate=...&endDate=...`)
- ✅ Account filtering (`?accountId=...`)

### Frontend Components to Repurpose

✅ **Keep & Repurpose:**
- `src/components/ProgressChart.tsx` - Charts for operator dashboard
- `src/components/AdvancedTradingDashboard.tsx` - Strategy performance view
- `src/pages/analytics.tsx` - Analytics components

⚠️ **Modify & Repurpose:**
- `src/pages/dashboard.tsx` - Remove controls, keep displays
- `src/components/ProductionDashboard.tsx` - Remove controls, keep displays

❌ **Remove or Deprecate:**
- `src/pages/production.tsx` - Has execution controls
- `src/pages/saas.tsx` - Client-facing
- `src/components/UserDashboard.tsx` - Client-facing
- `src/components/AuthModal.tsx` - Not needed (trusted operator)
- `src/components/StrategyBuilder.tsx` - Configuration tool

---

## 6. RECOMMENDATIONS

### For Minimal Internal Web UI

**Phase 1: Complete API Implementations**
1. Complete governance system injection in:
   - `/api/observability/*` endpoints
   - `/api/health/*` endpoints
   - `/api/accounts/*` endpoints

**Phase 2: Create Operator Dashboard**
1. Create new `/src/pages/operator/dashboard.tsx`
2. Repurpose components:
   - `ProgressChart.tsx` for equity curves
   - `AdvancedTradingDashboard.tsx` for strategy view
   - `analytics.tsx` components for analytics
3. Remove all execution controls
4. Add account-level views

**Phase 3: Operator-Specific Views**
1. System health overview
2. Account summary table
3. Event log viewer (with filters)
4. Snapshot viewer (date range)
5. Attribution breakdowns
6. Replay interface

### For CLI Interface

**Phase 1: CLI Framework**
1. Install CLI framework (Commander.js or yargs)
2. Create `/cli/` directory structure
3. Use `scripts/test-real-trade.ts` as template

**Phase 2: CLI Commands**
1. `operator health` - System health check
2. `operator accounts` - List accounts
3. `operator account <id>` - Account details
4. `operator events [filters]` - Event log query
5. `operator snapshots [date]` - Snapshot viewer
6. `operator replay <date>` - Replay day
7. `operator attribution [tradeId]` - Attribution breakdown

**Phase 3: CLI Output Formatting**
1. JSON output (default)
2. Table output (for lists)
3. Human-readable (for details)

### Hybrid Approach (Recommended)

**Web UI for Monitoring:**
- Real-time dashboards
- Visual charts and graphs
- Interactive filtering
- Account-level views

**CLI for Operations:**
- Health checks
- Batch queries
- Scripting integration
- Automation

---

## 7. EXACT FILES & PATHS

### ✅ Ready to Use (Read-Only APIs)

```
src/pages/api/observability/snapshots.ts
src/pages/api/observability/events.ts
src/pages/api/observability/attribution.ts
src/pages/api/observability/replay.ts
src/pages/api/health/index.ts
src/pages/api/health/status.ts
src/pages/api/health/uptime.ts
src/pages/api/health/last_snapshot.ts
src/pages/api/accounts/index.ts
src/pages/api/accounts/[accountId].ts
src/pages/api/accounts/[accountId]/snapshots.ts
src/pages/api/accounts/[accountId]/events.ts
```

### ⚠️ Needs Modification (Remove Controls)

```
src/pages/api/trading/production.ts  (Split GET/POST)
src/pages/api/trading/performance.ts (Split GET/POST)
src/pages/dashboard.tsx              (Remove controlTrading)
src/components/ProductionDashboard.tsx (Remove controlProduction)
```

### ✅ Ready to Repurpose (Components)

```
src/components/ProgressChart.tsx
src/components/AdvancedTradingDashboard.tsx
src/pages/analytics.tsx
```

### ❌ Remove or Deprecate (Client-Facing)

```
src/pages/production.tsx
src/pages/saas.tsx
src/pages/backtesting.tsx
src/components/UserDashboard.tsx
src/components/AuthModal.tsx
src/components/StrategyBuilder.tsx
src/pages/api/auth/*
src/pages/api/backtest/*
```

### 📝 Reference Implementation

```
scripts/test-real-trade.ts  (CLI structure example)
```

---

## 8. SUMMARY

### Current State

✅ **Strong API Foundation** - Well-structured read-only endpoints  
✅ **Good Component Library** - Reusable React components  
⚠️ **Mixed Concerns** - Some components have execution controls  
⚠️ **Incomplete** - Many APIs are placeholders  

### Recommendation

**Primary:** Minimal Internal Web UI  
**Secondary:** CLI for operations and scripting  
**Approach:** Hybrid (Web UI + CLI)

### Next Steps

1. Complete API implementations (governance system injection)
2. Create operator-specific dashboard pages
3. Remove execution controls from existing components
4. Build CLI framework (if CLI desired)
5. Create operator-specific views

---

**Audit Complete** ✅  
**No Implementation Required** - This is an audit and recommendation only.

