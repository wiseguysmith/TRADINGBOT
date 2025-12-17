"""
Microstructure Service
Wraps microstructure_model module for API access
"""

import sys
import logging
from pathlib import Path
from typing import Dict, Any
from datetime import datetime

# Add parent directory to path to import modules
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from modules.microstructure_model import MicrostructureModel
from config.settings import settings

logger = logging.getLogger(__name__)

class MicrostructureService:
    """Service for microstructure signals"""
    
    def __init__(self):
        self.module_name = "microstructure_model"
        self.exchange = settings.DEFAULT_EXCHANGE
        self.model = MicrostructureModel(self.exchange)
    
    async def get_signal(self, symbol: str) -> Dict[str, Any]:
        """
        Get microstructure signal
        
        Args:
            symbol: Trading pair symbol (e.g., "BTC/USDT")
            
        Returns:
            Dictionary with signal data
        """
        try:
            logger.info(f"Getting microstructure signal for {symbol}")
            
            # Call the model's async get_signal method
            signal_value = await self.model.get_signal(symbol)
            
            # Normalize symbol format
            normalized_symbol = symbol.replace('/', '').upper()
            
            result = {
                "symbol": normalized_symbol,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "signal": float(signal_value),
                "components": {
                    "microstructure": float(signal_value)
                },
                "metadata": {
                    "module": self.module_name,
                    "exchange": self.exchange,
                    "signal_range": "[-1, 1]"
                }
            }
            
            logger.info(f"Microstructure signal for {symbol}: {signal_value:.3f}")
            return result
            
        except Exception as e:
            logger.error(f"Error getting microstructure signal for {symbol}: {e}", exc_info=True)
            raise

