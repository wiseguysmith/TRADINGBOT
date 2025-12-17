"""
Speed Edge Service
Wraps fast_market_listener module for API access
"""

import sys
import asyncio
import logging
from pathlib import Path
from typing import Dict, Any
from datetime import datetime

# Add parent directory to path to import modules
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from modules.fast_market_listener import get_signal as get_speed_signal
from config.settings import settings

logger = logging.getLogger(__name__)

class SpeedService:
    """Service for speed edge signals"""
    
    def __init__(self):
        self.module_name = "fast_market_listener"
        self.exchange = settings.DEFAULT_EXCHANGE
    
    async def get_signal(self, symbol: str) -> Dict[str, Any]:
        """
        Get speed edge signal
        
        Args:
            symbol: Trading pair symbol (e.g., "BTC/USDT")
            
        Returns:
            Dictionary with signal data
        """
        try:
            logger.info(f"Getting speed signal for {symbol}")
            
            # Call the module's async get_signal function with exchange parameter
            signal_value = await get_speed_signal(symbol, self.exchange)
            
            # Normalize symbol format
            normalized_symbol = symbol.replace('/', '').upper()
            
            result = {
                "symbol": normalized_symbol,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "signal": float(signal_value),
                "components": {
                    "speed": float(signal_value)
                },
                "metadata": {
                    "module": self.module_name,
                    "exchange": self.exchange,
                    "signal_range": "[-1, 1]"
                }
            }
            
            logger.info(f"Speed signal for {symbol}: {signal_value:.3f}")
            return result
            
        except Exception as e:
            logger.error(f"Error getting speed signal for {symbol}: {e}", exc_info=True)
            raise

