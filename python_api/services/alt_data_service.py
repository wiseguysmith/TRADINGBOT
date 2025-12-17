"""
Alternative Data Service
Wraps alt_data_engine module for API access
"""

import sys
import logging
from pathlib import Path
from typing import Dict, Any
from datetime import datetime

# Add parent directory to path to import modules
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from modules.alt_data_engine import AltDataEngine
from config.settings import settings

logger = logging.getLogger(__name__)

class AltDataService:
    """Service for alternative data signals"""
    
    def __init__(self):
        self.module_name = "alt_data_engine"
        self.engine = AltDataEngine()
    
    async def get_signal(self, symbol: str) -> Dict[str, Any]:
        """
        Get alternative data signal
        
        Args:
            symbol: Trading pair symbol (e.g., "BTC/USDT")
            
        Returns:
            Dictionary with signal data
        """
        try:
            logger.info(f"Getting alt data signal for {symbol}")
            
            # Check if external data is enabled
            if not settings.EXTERNAL_DATA_ENABLED:
                logger.warning("External data is disabled, returning neutral signal")
                signal_value = 0.0
            else:
                # Call the module's sync get_signal function
                # Run in executor to avoid blocking
                import asyncio
                loop = asyncio.get_event_loop()
                signal_value = await loop.run_in_executor(
                    None,
                    self.engine.get_signal,
                    symbol
                )
            
            # Normalize symbol format
            normalized_symbol = symbol.replace('/', '').upper()
            
            result = {
                "symbol": normalized_symbol,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "signal": float(signal_value),
                "components": {
                    "alt_data": float(signal_value),
                    "google_trends_enabled": settings.GOOGLE_TRENDS_ENABLED,
                    "external_data_enabled": settings.EXTERNAL_DATA_ENABLED
                },
                "metadata": {
                    "module": self.module_name,
                    "signal_range": "[-0.5, 0.5]"
                }
            }
            
            logger.info(f"Alt data signal for {symbol}: {signal_value:.3f}")
            return result
            
        except Exception as e:
            logger.error(f"Error getting alt data signal for {symbol}: {e}", exc_info=True)
            raise

