/**
 * Governance Integration
 * 
 * Adapter layer to integrate Phase 1 governance into existing trading engines.
 * 
 * PHASE 1: Governance & Survival
 * PHASE 2: Regime-Aware Strategy Governance
 * PHASE 3: Capital Intelligence & Governance
 * 
 * This module provides integration helpers for existing code.
 */

import { ModeController, SystemMode } from './mode_controller';
import { RiskGovernor, RiskState } from '../src/services/riskGovernor';
import { PermissionGate } from './permission_gate';
import { ExecutionManager } from './execution_manager';
import { TradeRequest, TradeResult } from '../src/services/riskGovernor';
import { RegimeDetector, MarketRegime } from './regime_detector';
import { StrategyMetadataRegistry, registerDefaultStrategies } from './strategy_metadata';
import { RegimeGate } from './regime_gate';
import { CapitalPool, CapitalPoolType } from './capital/capital_pool';
import { StrategyCapitalAccountManager } from './capital/strategy_capital_account';
import { CapitalAllocator } from './capital/capital_allocator';
import { CapitalGate } from './capital/capital_gate';

/**
 * Governance System
 * 
 * Centralized governance infrastructure.
 * Initialize this once and use throughout the application.
 * 
 * PHASE 1: Governance & Survival
 * PHASE 2: Regime-Aware Strategy Governance
 * PHASE 3: Capital Intelligence & Governance
 */
export class GovernanceSystem {
  public readonly modeController: ModeController;
  public readonly riskGovernor: RiskGovernor;
  public readonly permissionGate: PermissionGate;
  public readonly executionManager: ExecutionManager;
  
  // PHASE 2: Regime-aware governance
  public readonly regimeDetector: RegimeDetector | null;
  public readonly strategyRegistry: StrategyMetadataRegistry | null;
  public readonly regimeGate: RegimeGate | null;
  
  // PHASE 3: Capital intelligence
  public readonly directionalPool: CapitalPool | null;
  public readonly arbitragePool: CapitalPool | null;
  public readonly accountManager: StrategyCapitalAccountManager | null;
  public readonly capitalAllocator: CapitalAllocator | null;
  public readonly capitalGate: CapitalGate | null;

  constructor(config?: {
    initialMode?: SystemMode;
    initialCapital?: number;
    exchangeClient?: any;
    enableRegimeGovernance?: boolean; // PHASE 2: Enable regime checks
    enableCapitalGovernance?: boolean; // PHASE 3: Enable capital checks
    directionalCapital?: number; // PHASE 3: Initial directional pool capital
    arbitrageCapital?: number; // PHASE 3: Initial arbitrage pool capital
  }) {
    // Initialize Mode Controller
    this.modeController = new ModeController(config?.initialMode || 'OBSERVE_ONLY');

    // Initialize Risk Governor
    this.riskGovernor = new RiskGovernor(config?.initialCapital || 1000);

    // Initialize Permission Gate
    this.permissionGate = new PermissionGate(this.modeController, this.riskGovernor);

    // Initialize Execution Manager
    this.executionManager = new ExecutionManager({
      modeController: this.modeController,
      riskGovernor: this.riskGovernor,
      permissionGate: this.permissionGate,
      exchangeClient: config?.exchangeClient
    });

    // PHASE 2: Initialize regime-aware governance
    if (config?.enableRegimeGovernance !== false) {
      this.regimeDetector = new RegimeDetector();
      this.strategyRegistry = new StrategyMetadataRegistry();
      this.regimeGate = new RegimeGate(this.regimeDetector, this.strategyRegistry);
      
      // Register default strategies
      registerDefaultStrategies(this.strategyRegistry);
    } else {
      // Legacy mode - no regime governance
      this.regimeDetector = null;
      this.strategyRegistry = null;
      this.regimeGate = null;
    }

    // PHASE 3: Initialize capital intelligence
    if (config?.enableCapitalGovernance !== false) {
      const initialCapital = config?.initialCapital || 1000;
      const directionalCapital = config?.directionalCapital ?? (initialCapital * 0.7); // 70% directional
      const arbitrageCapital = config?.arbitrageCapital ?? (initialCapital * 0.3); // 30% arbitrage

      this.directionalPool = new CapitalPool(CapitalPoolType.DIRECTIONAL, directionalCapital);
      this.arbitragePool = new CapitalPool(CapitalPoolType.ARBITRAGE, arbitrageCapital);
      this.accountManager = new StrategyCapitalAccountManager();
      
      // Capital allocator requires strategy registry
      if (this.strategyRegistry) {
        this.capitalAllocator = new CapitalAllocator(
          this.directionalPool,
          this.arbitragePool,
          this.accountManager,
          this.strategyRegistry
        );
        this.capitalGate = new CapitalGate(this.accountManager, this.capitalAllocator);
      } else {
        // Can't have capital governance without strategy registry
        this.capitalAllocator = null;
        this.capitalGate = null;
      }
    } else {
      // Legacy mode - no capital governance
      this.directionalPool = null;
      this.arbitragePool = null;
      this.accountManager = null;
      this.capitalAllocator = null;
      this.capitalGate = null;
    }
  }

