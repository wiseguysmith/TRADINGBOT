/**
 * Basis / Instrument Arbitrage Strategy
 * 
 * PHASE 6: Arbitrage Execution Layer
 * 
 * Same-asset instrument arbitrage:
 * - Spot vs perp mispricing
 * - Basis compression / expansion
 * - No cross-asset stat arb
 */

import { BaseArbitrageStrategy } from './base_arbitrage_strategy';
import { ArbitrageSignal, ArbitrageType, ArbitrageLeg, ArbitrageLegType } from '../../core/arbitrage/arbitrage_types';

export interface BasisArbMarketData {
  spotPrice: number;
  perpPrice: number;
  basis: number;                    // Basis = perpPrice - spotPrice
  basisPercent: number;             // Basis as % of spot
  historicalBasisMean: number;     // Historical mean basis
  historicalBasisStd: number;       // Historical std dev of basis
  volume24h: number;
  openInterest: number;
}

/**
 * Basis / Instrument Arbitrage Strategy
 * 
 * Detects basis arbitrage opportunities (spot vs perp mispricing).
 */
export class BasisArbitrageStrategy extends BaseArbitrageStrategy {
  private exchange: string;
  private symbol: string;

  constructor(exchange: string = 'kraken', symbol: string = 'BTC') {
    super(`basis_arb_${exchange}_${symbol}`, ArbitrageType.BASIS_ARB);
    this.exchange = exchange;
    this.symbol = symbol;
  }

  getMetadata() {
    return {
      strategyId: this.strategyId,
      type: ArbitrageType.BASIS_ARB,
      allowedRegimes: ['FAVORABLE'],  // Only trade in favorable regimes
      poolType: 'ARBITRAGE' as const,
      riskProfile: 'LOW',
      description: `Basis arbitrage for ${this.symbol} on ${this.exchange}`
    };
  }

  async generateSignal(
    marketData: BasisArbMarketData,
    currentPrices: Map<string, number>
  ): Promise<ArbitrageSignal | null> {
    const { basis, basisPercent, historicalBasisMean, historicalBasisStd } = marketData;

    // Basis arbitrage opportunity exists when:
    // 1. Basis deviates significantly from historical mean
    // 2. Basis is expected to revert to mean
    // 3. Deviation is large enough to cover fees

    const minBasisDeviation = 2 * historicalBasisStd; // 2 standard deviations
    const basisDeviation = Math.abs(basisPercent - historicalBasisMean);

    if (basisDeviation < minBasisDeviation) {
      return null; // Basis deviation too small
    }

    // Calculate expected profit (basis compression)
    const expectedCompression = basisDeviation * 0.5; // Assume 50% reversion
    const edgePercent = expectedCompression;
    const edgeSize = Math.abs(basis) * 0.5; // Simplified

    // Estimate fees
    const estimatedFees = marketData.spotPrice * 0.001 * 2; // 2 legs

    // Estimate slippage
    const estimatedSlippage = marketData.spotPrice * 0.0005; // 0.05%

    // Calculate confidence based on:
    // - Basis deviation magnitude
    // - Historical volatility
    // - Volume
    const deviationScore = Math.min(basisDeviation / (historicalBasisStd * 3), 1);
    const volumeScore = Math.min(marketData.volume24h / 1000000, 1);
    const confidence = Math.min(
      deviationScore * 0.5 +      // Deviation magnitude (50%)
      volumeScore * 0.3 +          // Volume (30%)
      (1 - Math.min(historicalBasisStd / 0.01, 1)) * 0.2, // Low volatility (20%)
      1.0
    );

    // Determine legs based on basis sign
    const legs: ArbitrageLeg[] = [];
    
    if (basis > 0) {
      // Positive basis: perp > spot
      // Strategy: Short perp, long spot (expect basis to compress)
      legs.push({
        legId: 'leg1_spot_long',
        legType: ArbitrageLegType.SPOT_LONG,
        symbol: `${this.symbol}/USD`,
        side: 'buy',
        size: 1.0,
        expectedPrice: marketData.spotPrice,
        exchange: this.exchange,
        orderType: 'limit',
        priority: 1
      });
      
      legs.push({
        legId: 'leg2_perp_short',
        legType: ArbitrageLegType.PERP_SHORT,
        symbol: `${this.symbol}-PERP`,
        side: 'sell',
        size: 1.0,
        expectedPrice: marketData.perpPrice,
        exchange: this.exchange,
        orderType: 'limit',
        priority: 2
      });
    } else {
      // Negative basis: spot > perp
      // Strategy: Long perp, short spot (expect basis to compress)
      legs.push({
        legId: 'leg1_perp_long',
        legType: ArbitrageLegType.PERP_LONG,
        symbol: `${this.symbol}-PERP`,
        side: 'buy',
        size: 1.0,
        expectedPrice: marketData.perpPrice,
        exchange: this.exchange,
        orderType: 'limit',
        priority: 1
      });
      
      legs.push({
        legId: 'leg2_spot_short',
        legType: ArbitrageLegType.SPOT_SHORT,
        symbol: `${this.symbol}/USD`,
        side: 'sell',
        size: 1.0,
        expectedPrice: marketData.spotPrice,
        exchange: this.exchange,
        orderType: 'limit',
        priority: 2
      });
    }

    const signal: ArbitrageSignal = {
      strategyId: this.strategyId,
      arbitrageType: ArbitrageType.BASIS_ARB,
      symbol: this.symbol,
      edgeSize,
      edgePercent,
      confidence,
      estimatedFees,
      estimatedSlippage,
      minimumProfitabilityThreshold: 0.15, // 0.15% minimum for basis arb
      legs,
      timestamp: new Date()
    };

    // Check if profitable
    if (!this.isProfitable(signal, { minEdgePercent: 0.15 })) {
      return null;
    }

    return signal;
  }
}

