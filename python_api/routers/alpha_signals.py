"""
Alpha Signals Router
API endpoints for quant module signals
"""

import asyncio
import logging
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any
from datetime import datetime

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.speed_service import SpeedService
from services.alt_data_service import AltDataService
from services.microstructure_service import MicrostructureService
from services.options_flow_service import OptionsFlowService
from services.volatility_service import VolatilityService
from utils.response_models import AlphaSignalResponse, CombinedSignalResponse, ComponentSignal
from utils.error_handler import handle_exception
from config.settings import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/alpha", tags=["alpha"])

# Initialize services
speed_service = SpeedService()
alt_data_service = AltDataService()
microstructure_service = MicrostructureService()
options_flow_service = OptionsFlowService()
volatility_service = VolatilityService()

@router.get("/speed/{symbol}", response_model=AlphaSignalResponse)
async def get_speed_signal(symbol: str):
    """
    Get speed edge signal (volatility detection)
    
    Args:
        symbol: Trading pair symbol (e.g., BTCUSDT or BTC/USDT)
    """
    try:
        logger.info(f"GET /alpha/speed/{symbol}")
        
        # Normalize symbol format
        normalized_symbol = symbol.replace('/', '/')
        
        result = await speed_service.get_signal(normalized_symbol)
        return AlphaSignalResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in speed endpoint: {e}", exc_info=True)
        raise handle_exception(e, "speed_service")

@router.get("/alt-data/{symbol}", response_model=AlphaSignalResponse)
async def get_alt_data_signal(symbol: str):
    """
    Get alternative data signal (Google Trends, GitHub, sentiment)
    
    Args:
        symbol: Trading pair symbol (e.g., BTCUSDT or BTC/USDT)
    """
    try:
        logger.info(f"GET /alpha/alt-data/{symbol}")
        
        # Normalize symbol format
        normalized_symbol = symbol.replace('/', '/')
        
        result = await alt_data_service.get_signal(normalized_symbol)
        return AlphaSignalResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in alt-data endpoint: {e}", exc_info=True)
        raise handle_exception(e, "alt_data_service")

@router.get("/microstructure/{symbol}", response_model=AlphaSignalResponse)
async def get_microstructure_signal(symbol: str):
    """
    Get microstructure signal (order book analysis, CVD)
    
    Args:
        symbol: Trading pair symbol (e.g., BTCUSDT or BTC/USDT)
    """
    try:
        logger.info(f"GET /alpha/microstructure/{symbol}")
        
        # Normalize symbol format
        normalized_symbol = symbol.replace('/', '/')
        
        result = await microstructure_service.get_signal(normalized_symbol)
        return AlphaSignalResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in microstructure endpoint: {e}", exc_info=True)
        raise handle_exception(e, "microstructure_service")

@router.get("/options-flow/{symbol}", response_model=AlphaSignalResponse)
async def get_options_flow_signal(symbol: str):
    """
    Get options flow signal (open interest, funding rates, liquidations)
    
    Args:
        symbol: Trading pair symbol (e.g., BTCUSDT or BTC/USDT)
    """
    try:
        logger.info(f"GET /alpha/options-flow/{symbol}")
        
        # Normalize symbol format
        normalized_symbol = symbol.replace('/', '/')
        
        result = await options_flow_service.get_signal(normalized_symbol)
        return AlphaSignalResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in options-flow endpoint: {e}", exc_info=True)
        raise handle_exception(e, "options_flow_service")

@router.get("/volatility/{symbol}", response_model=AlphaSignalResponse)
async def get_volatility_signal(
    symbol: str,
    volatility_history: Optional[float] = Query(None, description="Historical volatility"),
    cvd: Optional[float] = Query(None, description="Cumulative Volume Delta"),
    orderbook_imbalance: Optional[float] = Query(None, description="Order book imbalance"),
    funding_rate: Optional[float] = Query(None, description="Funding rate"),
    sentiment: Optional[float] = Query(None, description="Sentiment score"),
    google_trends: Optional[float] = Query(None, description="Google Trends score"),
    oi_change: Optional[float] = Query(None, description="Open Interest change")
):
    """
    Get volatility prediction signal (ML-based)
    
    Args:
        symbol: Trading pair symbol (e.g., BTCUSDT or BTC/USDT)
        volatility_history: Optional historical volatility
        cvd: Optional Cumulative Volume Delta
        orderbook_imbalance: Optional order book imbalance
        funding_rate: Optional funding rate
        sentiment: Optional sentiment score
        google_trends: Optional Google Trends score
        oi_change: Optional Open Interest change
    """
    try:
        logger.info(f"GET /alpha/volatility/{symbol}")
        
        # Normalize symbol format
        normalized_symbol = symbol.replace('/', '/')
        
        # Build feature dictionary if any features provided
        feature_dict = None
        if any([volatility_history, cvd, orderbook_imbalance, funding_rate, sentiment, google_trends, oi_change]):
            feature_dict = {
                'volatility_history': volatility_history or 0.0,
                'cvd': cvd or 0.0,
                'orderbook_imbalance': orderbook_imbalance or 0.0,
                'funding_rate': funding_rate or 0.0,
                'sentiment': sentiment or 0.0,
                'google_trends': google_trends or 0.0,
                'oi_change': oi_change or 0.0
            }
        
        result = await volatility_service.get_signal(normalized_symbol, feature_dict)
        return AlphaSignalResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in volatility endpoint: {e}", exc_info=True)
        raise handle_exception(e, "volatility_service")

