"""
Response models for API endpoints
Standardized JSON response formats
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class ComponentSignal(BaseModel):
    """Individual component signal"""
    value: float
    timestamp: str
    source: str

class AlphaSignalResponse(BaseModel):
    """Standard alpha signal response"""
    symbol: str
    timestamp: str
    signal: float
    components: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "symbol": "BTCUSDT",
                "timestamp": "2024-12-19T14:55:00Z",
                "signal": 0.42,
                "components": {
                    "speed": 0.25,
                    "alt_data": 0.15
                },
                "metadata": {
                    "exchange": "binance",
                    "confidence": 0.75
                }
            }
        }

class CombinedSignalResponse(BaseModel):
    """Combined signal response with all components"""
    symbol: str
    timestamp: str
    signal: float
    components: Dict[str, ComponentSignal]
    weights: Dict[str, float]
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "symbol": "BTCUSDT",
                "timestamp": "2024-12-19T14:55:00Z",
                "signal": 0.35,
                "components": {
                    "speed": {
                        "value": 0.25,
                        "timestamp": "2024-12-19T14:55:00Z",
                        "source": "fast_market_listener"
                    },
                    "alt_data": {
                        "value": 0.15,
                        "timestamp": "2024-12-19T14:55:00Z",
                        "source": "alt_data_engine"
                    }
                },
                "weights": {
                    "speed": 0.25,
                    "alt_data": 0.20,
                    "microstructure": 0.25,
                    "options_flow": 0.15,
                    "volatility": 0.15
                }
            }
        }

class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    message: str
    timestamp: str
    details: Optional[Dict[str, Any]] = None

