# Phase 1 Seal - Required Fixes

## Critical Fixes Required

### Fix 1: Refactor LiveTradingEngine to Use ExecutionManager

**File:** `src/services/liveTradingEngine.ts`

**Current Violation:**
- Lines 242-244: Direct `kraken.placeBuyOrder()` and `kraken.placeSellOrder()` calls

**Fix:**
1. Add `executionManager` to constructor
2. Replace direct exchange calls with `executionManager.executeTrade()`
3. Convert `TradeSignal` to `TradeRequest` format

**Code Changes:**
```typescript
// Add to constructor
constructor(config: LiveTradeConfig, executionManager?: ExecutionManager) {
  // ...
  this.executionManager = executionManager;
}

// Replace executeTrade method
async executeTrade(signal: TradeSignal, pair: string, strategy: string): Promise<LiveTradeResult> {
  if (!this.executionManager) {
    throw new Error('ExecutionManager not configured - governance required');
  }
  
  // Convert signal to TradeRequest
  const request = createTradeRequest({
    strategy,
    pair,
    action: signal === TradeSignal.BUY ? 'buy' : 'sell',
    amount: positionSize.quantity,
    price: positionSize.price
  });
  
  // Use ExecutionManager
  const result = await this.executionManager.executeTrade(request);
  
  // Convert result back to LiveTradeResult format
  return {
    success: result.success,
    orderId: result.orderId,
    executionPrice: result.executedValue,
    quantity: request.amount,
    timestamp: result.timestamp.getTime(),
    strategy,
    signal
  };
}
```

---

### Fix 2: Refactor RealTradingEngine to Use ExecutionManager

**File:** `src/services/realTradingEngine.ts`

**Current Violation:**
- Line 79: Direct `executeKrakenOrder()` call

**Fix:**
1. Add `executionManager` to constructor
2. Replace `executeRealTrade()` to use ExecutionManager
3. Remove direct exchange execution

---

### Fix 3: Refactor TradingService to Use ExecutionManager

**File:** `src/services/tradingService.ts`

**Current Violation:**
- Lines 116, 289: Direct `client.addOrder()` calls

**Fix:**
1. Remove exchange client from constructor
2. Add `executionManager` to constructor
3. Replace `placeOrder()` and `executeTrade()` to use ExecutionManager

---

### Fix 4: Isolate Exchange Adapters

**Action:** Create adapter directory structure

**New Structure:**
```
core/
  adapters/
    index.ts          # Export only ExecutionManager can use
    krakenAdapter.ts
    coinbaseAdapter.ts
    bybitAdapter.ts
    uniswapAdapter.ts
    types.ts          # Common adapter interface
```

**Enforcement:**
- Move all exchange wrappers to `core/adapters/`
- Export only through `index.ts` with restricted access
- Only ExecutionManager can import adapters

---

### Fix 5: Remove Strategy Exchange Access

**Files:**
- `src/services/strategyService.ts`
- All strategy files

**Fix:**
1. Remove `KrakenWrapper` from `StrategyService` constructor
2. Strategies only generate signals (no execution)
3. All execution through ExecutionManager

---

### Fix 6: Verify Observe-Only Safety

**File:** `core/execution_manager.ts`

**Current Status:** ✅ Already correct
- Failed trades don't call `recordTradeExecution()` (early return)
- OBSERVE_ONLY blocked by permission gate
- `simulateExecution()` returns `success: false` in OBSERVE_ONLY

**Verification Needed:**
- [ ] Test that OBSERVE_ONLY trades don't update positions
- [ ] Test that OBSERVE_ONLY trades don't update PnL
- [ ] Test that `recordTradeExecution()` is not called for blocked trades

---

## Implementation Order

1. **Create adapter structure** (Fix 4)
2. **Refactor execution paths** (Fixes 1, 2, 3)
3. **Remove strategy exchange access** (Fix 5)
4. **Verify observe-only safety** (Fix 6)
5. **Re-run audit**

---

## Testing Checklist

After fixes:

- [ ] No direct `placeBuyOrder()` calls exist
- [ ] No direct `placeSellOrder()` calls exist
- [ ] No direct `addOrder()` calls exist
- [ ] All execution goes through ExecutionManager
- [ ] Exchange adapters only imported by ExecutionManager
- [ ] Strategies cannot access exchange clients
- [ ] OBSERVE_ONLY mode blocks all execution
- [ ] SHUTDOWN state blocks all execution
- [ ] Permission gate is checked before every execution

