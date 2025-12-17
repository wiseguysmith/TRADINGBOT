"""
Options Flow Service
Wraps options_flow_engine module for API access
"""

import sys
import logging
from pathlib import Path
from typing import Dict, Any
from datetime import datetime

# Add parent directory to path to import modules
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from modules.options_flow_engine import OptionsFlowEngine
from config.settings import settings

logger = logging.getLogger(__name__)

class OptionsFlowService:
    """Service for options flow signals"""
    
    def __init__(self):
        self.module_name = "options_flow_engine"
        self.exchange = settings.DEFAULT_EXCHANGE
        self.engine = OptionsFlowEngine(self.exchange)
    
    async def get_signal(self, symbol: str) -> Dict[str, Any]:
        """
        Get options flow signal
        
        Args:
            symbol: Trading pair symbol (e.g., "BTC/USDT")
            
        Returns:
            Dictionary with signal data
        """
        try:
            logger.info(f"Getting options flow signal for {symbol}")
            
            # Call the module's async get_signal function
            signal_value = await self.engine.get_signal(symbol)
            
            # Normalize symbol format
            normalized_symbol = symbol.replace('/', '').upper()
            
            result = {
                "symbol": normalized_symbol,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "signal": float(signal_value),
                "components": {
                    "options_flow": float(signal_value)
                },
                "metadata": {
                    "module": self.module_name,
                    "exchange": self.exchange,
                    "signal_range": "[-1, 1]"
                }
            }
            
            logger.info(f"Options flow signal for {symbol}: {signal_value:.3f}")
            return result
            
        except Exception as e:
            logger.error(f"Error getting options flow signal for {symbol}: {e}", exc_info=True)
            raise

