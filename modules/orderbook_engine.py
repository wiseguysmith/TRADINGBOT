"""
Order Book Engine
Real-time order book depth analysis via WebSocket
"""

import asyncio
import logging
import json
from typing import Dict, List, Optional, Tuple
import websockets
from collections import defaultdict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OrderBookEngine:
    """Order book depth analysis engine"""
    
    def __init__(self, exchange: str = 'binance'):
        self.exchange = exchange.lower()
        self.websocket = None
        self.is_connected = False
        self.orderbook: Dict[str, Dict] = {}
        self.bids: Dict[str, List[Tuple[float, float]]] = defaultdict(list)
        self.asks: Dict[str, List[Tuple[float, float]]] = defaultdict(list)
        self.last_update: Dict[str, float] = {}
    
    def get_websocket_url(self, symbol: str) -> str:
        """Get WebSocket URL for order book"""
        symbol_normalized = symbol.replace('/', '').lower()
        
        if self.exchange == 'binance':
            return f"wss://fstream.binance.com/ws/{symbol_normalized}@depth20@100ms"
        elif self.exchange == 'kraken':
            return "wss://ws.kraken.com"
        else:
            return f"wss://fstream.binance.com/ws/{symbol_normalized}@depth20@100ms"
    
    async def connect(self, symbol: str):
        """Connect to WebSocket"""
        url = self.get_websocket_url(symbol)
        
        try:
            logger.info(f"Connecting to {self.exchange} order book WebSocket for {symbol}")
            self.websocket = await websockets.connect(url)
            self.is_connected = True
            
            if self.exchange == 'kraken':
                subscribe_msg = {
                    "event": "subscribe",
                    "pair": [symbol.replace('/', '')],
                    "subscription": {"name": "book", "depth": 20}
                }
                await self.websocket.send(json.dumps(subscribe_msg))
            
            logger.info(f"Connected to order book WebSocket")
            return True
        except Exception as e:
            logger.error(f"Failed to connect: {e}")
            self.is_connected = False
            return False
    
    def _update_orderbook(self, symbol: str, bids: List[List], asks: List[List]):
        """Update order book data"""
        self.bids[symbol] = [(float(price), float(qty)) for price, qty in bids]
        self.asks[symbol] = [(float(price), float(qty)) for price, qty in asks]
        self.last_update[symbol] = asyncio.get_event_loop().time()
        
        # Store full orderbook snapshot
        self.orderbook[symbol] = {
            'bids': self.bids[symbol],
            'asks': self.asks[symbol],
            'timestamp': self.last_update[symbol]
        }
    
    async def listen(self, symbol: str, duration: int = 5):
        """Listen for order book updates"""
        import time
        start_time = time.time()
        
        while time.time() - start_time < duration:
            try:
                if not self.is_connected or not self.websocket:
                    await asyncio.sleep(0.1)
                    continue
                
                message = await asyncio.wait_for(self.websocket.recv(), timeout=2)
                await self._process_message(symbol, message)
                
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Error in listen loop: {e}")
                await asyncio.sleep(0.1)
    
    async def _process_message(self, symbol: str, message: str):
        """Process WebSocket message"""
        try:
            data = json.loads(message)
            
            if self.exchange == 'binance':
                if 'bids' in data and 'asks' in data:
                    self._update_orderbook(symbol, data['bids'], data['asks'])
            elif self.exchange == 'kraken':
                if isinstance(data, list) and len(data) > 1:
                    book_data = data[1]
                    if isinstance(book_data, dict):
                        bids = book_data.get('b', [])
                        asks = book_data.get('a', [])
                        if bids and asks:
                            self._update_orderbook(symbol, bids, asks)
                            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
    
    def calculate_bid_ask_imbalance(self, symbol: str) -> Optional[float]:
        """Calculate bid/ask imbalance"""
        if symbol not in self.bids or symbol not in self.asks:
            return None
        
        bids = self.bids[symbol]
        asks = self.asks[symbol]
        
        if not bids or not asks:
            return None
        
        # Calculate total bid and ask volume
        bid_volume = sum(qty for _, qty in bids)
        ask_volume = sum(qty for _, qty in asks)
        
        total_volume = bid_volume + ask_volume
        if total_volume == 0:
            return None
        
        # Imbalance: positive = bid pressure, negative = ask pressure
        imbalance = (bid_volume - ask_volume) / total_volume
        
        return float(imbalance)
    
    def detect_large_walls(self, symbol: str, threshold_percent: float = 0.1) -> Dict[str, Optional[float]]:
        """Detect large buy/sell walls"""
        if symbol not in self.bids or symbol not in self.asks:
            return {'buy_wall': None, 'sell_wall': None}
        
        bids = self.bids[symbol]
        asks = self.asks[symbol]
        
        if not bids or not asks:
            return {'buy_wall': None, 'sell_wall': None}
        
        # Calculate total volume
        total_bid_volume = sum(qty for _, qty in bids)
        total_ask_volume = sum(qty for _, qty in asks)
        
        # Find largest orders
        max_bid = max((qty for _, qty in bids), default=0)
        max_ask = max((qty for _, qty in asks), default=0)
        
        buy_wall = max_bid / total_bid_volume if total_bid_volume > 0 else 0
        sell_wall = max_ask / total_ask_volume if total_ask_volume > 0 else 0
        
        return {
            'buy_wall': float(buy_wall) if buy_wall > threshold_percent else None,
            'sell_wall': float(sell_wall) if sell_wall > threshold_percent else None
        }
    
    async def get_orderbook_snapshot(self, symbol: str) -> Optional[Dict]:
        """Get current order book snapshot"""
        if symbol not in self.orderbook:
            return None
        
        return self.orderbook[symbol].copy()
    
    async def disconnect(self):
        """Disconnect from WebSocket"""
        if self.websocket:
            await self.websocket.close()
            self.is_connected = False


if __name__ == '__main__':
    async def test():
        engine = OrderBookEngine('binance')
        await engine.connect('BTC/USDT')
        await engine.listen('BTC/USDT', duration=3)
        
        imbalance = engine.calculate_bid_ask_imbalance('BTC/USDT')
        print(f"Bid/Ask Imbalance: {imbalance}")
        
        walls = engine.detect_large_walls('BTC/USDT')
        print(f"Large Walls: {walls}")
        
        await engine.disconnect()
    
    asyncio.run(test())

