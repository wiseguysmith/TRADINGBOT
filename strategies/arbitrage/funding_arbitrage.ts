/**
 * Funding / Carry Arbitrage Strategy
 * 
 * PHASE 6: Arbitrage Execution Layer
 * 
 * Single-exchange funding arbitrage:
 * - Long spot + short perp (or inverse)
 * - Captures funding rate differentials
 * - No cross-exchange transfers
 * - No timing games
 */

import { BaseArbitrageStrategy } from './base_arbitrage_strategy';
import { ArbitrageSignal, ArbitrageType, ArbitrageLeg, ArbitrageLegType } from '../../core/arbitrage/arbitrage_types';

export interface FundingArbMarketData {
  spotPrice: number;
  perpPrice: number;
  fundingRate: number;              // Current funding rate (%)
  fundingRate8h: number;            // 8-hour funding rate (%)
  nextFundingTime: Date;            // Next funding payment time
  volume24h: number;
  openInterest: number;
}

/**
 * Funding / Carry Arbitrage Strategy
 * 
 * Detects funding rate arbitrage opportunities on a single exchange.
 */
export class FundingArbitrageStrategy extends BaseArbitrageStrategy {
  private exchange: string;
  private symbol: string;           // Base symbol (e.g., 'BTC')

  constructor(exchange: string = 'kraken', symbol: string = 'BTC') {
    super(`funding_arb_${exchange}_${symbol}`, ArbitrageType.FUNDING_ARB);
    this.exchange = exchange;
    this.symbol = symbol;
  }

  getMetadata() {
    return {
      strategyId: this.strategyId,
      type: ArbitrageType.FUNDING_ARB,
      allowedRegimes: ['FAVORABLE'],  // Only trade in favorable regimes
      poolType: 'ARBITRAGE' as const,
      riskProfile: 'LOW',
      description: `Single-exchange funding arbitrage for ${this.symbol} on ${this.exchange}`
    };
  }

  async generateSignal(
    marketData: FundingArbMarketData,
    currentPrices: Map<string, number>
  ): Promise<ArbitrageSignal | null> {
    // Check if funding rate is favorable
    const fundingRate = marketData.fundingRate;
    const fundingRate8h = marketData.fundingRate8h;

    // Funding arbitrage opportunity exists when:
    // 1. Funding rate is positive (longs pay shorts) → short perp, long spot
    // 2. Funding rate is negative (shorts pay longs) → long perp, short spot
    // 3. Rate is significant enough to cover fees

    const minFundingRate = 0.01; // 0.01% minimum funding rate
    const edgePercent = Math.abs(fundingRate) * 100; // Convert to percentage

    if (Math.abs(fundingRate) < minFundingRate) {
      return null; // Funding rate too small
    }

    // Calculate expected profit
    // Assuming 8-hour funding period, annualized rate
    const annualizedRate = fundingRate * 365 * 3; // 3 funding periods per day
    const edgeSize = Math.abs(fundingRate) * marketData.spotPrice; // Simplified

    // Estimate fees (assuming 0.1% per leg)
    const estimatedFees = marketData.spotPrice * 0.001 * 2; // 2 legs

    // Estimate slippage (conservative)
    const estimatedSlippage = marketData.spotPrice * 0.0005; // 0.05% slippage

    // Calculate confidence based on:
    // - Funding rate magnitude
    // - Rate stability (8h vs current)
    // - Volume and open interest
    const rateStability = 1 - Math.abs(fundingRate - fundingRate8h) / Math.max(Math.abs(fundingRate), 0.001);
    const volumeScore = Math.min(marketData.volume24h / 1000000, 1); // Normalize
    const confidence = Math.min(
      (Math.abs(fundingRate) / 0.1) * 0.4 + // Rate magnitude (40%)
      rateStability * 0.3 +                  // Rate stability (30%)
      volumeScore * 0.3,                     // Volume (30%)
      1.0
    );

    // Determine legs based on funding rate sign
    const legs: ArbitrageLeg[] = [];
    
    if (fundingRate > 0) {
      // Positive funding: longs pay shorts
      // Strategy: Short perp, long spot
      legs.push({
        legId: 'leg1_spot_long',
        legType: ArbitrageLegType.SPOT_LONG,
        symbol: `${this.symbol}/USD`,
        side: 'buy',
        size: 1.0, // Will be sized by capital allocator
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
        size: 1.0, // Will be sized by capital allocator
        expectedPrice: marketData.perpPrice,
        exchange: this.exchange,
        orderType: 'limit',
        priority: 2
      });
    } else {
      // Negative funding: shorts pay longs
      // Strategy: Long perp, short spot
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
      arbitrageType: ArbitrageType.FUNDING_ARB,
      symbol: this.symbol,
      edgeSize,
      edgePercent,
      confidence,
      estimatedFees,
      estimatedSlippage,
      minimumProfitabilityThreshold: 0.1, // 0.1% minimum
      legs,
      timestamp: new Date()
    };

    // Check if profitable
    if (!this.isProfitable(signal)) {
      return null;
    }

    return signal;
  }
}

