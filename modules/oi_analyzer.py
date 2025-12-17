"""
Open Interest Analyzer
Analyzes open interest changes and funding rates
"""

import asyncio
import logging
import requests
from typing import Dict, Optional, List
from datetime import datetime, timedelta
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OIAnalyzer:
    """Open Interest analyzer"""
    
    def __init__(self, exchange: str = 'binance'):
        self.exchange = exchange.lower()
        self.api_key = os.getenv('BINANCE_API_KEY', '')
        self.api_secret = os.getenv('BINANCE_API_SECRET', '')
        self.oi_history: Dict[str, List[Dict]] = {}
        self.funding_history: Dict[str, List[Dict]] = {}
    
    def _get_binance_oi(self, symbol: str) -> Optional[Dict]:
        """Get open interest from Binance"""
        try:
            symbol_normalized = symbol.replace('/', '').upper()
            url = f"https://fapi.binance.com/fapi/v1/openInterest"
            params = {'symbol': symbol_normalized}
            
            response = requests.get(url, params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'open_interest': float(data.get('openInterest', 0)),
                    'timestamp': datetime.now()
                }
            else:
                logger.warning(f"Binance API returned {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting Binance OI: {e}")
            return None
    
    def _get_binance_funding_rate(self, symbol: str) -> Optional[Dict]:
        """Get funding rate from Binance"""
        try:
            symbol_normalized = symbol.replace('/', '').upper()
            url = f"https://fapi.binance.com/fapi/v1/premiumIndex"
            params = {'symbol': symbol_normalized}
            
            response = requests.get(url, params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'funding_rate': float(data.get('lastFundingRate', 0)),
                    'mark_price': float(data.get('markPrice', 0)),
                    'timestamp': datetime.now()
                }
            else:
                logger.warning(f"Binance API returned {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting Binance funding rate: {e}")
            return None
    
    def _get_bybit_oi(self, symbol: str) -> Optional[Dict]:
        """Get open interest from Bybit (placeholder)"""
        # TODO: Implement Bybit API
        logger.info(f"Bybit OI for {symbol} - placeholder")
        return None
    
    def _get_liquidations(self, symbol: str) -> Optional[Dict]:
        """Get liquidation data (placeholder)"""
        # TODO: Implement liquidation feed
        logger.info(f"Liquidations for {symbol} - placeholder")
        return {
            'long_liquidations': 0,
            'short_liquidations': 0,
            'total_liquidations': 0
        }
    
    def calculate_oi_change(self, symbol: str) -> Optional[float]:
        """Calculate open interest change percentage"""
        if symbol not in self.oi_history or len(self.oi_history[symbol]) < 2:
            return None
        
        history = self.oi_history[symbol]
        recent = history[-1]['open_interest']
        older = history[0]['open_interest'] if len(history) > 1 else recent
        
        if older == 0:
            return None
        
        change = (recent - older) / older
        return float(change)
    
    async def get_signal(self, symbol: str) -> float:
        """
        Get open interest signal
        
        Returns:
            float: Signal from -1 (bearish) to +1 (bullish)
        """
        try:
            # Get current OI and funding rate
            if self.exchange == 'binance':
                oi_data = self._get_binance_oi(symbol)
                funding_data = self._get_binance_funding_rate(symbol)
            else:
                oi_data = self._get_bybit_oi(symbol)
                funding_data = None
            
            if not oi_data:
                return 0.0
            
            # Update history
            if symbol not in self.oi_history:
                self.oi_history[symbol] = []
            self.oi_history[symbol].append(oi_data)
            
            # Keep only last 20 data points
            if len(self.oi_history[symbol]) > 20:
                self.oi_history[symbol] = self.oi_history[symbol][-20:]
            
            signal = 0.0
            
            # OI change (60% weight)
            oi_change = self.calculate_oi_change(symbol)
            if oi_change is not None:
                if oi_change > 0.05:  # Rising OI
                    signal += 0.6
                elif oi_change < -0.05:  # Falling OI
                    signal -= 0.3  # Falling OI = trend weakening
            
            # Funding rate (40% weight)
            if funding_data:
                funding_rate = funding_data['funding_rate']
                if funding_rate > 0.01:  # Positive funding = longs paying shorts
                    if oi_change and oi_change > 0:
                        signal += 0.4  # Rising OI + positive funding = bullish
                    else:
                        signal -= 0.2  # Positive funding without OI growth = bearish
                elif funding_rate < -0.01:  # Negative funding = shorts paying longs
                    if oi_change and oi_change > 0:
                        signal -= 0.4  # Rising OI + negative funding = bearish
                    else:
                        signal += 0.2
            
            # Clamp to -1 to +1 range
            signal = max(-1.0, min(1.0, signal))
            
            logger.info(f"OI Signal for {symbol}: oi_change={oi_change}, funding={funding_data['funding_rate'] if funding_data else None}, signal={signal:.3f}")
            
            return signal
            
        except Exception as e:
            logger.error(f"Error getting OI signal: {e}")
            return 0.0


if __name__ == '__main__':
    async def test():
        analyzer = OIAnalyzer('binance')
        signal = await analyzer.get_signal('BTC/USDT')
        print(f"OI Signal: {signal}")
    
    asyncio.run(test())