  /**
   * Check if trading is currently allowed
   * Fast check for strategies
   */
  isTradingAllowed(): boolean {
    return this.executionManager.isExecutionAllowed();
  }

  /**
   * Get current governance status
   */
  getStatus() {
    return {
      mode: this.modeController.getMode(),
      riskState: this.riskGovernor.getRiskState(),
      permissions: this.modeController.getPermissions(),
      riskMetrics: this.riskGovernor.getRiskMetrics(),
      tradingAllowed: this.isTradingAllowed(),
      // PHASE 2: Regime information
      regimeGovernanceEnabled: this.regimeGate !== null,
      // PHASE 3: Capital information
      capitalGovernanceEnabled: this.capitalGate !== null,
      directionalPool: this.directionalPool?.getMetrics(),
      arbitragePool: this.arbitragePool?.getMetrics()
    };
  }

  /**
   * PHASE 2 & 3: Execute trade with regime and capital checks
   * 
   * This method checks:
   * 1. Capital availability (PHASE 3 - BEFORE Phase 1)
   * 2. Regime eligibility (PHASE 2 - BEFORE Phase 1)
   * 3. Phase 1 governance (PermissionGate, RiskGovernor)
   * 
   * If any check fails, execution is blocked.
   */
  async executeTradeWithRegimeCheck(
    request: TradeRequest,
    symbol?: string,
    regimeResult?: any
  ): Promise<TradeResult & { 
    regimeBlocked?: boolean; 
    regimeReason?: string;
    capitalBlocked?: boolean;
    capitalReason?: string;
  }> {
    // PHASE 3: Check capital availability FIRST (before regime and Phase 1)
    if (this.capitalGate) {
      const capitalCheck = this.capitalGate.checkCapital(request.strategy, request.estimatedValue);

      if (!capitalCheck.allowed) {
        // Capital check failed - block execution
        console.warn(
          `[GOVERNANCE_SYSTEM] Trade blocked by capital gate: ${request.strategy} on ${request.pair}. ` +
          `Reason: ${capitalCheck.reason}`
        );

        return {
          success: false,
          pair: request.pair,
          strategy: request.strategy,
          timestamp: new Date(),
          pnl: 0,
          capitalBlocked: true,
          capitalReason: capitalCheck.reason
        };
      }
    }

    // PHASE 2: Check regime eligibility (before Phase 1 governance)
    if (this.regimeGate) {
      const symbolToCheck = symbol || request.pair;
      const regimeCheck = this.regimeGate.checkEligibility(request.strategy, symbolToCheck);

      if (!regimeCheck.allowed) {
        // Regime check failed - block execution
        console.warn(
          `[GOVERNANCE_SYSTEM] Trade blocked by regime gate: ${request.strategy} on ${symbolToCheck}. ` +
          `Reason: ${regimeCheck.reason}. Regime: ${regimeCheck.regime}`
        );

        return {
          success: false,
          pair: request.pair,
          strategy: request.strategy,
          timestamp: new Date(),
          pnl: 0,
          regimeBlocked: true,
          regimeReason: regimeCheck.reason
        };
      }

      // Regime check passed - update price history
      if (request.price) {
        this.regimeGate.updatePriceHistory(symbolToCheck, request.price);
      }
    }

    // Proceed to Phase 1 governance (ExecutionManager)
    return await this.executionManager.executeTrade(request);
  }

