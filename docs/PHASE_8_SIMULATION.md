# Phase 8: High-Fidelity Simulation & Paper Trading

## Overview

Phase 8 implements a simulation layer that mirrors live execution as closely as possible while using fake capital. This enables paper trading and high-fidelity backtesting without modifying execution logic.

## Key Principles

- **Execution Path Parity**: Simulated execution uses the SAME execution flow as live trading
- **Adapter Abstraction**: Only the adapter differs - all governance logic remains unchanged
- **Observability Parity**: Simulated trades produce identical events, snapshots, and attribution
- **Never Places Real Orders**: Simulation is completely safe and read-only

## Components

### 1. Simulation Configuration (`core/simulation/simulation_config.ts`)

Defines simulation parameters:
- **Fixed Latency**: Configurable network latency simulation (default: 100ms)
- **Max Liquidity Per Fill**: Limits how much depth can be consumed per fill (default: 10%)
- **Fee Schedule**: Maker/taker fees (default: 0.1% maker, 0.2% taker)
- **Funding Rate Handling**: Configurable funding rate simulation
- **Slippage Model**: Deterministic slippage calculation (linear or square root)

### 2. Simulated Execution Adapter (`core/adapters/simulatedExecutionAdapter.ts`)

Implements `ExchangeAdapter` interface but simulates execution:
- Uses real market data (ticker, order book depth)
- Applies deterministic partial fills based on available depth
- Calculates realistic fees (maker/taker)
- Applies slippage based on trade size
- Simulates latency
- **NEVER places real orders**

### 3. Execution Mode (`core/execution_manager.ts`)

Added `ExecutionMode` type:
- `SIMULATION`: Routes to `SimulatedExecutionAdapter`
- `REAL`: Routes to real exchange adapters

ExecutionManager now:
- Accepts `executionMode` in config (default: `REAL`)
- Routes execution based on mode
- Adds `executionType` metadata to TradeResult
- Includes execution type in execution history

### 4. Observability Parity (`core/observability/`)

Updated to include execution type metadata:
- `TradeExecutedEvent` includes `executionType: 'SIMULATED' | 'REAL'`
- Event metadata includes fees and slippage from simulated execution
- Snapshots and attribution work identically for simulated and real trades

## Usage

### Initialize Governance with Simulation Mode

```typescript
import { initializeGovernance } from './lib/governance_instance';
import { SimulatedExecutionAdapter } from './core/adapters';
import { MarketDataService } from './src/services/marketDataService';

const marketDataService = new MarketDataService();
const simulatedAdapter = new SimulatedExecutionAdapter(
  {
    fixedLatencyMs: 100,
    maxLiquidityPctPerFill: 0.1,
    feeSchedule: {
      maker: 0.001,
      taker: 0.002
    }
  },
  marketDataService
);

initializeGovernance({
  initialMode: 'AGGRESSIVE',
  initialCapital: 10000,
  exchangeClient: simulatedAdapter,
  executionMode: 'SIMULATION', // Enable simulation mode
  enableRegimeGovernance: true,
  enableCapitalGovernance: true,
  enableObservability: true
});
```

### Initialize Governance with Real Execution

```typescript
import { initializeGovernance } from './lib/governance_instance';
import { KrakenAdapter } from './core/adapters';

const krakenAdapter = new KrakenAdapter(
  process.env.KRAKEN_API_KEY!,
  process.env.KRAKEN_API_SECRET!
);

initializeGovernance({
  initialMode: 'AGGRESSIVE',
  initialCapital: 10000,
  exchangeClient: krakenAdapter,
  executionMode: 'REAL', // Real execution (default)
  enableRegimeGovernance: true,
  enableCapitalGovernance: true,
  enableObservability: true
});
```

## Validation Checklist

✅ All simulated trades go through ExecutionManager
✅ No adapter places real orders in SIMULATION mode
✅ Capital, regime, and risk logic behave identically
✅ Partial fills occur deterministically
✅ Fees and funding affect PnL
✅ Event logs are indistinguishable from live (except metadata)
✅ Replay works on simulated days
✅ No UI or strategy changes were made
✅ No governance logic was modified

## Files Created

- `core/simulation/simulation_config.ts` - Simulation configuration
- `core/adapters/simulatedExecutionAdapter.ts` - Simulated execution adapter

## Files Modified

- `core/execution_manager.ts` - Added execution mode support
- `core/governance_integration.ts` - Added executionMode config option
- `core/observability/event_log.ts` - Added executionType to TradeExecutedEvent
- `core/observability/observability_integration.ts` - Include executionType in events
- `src/lib/governance_instance.ts` - Added executionMode config option
- `core/adapters/index.ts` - Export SimulatedExecutionAdapter

## Constraints Respected

✅ No ExecutionManager logic modified (only routing)
✅ No RiskGovernor modifications
✅ No CapitalGate or RegimeGate modifications
✅ No new strategies added
✅ No randomness added
✅ No ML added
✅ No UI added
✅ No client features added
✅ No performance optimizations

## Next Steps

Phase 8 is complete. The system now supports high-fidelity simulation with full observability parity. Simulation mode can be enabled via configuration without modifying any execution or governance logic.




