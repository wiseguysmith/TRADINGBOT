/**
 * Base Arbitrage Strategy
 * 
 * PHASE 6: Arbitrage Execution Layer
 * 
 * Base class for arbitrage strategies.
 * All arbitrage strategies must extend this class.
 */

import { ArbitrageSignal, ArbitrageType } from '../../core/arbitrage/arbitrage_types';

/**
 * Base Arbitrage Strategy
 * 
 * All arbitrage strategies must:
 * - Generate signals only
 * - Never place orders directly
 * - Declare metadata (type, allowedRegimes, poolType)
 * - Include edge, confidence, fees, slippage in signals
 */
export abstract class BaseArbitrageStrategy {
  protected strategyId: string;
  protected arbitrageType: ArbitrageType;

  constructor(strategyId: string, arbitrageType: ArbitrageType) {
    this.strategyId = strategyId;
    this.arbitrageType = arbitrageType;
  }

  /**
   * Get strategy metadata
   * 
   * Must be implemented by subclasses.
   */
  abstract getMetadata(): {
    strategyId: string;
    type: ArbitrageType;
    allowedRegimes: string[];  // Should be ['FAVORABLE']
    poolType: 'ARBITRAGE';
    riskProfile: string;
    description: string;
  };

  /**
   * Generate arbitrage signal
   * 
   * Must be implemented by subclasses.
   * Returns null if no arbitrage opportunity exists.
   */
  abstract generateSignal(
    marketData: any,
    currentPrices: Map<string, number>
  ): Promise<ArbitrageSignal | null>;

  /**
   * Check if signal is profitable after fees and slippage
   */
  protected isProfitable(
    signal: ArbitrageSignal,
    config?: { minEdgePercent?: number }
  ): boolean {
    const minEdge = config?.minEdgePercent ?? 0.1; // 0.1% default minimum
    
    const netProfit = signal.edgePercent - 
      (signal.estimatedFees / signal.legs.reduce((sum, leg) => sum + leg.size * leg.expectedPrice, 0)) * 100 -
      signal.estimatedSlippage;

    return netProfit >= minEdge && signal.confidence >= 0.5;
  }

  /**
   * Get strategy ID
   */
  getStrategyId(): string {
    return this.strategyId;
  }

  /**
   * Get arbitrage type
   */
  getArbitrageType(): ArbitrageType {
    return this.arbitrageType;
  }
}

