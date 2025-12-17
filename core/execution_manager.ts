/**
 * Execution Manager
 * 
 * Centralized trade execution authority.
 * All trade execution must flow through this manager.
 * 
 * PHASE 1: Governance & Survival
 * This manager ensures no trade executes without passing the permission gate.
 */

import { PermissionGate, PermissionResult } from './permission_gate';
import { TradeRequest, TradeResult } from '../src/services/riskGovernor';
import { ModeController } from './mode_controller';
import { RiskGovernor } from '../src/services/riskGovernor';
import { ExchangeAdapter } from './adapters';

export interface ExecutionConfig {
  modeController: ModeController;
  riskGovernor: RiskGovernor;
  permissionGate: PermissionGate;
  exchangeClient?: ExchangeAdapter; // PHASE 1: Exchange adapter (from core/adapters only)
}

/**
 * Execution Manager
 * 
 * Single point of execution that enforces governance.
 * All execution paths must call this manager.
 */
export class ExecutionManager {
  private modeController: ModeController;
  private riskGovernor: RiskGovernor;
  private permissionGate: PermissionGate;
  private exchangeClient?: any;
  private executionHistory: Array<{ request: TradeRequest; result: PermissionResult | TradeResult; timestamp: Date }> = [];

  constructor(config: ExecutionConfig) {
    this.modeController = config.modeController;
    this.riskGovernor = config.riskGovernor;
    this.permissionGate = config.permissionGate;
    this.exchangeClient = config.exchangeClient;
  }

  /**
   * Execute a trade request
   * 
   * This is the ONLY way trades should be executed.
   * 
   * Flow:
   * 1. Check permission gate (MANDATORY - cannot be bypassed)
   * 2. If approved, execute trade
   * 3. Record execution result in Risk Governor (MANDATORY)
   * 4. Return result
   * 
   * @param request Trade request to execute
   * @returns Trade result
   */
  async executeTrade(request: TradeRequest): Promise<TradeResult> {
    const timestamp = new Date();

    // Step 1: Check permission gate (MANDATORY - NO BYPASS ALLOWED)
    const permission = this.permissionGate.checkPermission(request);
    
    if (!permission.allowed) {
      // Permission denied - log and return failure
      // CRITICAL: Execution MUST NOT proceed if permission is denied
      const result: TradeResult = {
        success: false,
        pair: request.pair,
        strategy: request.strategy,
        timestamp,
        pnl: 0
      };

      this.executionHistory.push({ request, result: permission, timestamp });
      
      console.warn(`[EXECUTION_MANAGER] Trade execution denied: ${permission.reason} (source: ${permission.source})`);
      
      // CRITICAL FAIL-SAFE: Double-check mode and risk state
      if (this.modeController.getMode() === 'OBSERVE_ONLY') {
        console.error(`[EXECUTION_MANAGER] 🚨 CRITICAL: Attempted trade execution in OBSERVE_ONLY mode - BLOCKED`);
      }
      if (this.riskGovernor.getRiskState() === 'SHUTDOWN') {
        console.error(`[EXECUTION_MANAGER] 🚨 CRITICAL: Attempted trade execution in SHUTDOWN state - BLOCKED`);
      }
      
      return result;
    }

    // Step 2: Execute trade (if we have an exchange client)
    let executionResult: TradeResult;
    
    if (this.exchangeClient) {
      // Real execution through exchange client
      try {
        executionResult = await this.executeOnExchange(request);
      } catch (error: any) {
        executionResult = {
          success: false,
          pair: request.pair,
          strategy: request.strategy,
          timestamp,
          pnl: 0
        };
        console.error(`[EXECUTION_MANAGER] Exchange execution failed:`, error);
      }
    } else {
      // Simulated execution (for testing/development)
      executionResult = this.simulateExecution(request);
    }

    // Step 3: Record execution in Risk Governor (MANDATORY)
    // This updates risk metrics and may trigger state transitions
    this.riskGovernor.recordTradeExecution(executionResult);

    // Step 4: Log execution
    this.executionHistory.push({ request, result: executionResult, timestamp });

    return executionResult;
  }

  /**
   * Execute trade on exchange
   * 
   * This method handles the actual exchange API calls.
   * Exchange-specific logic goes here.
   */
  private async executeOnExchange(request: TradeRequest): Promise<TradeResult> {
    if (!this.exchangeClient) {
      throw new Error('Exchange client not configured');
    }

    // Build order parameters
    const orderParams = {
      pair: request.pair,
      type: request.action,
      volume: request.amount.toString(),
      price: request.price.toString()
    };

    // Execute order
    let orderResult;
    if (request.action === 'buy') {
      orderResult = await this.exchangeClient.placeBuyOrder(
        request.pair,
        request.amount,
        request.price
      );
    } else {
      orderResult = await this.exchangeClient.placeSellOrder(
        request.pair,
        request.amount,
        request.price
      );
    }

    // Convert exchange result to TradeResult
    const result: TradeResult = {
      success: orderResult.success || false,
      pair: request.pair,
      strategy: request.strategy,
      timestamp: new Date(),
      executedValue: request.estimatedValue,
      pnl: 0, // Will be updated when position is closed
      orderId: orderResult.orderId,
      executionPrice: orderResult.price || request.price,
      quantity: orderResult.quantity || request.amount
    };

    return result;
  }

  /**
   * Simulate trade execution (for testing/development)
   * 
   * In OBSERVE_ONLY mode, this simulates execution without deploying capital.
   * IMPORTANT: OBSERVE_ONLY mode should NEVER reach here because permission gate blocks it.
   * This is a fail-safe in case permission gate is bypassed.
   */
  private simulateExecution(request: TradeRequest): TradeResult {
    const mode = this.modeController.getMode();
    
    if (mode === 'OBSERVE_ONLY') {
      // CRITICAL: OBSERVE_ONLY mode should never execute trades
      // This is a fail-safe - if we reach here, permission gate was bypassed
      console.error(`[EXECUTION_MANAGER] ⚠️ CRITICAL: Attempted execution in OBSERVE_ONLY mode - this should be blocked by permission gate!`);
      return {
        success: false,
        pair: request.pair,
        strategy: request.strategy,
        timestamp: new Date(),
        executedValue: 0,
        pnl: 0
      };
    }

    // Simulate execution result (only for AGGRESSIVE mode when no exchange client)
    const result: TradeResult = {
      success: true,
      pair: request.pair,
      strategy: request.strategy,
      timestamp: new Date(),
      executedValue: request.estimatedValue,
      pnl: 0 // Simulated trades have zero PnL initially
    };

    return result;
  }

  /**
   * Get execution history (for auditing)
   */
  getExecutionHistory(): ReadonlyArray<{ request: TradeRequest; result: PermissionResult | TradeResult; timestamp: Date }> {
    return [...this.executionHistory];
  }

  /**
   * Check if execution is currently allowed
   * 
   * Fast check for strategies to determine if they should generate signals.
   */
  isExecutionAllowed(): boolean {
    return this.permissionGate.isTradingAllowed();
  }
}

