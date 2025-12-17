"""
Alternative Data Engine
Combines multiple alternative data sources for trading signals
"""

import logging
from typing import Dict, Optional
from google_trend_predictor import GoogleTrendPredictor
from sentiment_model import SentimentModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AltDataEngine:
    """Alternative data engine combining multiple sources"""
    
    def __init__(self):
        self.google_trends = GoogleTrendPredictor()
        self.sentiment = SentimentModel()
        self.cache: Dict[str, Dict] = {}
        self.cache_ttl = 300  # 5 minutes
    
    def get_signal(self, symbol: str) -> float:
        """
        Get combined alternative data signal
        
        Returns:
            float: Signal from -0.5 (bearish) to +0.5 (bullish)
        """
        try:
            # Google Trends (50% weight)
            trends_signal = self.google_trends.get_signal(symbol)
            
            # Sentiment (50% weight)
            sentiment_signal = self.sentiment.get_signal(symbol)
            
            # Combine signals
            combined_signal = (trends_signal * 0.5) + (sentiment_signal * 0.5)
            
            # Clamp to -0.5 to +0.5 range
            combined_signal = max(-0.5, min(0.5, combined_signal))
            
            logger.info(f"Alt Data Signal for {symbol}: trends={trends_signal:.3f}, sentiment={sentiment_signal:.3f}, combined={combined_signal:.3f}")
            
            return combined_signal
            
        except Exception as e:
            logger.error(f"Error getting alternative data signal: {e}")
            return 0.0


if __name__ == '__main__':
    engine = AltDataEngine()
    signal = engine.get_signal('BTC/USDT')
    print(f"Alternative Data Signal: {signal}")

