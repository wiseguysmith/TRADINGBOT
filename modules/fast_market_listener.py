"""
Speed Edge Module
Real-time volatility detection via WebSocket ticker feeds
Detects volatility spikes and expansion patterns
"""

import asyncio
import logging
import time
from typing import Dict, List, Optional, Deque
from collections import deque
import numpy as np
import websockets
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FastMarketListener:
    """Real-time market listener for volatility detection"""
    
    def __init__(self, exchange: str = 'binance'):
        self.exchange = exchange.lower()
        self.websocket = None
        self.is_connected = False
        self.price_history: Dict[str, Deque[float]] = {}
        self.timestamp_history: Dict[str, Deque[float]] = {}
        self.window_seconds = 30
        self.min_data_points = 10
        
    def get_websocket_url(self, symbol: str) -> str:
        """Get WebSocket URL for exchange"""
        symbol_normalized = symbol.replace('/', '').upper()
        
        if self.exchange == 'binance':
            return f"wss://fstream.binance.com/ws/{symbol_normalized.lower()}@ticker"
        elif self.exchange == 'kraken':
            return "wss://ws.kraken.com"
        else:
            return f"wss://fstream.binance.com/ws/{symbol_normalized.lower()}@ticker"
    
    async def connect(self, symbol: str):
        """Connect to WebSocket"""
        url = self.get_websocket_url(symbol)
        
        try:
            logger.info(f"Connecting to {self.exchange} WebSocket for {symbol}")
            self.websocket = await websockets.connect(url)
            self.is_connected = True
            
            # Subscribe if needed
            if self.exchange == 'kraken':
                subscribe_msg = {
                    "event": "subscribe",
                    "pair": [symbol.replace('/', '')],
                    "subscription": {"name": "ticker"}
                }
                await self.websocket.send(str(subscribe_msg).replace("'", '"'))
            
            logger.info(f"Connected to {self.exchange} WebSocket")
            return True
        except Exception as e:
            logger.error(f"Failed to connect: {e}")
            self.is_connected = False
            return False
    
    def _update_price_history(self, symbol: str, price: float, timestamp: float):
        """Update price history with rolling window"""
        if symbol not in self.price_history:
            self.price_history[symbol] = deque(maxlen=1000)
            self.timestamp_history[symbol] = deque(maxlen=1000)
        
        self.price_history[symbol].append(price)
        self.timestamp_history[symbol].append(timestamp)
        
        # Remove old data points outside window
        cutoff_time = timestamp - self.window_seconds
        while (self.timestamp_history[symbol] and 
               self.timestamp_history[symbol][0] < cutoff_time):
            self.price_history[symbol].popleft()
            self.timestamp_history[symbol].popleft()
    
    def _calculate_volatility(self, symbol: str) -> Optional[float]:
        """Calculate rolling volatility"""
        if symbol not in self.price_history:
            return None
        
        prices = list(self.price_history[symbol])
        if len(prices) < self.min_data_points:
            return None
        
        # Calculate returns
        returns = np.diff(prices) / prices[:-1]
        
        # Calculate standard deviation (volatility)
        volatility = np.std(returns) if len(returns) > 0 else 0.0
        
        return float(volatility)
    
    def _detect_volatility_expansion(self, symbol: str) -> Optional[float]:
        """Detect volatility expansion direction"""
        if symbol not in self.price_history:
            return None
        
        prices = list(self.price_history[symbol])
        if len(prices) < self.min_data_points * 2:
            return None
        
        # Split into two halves
        mid_point = len(prices) // 2
        first_half = prices[:mid_point]
        second_half = prices[mid_point:]
        
        # Calculate volatility for each half
        returns_first = np.diff(first_half) / first_half[:-1] if len(first_half) > 1 else []
        returns_second = np.diff(second_half) / second_half[:-1] if len(second_half) > 1 else []
        
        vol_first = np.std(returns_first) if len(returns_first) > 0 else 0.0
        vol_second = np.std(returns_second) if len(returns_second) > 0 else 0.0
        
        # Calculate price direction
        price_change = (prices[-1] - prices[0]) / prices[0] if prices[0] != 0 else 0
        
        # Volatility expansion signal
        vol_expansion = vol_second - vol_first
        
        if vol_expansion > 0.001:  # Significant expansion
            if price_change > 0:
                return 1.0  # Bullish volatility expansion
            else:
                return -1.0  # Bearish volatility expansion
        elif vol_expansion < -0.001:  # Volatility contraction
            return 0.0
        else:
            return 0.0
    
    async def listen(self, symbol: str, duration: int = 60):
        """Listen for price updates"""
        start_time = time.time()
        
        while time.time() - start_time < duration:
            try:
                if not self.is_connected or not self.websocket:
                    await asyncio.sleep(1)
                    continue
                
                message = await asyncio.wait_for(self.websocket.recv(), timeout=5)
                await self._process_message(symbol, message)
                
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Error in listen loop: {e}")
                await asyncio.sleep(1)
    
    async def _process_message(self, symbol: str, message: str):
        """Process WebSocket message"""
        try:
            import json
            data = json.loads(message)
            
            price = None
            if self.exchange == 'binance':
                price = float(data.get('c', 0))  # Last price
            elif self.exchange == 'kraken':
                if isinstance(data, list) and len(data) > 1:
                    ticker_data = data[1]
                    if isinstance(ticker_data, list) and len(ticker_data) > 0:
                        price = float(ticker_data[0])
            
            if price and price > 0:
                timestamp = time.time()
                self._update_price_history(symbol, price, timestamp)
                
        except Exception as e:
            logger.error(f"Error processing message: {e}")
    
    async def get_signal(self, symbol: str) -> float:
        """
        Get speed edge signal based on volatility expansion
        
        Returns:
            float: Signal from -1 (bearish volatility expansion) to +1 (bullish volatility expansion)
        """
        try:
            # Connect if not connected
            if not self.is_connected:
                await self.connect(symbol)
            
            # Listen briefly to gather data
            await asyncio.wait_for(self.listen(symbol, duration=5), timeout=10)
            
            # Calculate signal
            signal = self._detect_volatility_expansion(symbol)
            
            if signal is None:
                # Fallback: use current volatility
                volatility = self._calculate_volatility(symbol)
                if volatility and volatility > 0.01:  # High volatility
                    # Check price trend
                    if symbol in self.price_history and len(self.price_history[symbol]) > 1:
                        prices = list(self.price_history[symbol])
                        price_change = (prices[-1] - prices[0]) / prices[0] if prices[0] != 0 else 0
                        return 1.0 if price_change > 0 else -1.0
                return 0.0
            
            return signal
            
        except Exception as e:
            logger.error(f"Error getting signal: {e}")
            return 0.0
    
    async def disconnect(self):
        """Disconnect from WebSocket"""
        if self.websocket:
            await self.websocket.close()
            self.is_connected = False


# Singleton instance
_listener_instance: Optional[FastMarketListener] = None

async def get_signal(symbol: str, exchange: str = 'binance') -> float:
    """Get speed edge signal (convenience function)"""
    global _listener_instance
    
    if _listener_instance is None:
        _listener_instance = FastMarketListener(exchange)
    
    return await _listener_instance.get_signal(symbol)


if __name__ == '__main__':
    async def test():
        listener = FastMarketListener('binance')
        signal = await listener.get_signal('BTC/USDT')
        print(f"Speed Edge Signal: {signal}")
        await listener.disconnect()
    
    asyncio.run(test())