@router.get("/combined/{symbol}", response_model=CombinedSignalResponse)
async def get_combined_signal(symbol: str):
    """
    Get combined signal from all alpha modules
    
    Calls all modules asynchronously and combines signals with weights:
    - Speed: 25%
    - Alt Data: 20%
    - Microstructure: 25%
    - Options Flow: 15%
    - Volatility: 15%
    
    Args:
        symbol: Trading pair symbol (e.g., BTCUSDT or BTC/USDT)
    """
    try:
        logger.info(f"GET /alpha/combined/{symbol}")
        
        # Normalize symbol format
        normalized_symbol = symbol.replace('/', '/')
        
        # Get weights from settings
        weights = settings.module_weights
        
        # Call all modules asynchronously
        results = await asyncio.gather(
            speed_service.get_signal(normalized_symbol),
            alt_data_service.get_signal(normalized_symbol),
            microstructure_service.get_signal(normalized_symbol),
            options_flow_service.get_signal(normalized_symbol),
            volatility_service.get_signal(normalized_symbol),
            return_exceptions=True
        )
        
        # Extract signals and handle errors
        speed_result = results[0]
        alt_data_result = results[1]
        microstructure_result = results[2]
        options_flow_result = results[3]
        volatility_result = results[4]
        
        # Check for errors
        errors = []
        if isinstance(speed_result, Exception):
            errors.append(f"Speed: {str(speed_result)}")
            speed_signal = 0.0
        else:
            speed_signal = speed_result.get("signal", 0.0)
        
        if isinstance(alt_data_result, Exception):
            errors.append(f"Alt Data: {str(alt_data_result)}")
            alt_data_signal = 0.0
        else:
            alt_data_signal = alt_data_result.get("signal", 0.0)
        
        if isinstance(microstructure_result, Exception):
            errors.append(f"Microstructure: {str(microstructure_result)}")
            microstructure_signal = 0.0
        else:
            microstructure_signal = microstructure_result.get("signal", 0.0)
        
        if isinstance(options_flow_result, Exception):
            errors.append(f"Options Flow: {str(options_flow_result)}")
            options_flow_signal = 0.0
        else:
            options_flow_signal = options_flow_result.get("signal", 0.0)
        
        if isinstance(volatility_result, Exception):
            errors.append(f"Volatility: {str(volatility_result)}")
            volatility_signal = 0.5  # Default to neutral (0.5) for volatility
        else:
            volatility_signal = volatility_result.get("signal", 0.5)
        
        # Convert volatility signal from [0, 1] to [-1, 1] for combination
        # Volatility of 0.5 (neutral) becomes 0, 1.0 becomes +1, 0.0 becomes -1
        volatility_normalized = (volatility_signal - 0.5) * 2
        
        # Combine signals with weights
        combined_signal = (
            weights["speed"] * speed_signal +
            weights["alt_data"] * alt_data_signal +
            weights["microstructure"] * microstructure_signal +
            weights["options_flow"] * options_flow_signal +
            weights["volatility"] * volatility_normalized
        )
        
        # Build component signals
        components = {}
        if not isinstance(speed_result, Exception):
            components["speed"] = ComponentSignal(
                value=speed_signal,
                timestamp=speed_result.get("timestamp", datetime.utcnow().isoformat() + "Z"),
                source="fast_market_listener"
            )
        
        if not isinstance(alt_data_result, Exception):
            components["alt_data"] = ComponentSignal(
                value=alt_data_signal,
                timestamp=alt_data_result.get("timestamp", datetime.utcnow().isoformat() + "Z"),
                source="alt_data_engine"
            )
        
        if not isinstance(microstructure_result, Exception):
            components["microstructure"] = ComponentSignal(
                value=microstructure_signal,
                timestamp=microstructure_result.get("timestamp", datetime.utcnow().isoformat() + "Z"),
                source="microstructure_model"
            )
        
        if not isinstance(options_flow_result, Exception):
            components["options_flow"] = ComponentSignal(
                value=options_flow_signal,
                timestamp=options_flow_result.get("timestamp", datetime.utcnow().isoformat() + "Z"),
                source="options_flow_engine"
            )
        
        if not isinstance(volatility_result, Exception):
            components["volatility"] = ComponentSignal(
                value=volatility_signal,
                timestamp=volatility_result.get("timestamp", datetime.utcnow().isoformat() + "Z"),
                source="ai_volatility_predictor"
            )
        
        # Build response
        response = CombinedSignalResponse(
            symbol=normalized_symbol.replace('/', '').upper(),
            timestamp=datetime.utcnow().isoformat() + "Z",
            signal=float(combined_signal),
            components=components,
            weights=weights,
            metadata={
                "errors": errors if errors else None,
                "module_count": len([r for r in results if not isinstance(r, Exception)])
            }
        )
        
        logger.info(f"Combined signal for {symbol}: {combined_signal:.3f}")
        return response
        
    except Exception as e:
        logger.error(f"Error in combined endpoint: {e}", exc_info=True)
        raise handle_exception(e, "combined_signal")

