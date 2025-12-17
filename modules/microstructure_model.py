"""
Market Microstructure Model
Analyzes order book and trade flow for microstructure signals
"""

import asyncio
import logging
from typing import Dict, Optional
from orderbook_engine import OrderBookEngine
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MicrostructureModel:
    """Market microstructure analysis model"""
    
    def __init__(self, exchange: str = 'binance'):
        self.orderbook_engine = OrderBookEngine(exchange)
        self.cvd_history: Dict[str, list] = {}  # Cumulative Volume Delta
        self.price_history: Dict[str, list] = {}
        self.trade_flow: Dict[str, list] = {}
    
    def _calculate_cvd(self, symbol: str, buy_volume: float, sell_volume: float):
        """Calculate Cumulative Volume Delta"""
        if symbol not in self.cvd_history:
            self.cvd_history[symbol] = []
        
        delta = buy_volume - sell_volume
        current_cvd = self.cvd_history[symbol][-1] if self.cvd_history[symbol] else 0
        new_cvd = current_cvd + delta
        
        self.cvd_history[symbol].append(new_cvd)
        
        # Keep only last 100 points
        if len(self.cvd_history[symbol]) > 100:
            self.cvd_history[symbol] = self.cvd_history[symbol][-100:]
    
    def _detect_cvd_divergence(self, symbol: str) -> Optional[float]:
        """Detect CVD divergence from price"""
        if symbol not in self.cvd_history or symbol not in self.price_history:
            return None
        
        cvd = self.cvd_history[symbol]
        prices = self.price_history[symbol]
        
        if len(cvd) < 20 or len(prices) < 20:
            return None
        
        # Calculate trends
        recent_cvd = cvd[-10:]
        older_cvd = cvd[-20:-10] if len(cvd) >= 20 else cvd[:-10]
        
        recent_prices = prices[-10:]
        older_prices = prices[-20:-10] if len(prices) >= 20 else prices[:-10]
        
        cvd_trend = (sum(recent_cvd) / len(recent_cvd)) - (sum(older_cvd) / len(older_cvd))
        price_trend = (sum(recent_prices) / len(recent_prices)) - (sum(older_prices) / len(older_prices))
        
        # Divergence: CVD rising but price falling = bullish
        # CVD falling but price rising = bearish
        if cvd_trend > 0 and price_trend < 0:
            return 1.0  # Bullish divergence
        elif cvd_trend < 0 and price_trend > 0:
            return -1.0  # Bearish divergence
        else:
            return 0.0
    
    async def get_signal(self, symbol: str) -> float:
        """
        Get microstructure signal
        
        Returns:
            float: Signal from -1 (bearish pressure) to +1 (bullish pressure)
        """
        try:
            # Connect and get order book data
            if not self.orderbook_engine.is_connected:
                await self.orderbook_engine.connect(symbol)
            
            # Listen briefly for order book updates
            await asyncio.wait_for(
                self.orderbook_engine.listen(symbol, duration=3),
                timeout=5
            )
            
            # Calculate bid/ask imbalance
            imbalance = self.orderbook_engine.calculate_bid_ask_imbalance(symbol)
            
            # Detect large walls
            walls = self.orderbook_engine.detect_large_walls(symbol)
            
            # Get order book snapshot
            snapshot = await self.orderbook_engine.get_orderbook_snapshot(symbol)
            
            signal = 0.0
            
            # Bid/ask imbalance (60% weight)
            if imbalance is not None:
                signal += imbalance * 0.6
            
            # Large walls (30% weight)
            if walls['buy_wall']:
                signal += 0.3  # Large buy wall = bullish
            elif walls['sell_wall']:
                signal -= 0.3  # Large sell wall = bearish
            
            # CVD divergence (10% weight) - simplified
            cvd_signal = self._detect_cvd_divergence(symbol)
            if cvd_signal is not None:
                signal += cvd_signal * 0.1
            
            # Clamp to -1 to +1 range
            signal = max(-1.0, min(1.0, signal))
            
            logger.info(f"Microstructure Signal for {symbol}: imbalance={imbalance}, signal={signal:.3f}")
            
            return signal
            
        except Exception as e:
            logger.error(f"Error getting microstructure signal: {e}")
            return 0.0


if __name__ == '__main__':
    async def test():
        model = MicrostructureModel('binance')
        signal = await model.get_signal('BTC/USDT')
        print(f"Microstructure Signal: {signal}")
        await model.orderbook_engine.disconnect()
    
    asyncio.run(test())

