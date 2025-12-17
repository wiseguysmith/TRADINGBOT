"""
WebSocket Price Feed Service
Real-time price feeds via WebSocket connections
Supports multiple exchanges and automatic reconnection
"""

import asyncio
import json
import logging
import time
from typing import Dict, List, Optional, Callable, Any
from datetime import datetime
from enum import Enum
import websockets
from websockets.exceptions import ConnectionClosed, InvalidURI

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ExchangeType(Enum):
    KRAKEN = "kraken"
    BINANCE = "binance"
    KUCOIN = "kucoin"
    COINBASE = "coinbase"

class WebSocketPriceFeed:
    """WebSocket-based price feed service"""
    
    def __init__(self, exchange: ExchangeType = ExchangeType.KRAKEN):
        self.exchange = exchange
        self.websocket = None
        self.is_connected = False
        self.is_running = False
        self.reconnect_delay = 5
        self.max_reconnect_attempts = 10
        self.reconnect_attempts = 0
        self.subscriptions = {}
        self.callbacks = {}
        self.price_data = {}
        self.last_update = {}
    
    def get_websocket_url(self, pair: str) -> str:
        """Get WebSocket URL for exchange and pair"""
        pair_normalized = pair.replace('/', '').upper()
        
        urls = {
            ExchangeType.KRAKEN: f"wss://ws.kraken.com",
            ExchangeType.BINANCE: f"wss://stream.binance.com:9443/ws/{pair_normalized.lower()}@ticker",
            ExchangeType.KUCOIN: f"wss://ws-api-spot.kucoin.com",
            ExchangeType.COINBASE: f"wss://ws-feed.pro.coinbase.com"
        }
        
        return urls.get(self.exchange, urls[ExchangeType.KRAKEN])
    
    def get_subscription_message(self, pairs: List[str]) -> Dict:
        """Get subscription message for exchange"""
        if self.exchange == ExchangeType.KRAKEN:
            return {
                "event": "subscribe",
                "pair": pairs,
                "subscription": {
                    "name": "ticker"
                }
            }
        elif self.exchange == ExchangeType.BINANCE:
            # Binance uses URL-based subscriptions
            return {}
        elif self.exchange == ExchangeType.KUCOIN:
            return {
                "id": int(time.time() * 1000),
                "type": "subscribe",
                "topic": f"/market/ticker:{','.join(pairs)}",
                "privateChannel": False,
                "response": True
            }
        elif self.exchange == ExchangeType.COINBASE:
            return {
                "type": "subscribe",
                "product_ids": pairs,
                "channels": ["ticker"]
            }
        
        return {}
    
    async def connect(self, pairs: List[str]):
        """Connect to WebSocket and subscribe to pairs"""
        url = self.get_websocket_url(pairs[0] if pairs else "BTC/USD")
        
        try:
            logger.info(f"Connecting to {self.exchange.value} WebSocket: {url}")
            self.websocket = await websockets.connect(url)
            self.is_connected = True
            self.reconnect_attempts = 0
            
            # Subscribe to pairs
            if pairs:
                await self.subscribe(pairs)
            
            logger.info(f"Connected to {self.exchange.value} WebSocket")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to WebSocket: {e}")
            self.is_connected = False
            return False
    
    async def subscribe(self, pairs: List[str]):
        """Subscribe to price updates for pairs"""
        if not self.is_connected or not self.websocket:
            logger.warning("Not connected to WebSocket")
            return
        
        message = self.get_subscription_message(pairs)
        if message:
            await self.websocket.send(json.dumps(message))
            logger.info(f"Subscribed to pairs: {pairs}")
        
        # Store subscriptions
        for pair in pairs:
            self.subscriptions[pair] = True
    
    async def unsubscribe(self, pairs: List[str]):
        """Unsubscribe from price updates"""
        if not self.is_connected or not self.websocket:
            return
        
        if self.exchange == ExchangeType.KRAKEN:
            message = {
                "event": "unsubscribe",
                "pair": pairs
            }
            await self.websocket.send(json.dumps(message))
        elif self.exchange == ExchangeType.COINBASE:
            message = {
                "type": "unsubscribe",
                "product_ids": pairs,
                "channels": ["ticker"]
            }
            await self.websocket.send(json.dumps(message))
    
    def parse_message(self, message: str) -> Optional[Dict]:
        """Parse WebSocket message based on exchange"""
        try:
            data = json.loads(message)
            
            if self.exchange == ExchangeType.KRAKEN:
                return self._parse_kraken_message(data)
            elif self.exchange == ExchangeType.BINANCE:
                return self._parse_binance_message(data)
            elif self.exchange == ExchangeType.KUCOIN:
                return self._parse_kucoin_message(data)
            elif self.exchange == ExchangeType.COINBASE:
                return self._parse_coinbase_message(data)
            
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse message: {message}")
        
        return None
    
    def _parse_kraken_message(self, data: Any) -> Optional[Dict]:
        """Parse Kraken WebSocket message"""
        if isinstance(data, list) and len(data) >= 4:
            # Ticker update format: [channelID, [price, volume, ...], ...]
            channel_id = data[0]
            ticker_data = data[1]
            
            if isinstance(ticker_data, list) and len(ticker_data) >= 4:
                return {
                    'exchange': 'kraken',
                    'price': float(ticker_data[0]),
                    'volume': float(ticker_data[1]),
                    'timestamp': datetime.now().isoformat()
                }
        
        return None
    
    def _parse_binance_message(self, data: Dict) -> Optional[Dict]:
        """Parse Binance WebSocket message"""
        if 'c' in data:  # Current price
            return {
                'exchange': 'binance',
                'price': float(data['c']),
                'volume': float(data.get('v', 0)),
                'timestamp': datetime.now().isoformat()
            }
        return None
    
    def _parse_kucoin_message(self, data: Dict) -> Optional[Dict]:
        """Parse KuCoin WebSocket message"""
        if data.get('type') == 'message' and 'data' in data:
            ticker = data['data']
            if 'price' in ticker:
                return {
                    'exchange': 'kucoin',
                    'price': float(ticker['price']),
                    'volume': float(ticker.get('volume', 0)),
                    'timestamp': datetime.now().isoformat()
                }
        return None
    
    def _parse_coinbase_message(self, data: Dict) -> Optional[Dict]:
        """Parse Coinbase WebSocket message"""
        if data.get('type') == 'ticker' and 'price' in data:
            return {
                'exchange': 'coinbase',
                'price': float(data['price']),
                'volume': float(data.get('volume_24h', 0)),
                'timestamp': datetime.now().isoformat()
            }
        return None
    
    def register_callback(self, pair: str, callback: Callable):
        """Register callback for price updates"""
        if pair not in self.callbacks:
            self.callbacks[pair] = []
        self.callbacks[pair].append(callback)
    
    async def _notify_callbacks(self, pair: str, price_data: Dict):
        """Notify registered callbacks of price update"""
        if pair in self.callbacks:
            for callback in self.callbacks[pair]:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback(pair, price_data)
                    else:
                        callback(pair, price_data)
                except Exception as e:
                    logger.error(f"Error in callback: {e}")
    
    async def listen(self):
        """Listen for WebSocket messages"""
        self.is_running = True
        
        while self.is_running:
            try:
                if not self.is_connected or not self.websocket:
                    await asyncio.sleep(1)
                    continue
                
                message = await asyncio.wait_for(self.websocket.recv(), timeout=30)
                price_data = self.parse_message(message)
                
                if price_data:
                    # Update price data
                    pair = self._extract_pair_from_message(message)
                    if pair:
                        self.price_data[pair] = price_data
                        self.last_update[pair] = datetime.now()
                        
                        # Notify callbacks
                        await self._notify_callbacks(pair, price_data)
                
            except asyncio.TimeoutError:
                # Send ping to keep connection alive
                if self.websocket:
                    try:
                        await self.websocket.ping()
                    except:
                        pass
                continue
                
            except ConnectionClosed:
                logger.warning("WebSocket connection closed")
                self.is_connected = False
                await self._reconnect()
                
            except Exception as e:
                logger.error(f"Error in listen loop: {e}")
                await asyncio.sleep(1)
    
    def _extract_pair_from_message(self, message: str) -> Optional[str]:
        """Extract trading pair from message"""
        # This is a simplified version - actual implementation depends on exchange
        # For now, return first subscribed pair
        if self.subscriptions:
            return list(self.subscriptions.keys())[0]
        return None
    
    async def _reconnect(self):
        """Reconnect to WebSocket"""
        if self.reconnect_attempts >= self.max_reconnect_attempts:
            logger.error("Max reconnect attempts reached")
            self.is_running = False
            return
        
        self.reconnect_attempts += 1
        logger.info(f"Reconnecting (attempt {self.reconnect_attempts}/{self.max_reconnect_attempts})...")
        
        await asyncio.sleep(self.reconnect_delay)
        
        pairs = list(self.subscriptions.keys())
        await self.connect(pairs)
    
    async def disconnect(self):
        """Disconnect from WebSocket"""
        self.is_running = False
        
        if self.websocket:
            await self.websocket.close()
            self.is_connected = False
        
        logger.info("Disconnected from WebSocket")
    
    def get_latest_price(self, pair: str) -> Optional[Dict]:
        """Get latest price for a pair"""
        return self.price_data.get(pair)
    
    def get_all_prices(self) -> Dict:
        """Get all current price data"""
        return self.price_data.copy()


# Example usage
async def main():
    feed = WebSocketPriceFeed(ExchangeType.KRAKEN)
    
    # Register callback
    def on_price_update(pair, price_data):
        print(f"Price update for {pair}: ${price_data['price']}")
    
    feed.register_callback("BTC/USD", on_price_update)
    
    # Connect and subscribe
    await feed.connect(["BTC/USD", "ETH/USD"])
    
    # Start listening
    await feed.listen()


if __name__ == '__main__':
    asyncio.run(main())

