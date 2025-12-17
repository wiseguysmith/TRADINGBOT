"""
Google Trends Predictor
Tracks Google Trends data for crypto symbols
"""

import logging
from typing import Dict, Optional
from datetime import datetime, timedelta
try:
    from pytrends.request import TrendReq
    PTRENDS_AVAILABLE = True
except ImportError:
    PTRENDS_AVAILABLE = False
    logging.warning("pytrends not available, using stub implementation")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GoogleTrendPredictor:
    """Predictor using Google Trends data"""
    
    def __init__(self):
        self.pytrends = None
        if PTRENDS_AVAILABLE:
            try:
                self.pytrends = TrendReq(hl='en-US', tz=360)
            except Exception as e:
                logger.warning(f"Failed to initialize pytrends: {e}")
                self.pytrends = None
    
    def _get_search_term(self, symbol: str) -> str:
        """Convert symbol to Google Trends search term"""
        # Map common crypto symbols to search terms
        symbol_map = {
            'BTC': 'Bitcoin',
            'ETH': 'Ethereum',
            'BNB': 'Binance Coin',
            'SOL': 'Solana',
            'XRP': 'Ripple',
            'ADA': 'Cardano',
            'DOGE': 'Dogecoin',
            'DOT': 'Polkadot',
            'MATIC': 'Polygon',
            'AVAX': 'Avalanche'
        }
        
        base_symbol = symbol.split('/')[0] if '/' in symbol else symbol
        return symbol_map.get(base_symbol, f"{base_symbol} cryptocurrency")
    
    def get_trend_data(self, symbol: str, timeframe: str = '7d') -> Optional[Dict]:
        """Get Google Trends data for symbol"""
        if not self.pytrends:
            return None
        
        try:
            search_term = self._get_search_term(symbol)
            
            # Build payload
            self.pytrends.build_payload(
                kw_list=[search_term],
                timeframe=timeframe,
                geo=''
            )
            
            # Get interest over time
            data = self.pytrends.interest_over_time()
            
            if data is None or data.empty:
                return None
            
            # Calculate trend metrics
            values = data[search_term].values
            recent_avg = values[-7:].mean() if len(values) >= 7 else values.mean()
            older_avg = values[:-7].mean() if len(values) >= 14 else values.mean()
            
            trend_change = (recent_avg - older_avg) / older_avg if older_avg > 0 else 0
            
            return {
                'current': float(recent_avg),
                'trend_change': float(trend_change),
                'values': values.tolist()
            }
            
        except Exception as e:
            logger.error(f"Error getting Google Trends data: {e}")
            return None
    
    def get_signal(self, symbol: str) -> float:
        """
        Get signal based on Google Trends
        
        Returns:
            float: Signal from -0.5 (falling trends) to +0.5 (rising trends)
        """
        try:
            trend_data = self.get_trend_data(symbol)
            
            if not trend_data:
                return 0.0
            
            trend_change = trend_data['trend_change']
            
            # Normalize to -0.5 to +0.5 range
            if trend_change > 0.2:  # Strong upward trend
                return 0.5
            elif trend_change > 0.1:
                return 0.3
            elif trend_change > 0.05:
                return 0.2
            elif trend_change < -0.2:  # Strong downward trend
                return -0.5
            elif trend_change < -0.1:
                return -0.3
            elif trend_change < -0.05:
                return -0.2
            else:
                return 0.0
                
        except Exception as e:
            logger.error(f"Error getting Google Trends signal: {e}")
            return 0.0


if __name__ == '__main__':
    predictor = GoogleTrendPredictor()
    signal = predictor.get_signal('BTC/USDT')
    print(f"Google Trends Signal: {signal}")

