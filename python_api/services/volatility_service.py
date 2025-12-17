"""
Volatility Service
Wraps ai_volatility_predictor module for API access
"""

import sys
import logging
from pathlib import Path
from typing import Dict, Any
from datetime import datetime

# Add parent directory to path to import modules
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from modules.ai_volatility_predictor import AIVolatilityPredictor
from config.settings import settings

logger = logging.getLogger(__name__)

class VolatilityService:
    """Service for volatility prediction signals"""
    
    def __init__(self):
        self.module_name = "ai_volatility_predictor"
        self.predictor = AIVolatilityPredictor()
    
    async def get_signal(self, symbol: str, feature_dict: Dict[str, float] = None) -> Dict[str, Any]:
        """
        Get volatility prediction signal
        
        Args:
            symbol: Trading pair symbol (e.g., "BTC/USDT")
            feature_dict: Optional feature dictionary for ML model
            
        Returns:
            Dictionary with signal data
        """
        try:
            logger.info(f"Getting volatility signal for {symbol}")
            
            # If no feature dict provided, create default one
            if feature_dict is None:
                feature_dict = {
                    'volatility_history': 0.0,
                    'cvd': 0.0,
                    'orderbook_imbalance': 0.0,
                    'funding_rate': 0.0,
                    'sentiment': 0.0,
                    'google_trends': 0.0,
                    'oi_change': 0.0
                }
            
            # Call the module's sync get_signal function
            # Run in executor to avoid blocking
            import asyncio
            loop = asyncio.get_event_loop()
            signal_value = await loop.run_in_executor(
                None,
                self.predictor.get_signal,
                feature_dict
            )
            
            # Normalize symbol format
            normalized_symbol = symbol.replace('/', '').upper()
            
            result = {
                "symbol": normalized_symbol,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "signal": float(signal_value),
                "components": {
                    "volatility": float(signal_value)
                },
                "metadata": {
                    "module": self.module_name,
                    "signal_range": "[0, 1]",
                    "model_trained": self.predictor.is_trained
                }
            }
            
            logger.info(f"Volatility signal for {symbol}: {signal_value:.3f}")
            return result
            
        except Exception as e:
            logger.error(f"Error getting volatility signal for {symbol}: {e}", exc_info=True)
            raise