  /**
   * PHASE 2: Update price history for regime detection
   */
  updatePriceHistory(symbol: string, price: number): void {
    if (this.regimeGate) {
      this.regimeGate.updatePriceHistory(symbol, price);
    }
  }

  /**
   * PHASE 2: Get current regime for a symbol
   */
  getCurrentRegime(symbol: string) {
    if (!this.regimeGate) {
      return null;
    }
    return this.regimeGate.getCurrentRegime(symbol);
  }

  /**
   * PHASE 2: Get eligible strategies for current regime
   */
  getEligibleStrategies(symbol: string): string[] {
    if (!this.regimeGate) {
      return [];
    }
    return this.regimeGate.getEligibleStrategies(symbol);
  }
}

/**
 * Create a TradeRequest from strategy signal
 * 
 * Helper function to convert existing signal formats to TradeRequest
 */
export function createTradeRequest(params: {
  strategy: string;
  pair: string;
  action: 'buy' | 'sell';
  amount: number;
  price: number;
  stopLoss?: number;
  takeProfit?: number;
}): TradeRequest {
  return {
    strategy: params.strategy,
    pair: params.pair,
    action: params.action,
    amount: params.amount,
    price: params.price,
    estimatedValue: params.amount * params.price,
    stopLoss: params.stopLoss,
    takeProfit: params.takeProfit
  };
}

/**
 * PHASE 2 & 3: Execute trade with regime and capital checks (helper function)
 * 
 * This function can be used with ExecutionManager to add regime and capital checks.
 * It checks capital and regime eligibility BEFORE calling ExecutionManager.
 * 
 * Usage:
 *   const result = await executeTradeWithRegimeCheck(
 *     executionManager,
 *     regimeGate,
 *     capitalGate,
 *     request,
 *     symbol,
 *     regimeResult
 *   );
 */
export async function executeTradeWithRegimeCheck(
  executionManager: ExecutionManager,
  regimeGate: RegimeGate | null,
  capitalGate: CapitalGate | null,
  request: TradeRequest,
  symbol?: string,
  regimeResult?: any
): Promise<TradeResult & { 
  regimeBlocked?: boolean; 
  regimeReason?: string;
  capitalBlocked?: boolean;
  capitalReason?: string;
}> {
  // PHASE 3: Check capital availability FIRST (before regime and Phase 1)
  if (capitalGate) {
    const capitalCheck = capitalGate.checkCapital(request.strategy, request.estimatedValue);

    if (!capitalCheck.allowed) {
      // Capital check failed - block execution
      console.warn(
        `[GOVERNANCE] Trade blocked by capital gate: ${request.strategy} on ${request.pair}. ` +
        `Reason: ${capitalCheck.reason}`
      );

      return {
        success: false,
        pair: request.pair,
        strategy: request.strategy,
        timestamp: new Date(),
        pnl: 0,
        capitalBlocked: true,
        capitalReason: capitalCheck.reason
      };
    }
  }

  // PHASE 2: Check regime eligibility (before Phase 1 governance)
  if (regimeGate) {
    const symbolToCheck = symbol || request.pair;
    const regimeCheck = regimeGate.checkEligibility(request.strategy, symbolToCheck);

    if (!regimeCheck.allowed) {
      // Regime check failed - block execution
      console.warn(
        `[GOVERNANCE] Trade blocked by regime gate: ${request.strategy} on ${symbolToCheck}. ` +
        `Reason: ${regimeCheck.reason}. Regime: ${regimeCheck.regime}`
      );

      return {
        success: false,
        pair: request.pair,
        strategy: request.strategy,
        timestamp: new Date(),
        pnl: 0,
        regimeBlocked: true,
        regimeReason: regimeCheck.reason
      };
    }

    // Regime check passed - update price history
    if (request.price) {
      regimeGate.updatePriceHistory(symbolToCheck, request.price);
    }
  }

  // Proceed to Phase 1 governance (ExecutionManager)
  return await executionManager.executeTrade(request);
}

