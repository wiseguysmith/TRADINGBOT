"""
Signals Router
POST endpoint for unified quant signal generation with candle data
"""

import asyncio
import logging
from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.speed_service import SpeedService
from services.alt_data_service import AltDataService
from services.microstructure_service import MicrostructureService
from services.options_flow_service import OptionsFlowService
from services.volatility_service import VolatilityService
from utils.error_handler import handle_exception
from config.settings import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["signals"])

# Initialize services
speed_service = SpeedService()
alt_data_service = AltDataService()
microstructure_service = MicrostructureService()
options_flow_service = OptionsFlowService()
volatility_service = VolatilityService()


class CandleData(BaseModel):
    """Candle data model"""
    timestamp: int
    open: float
    high: float
    low: float
    close: float
    volume: float


class QuantSignalsRequest(BaseModel):
    """Request model for quant signals"""
    symbol: str
    candles: Optional[List[CandleData]] = None
    timestamp: int


class QuantSignalsResponse(BaseModel):
    """Response model for quant signals"""
    signals: Dict[str, float]
    latency_ms: int
    timestamp: str


@router.post("/signals", response_model=QuantSignalsResponse)
async def get_quant_signals(request: QuantSignalsRequest):
    """
    Get all quant signals for a symbol
    
    Accepts candle data for enhanced volatility prediction.
    Returns structured signals from all quant modules.
    
    Args:
        request: QuantSignalsRequest with symbol, optional candles, and timestamp
    """
    try:
        start_time = datetime.utcnow()
        logger.info(f"POST /signals - Symbol: {request.symbol}, Candles: {len(request.candles) if request.candles else 0}")
        
        # Normalize symbol format
        normalized_symbol = request.symbol.replace('/', '').upper()
        
        # Prepare feature dict for volatility if candles provided
        feature_dict = None
        if request.candles and len(request.candles) > 0:
            # Calculate features from candles for volatility predictor
            closes = [c.close for c in request.candles]
            highs = [c.high for c in request.candles]
            lows = [c.low for c in request.candles]
            volumes = [c.volume for c in request.candles]
            
            # Calculate volatility (simplified - could use ATR or std dev)
            if len(closes) > 1:
                returns = [(closes[i] - closes[i-1]) / closes[i-1] for i in range(1, len(closes))]
                volatility_history = sum(abs(r) for r in returns) / len(returns) if returns else 0.0
            else:
                volatility_history = 0.0
            
            # Calculate order book imbalance (simplified from price action)
            if len(closes) > 0:
                price_change = (closes[-1] - closes[0]) / closes[0] if closes[0] > 0 else 0.0
                orderbook_imbalance = price_change  # Simplified proxy
            else:
                orderbook_imbalance = 0.0
            
            # Build feature dictionary
            feature_dict = {
                'volatility_history': volatility_history,
                'cvd': sum(volumes[-10:]) if len(volumes) >= 10 else sum(volumes),  # Cumulative volume
                'orderbook_imbalance': orderbook_imbalance,
                'funding_rate': 0.0,  # Would need to fetch from exchange
                'sentiment': 0.0,  # Would need sentiment data
                'google_trends': 0.0,  # Would need Google Trends data
                'oi_change': 0.0  # Would need OI data
            }
        
        # Call all modules asynchronously
        results = await asyncio.gather(
            speed_service.get_signal(normalized_symbol),
            alt_data_service.get_signal(normalized_symbol),
            microstructure_service.get_signal(normalized_symbol),
            options_flow_service.get_signal(normalized_symbol),
            volatility_service.get_signal(normalized_symbol, feature_dict),
            return_exceptions=True
        )
        
        # Extract signals and handle errors
        speed_result = results[0]
        alt_data_result = results[1]
        microstructure_result = results[2]
        options_flow_result = results[3]
        volatility_result = results[4]
        
        # Extract signal values (default to 0 on error)
        speed_signal = speed_result.get("signal", 0.0) if not isinstance(speed_result, Exception) else 0.0
        alt_data_signal = alt_data_result.get("signal", 0.0) if not isinstance(alt_data_result, Exception) else 0.0
        microstructure_signal = microstructure_result.get("signal", 0.0) if not isinstance(microstructure_result, Exception) else 0.0
        options_flow_signal = options_flow_result.get("signal", 0.0) if not isinstance(options_flow_result, Exception) else 0.0
        
        # Volatility signal is [0, 1], keep as is (will be normalized in TypeScript)
        volatility_signal = volatility_result.get("signal", 0.5) if not isinstance(volatility_result, Exception) else 0.5
        
        # Calculate combined signal using weights
        weights = settings.module_weights
        volatility_normalized = (volatility_signal - 0.5) * 2  # Convert [0,1] to [-1,1]
        
        combined_signal = (
            weights["speed"] * speed_signal +
            weights["alt_data"] * alt_data_signal +
            weights["microstructure"] * microstructure_signal +
            weights["options_flow"] * options_flow_signal +
            weights["volatility"] * volatility_normalized
        )
        
        # Calculate latency
        latency_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        # Build response
        response = QuantSignalsResponse(
            signals={
                "speed": speed_signal,
                "microstructure": microstructure_signal,
                "oi": options_flow_signal,  # Using options_flow as OI proxy
                "options": options_flow_signal,
                "sentiment": alt_data_signal,  # Using alt_data as sentiment proxy
                "volatility": volatility_signal,
                "combined": combined_signal
            },
            latency_ms=latency_ms,
            timestamp=datetime.utcnow().isoformat() + "Z"
        )
        
        logger.info(f"Quant signals for {normalized_symbol}: combined={combined_signal:.3f}, latency={latency_ms}ms")
        return response
        
    except Exception as e:
        logger.error(f"Error in /signals endpoint: {e}", exc_info=True)
        raise handle_exception(e, "quant_signals")

