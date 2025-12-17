# WebSocket Implementation Guide

## Overview
This document describes the WebSocket price feed implementation for the AutoBread trading bot. The implementation includes both Python and TypeScript versions for maximum flexibility.

## Files Created

### Python Files
1. **`websocket_price_feed.py`** - Core WebSocket price feed service
2. **`websocket_integration_example.py`** - Example integration with trading bot

### TypeScript Files
1. **`src/services/websocketPriceFeed.ts`** - TypeScript WebSocket price feed
2. **`src/services/krakenWebSocketClient.ts`** - Specialized Kraken WebSocket client
3. **`src/services/marketDataService.ts`** - Market data service with WebSocket integration

## Features

### ✅ Implemented
- WebSocket connections for multiple exchanges (Kraken, Binance, KuCoin, Coinbase)
- Automatic reconnection logic
- Price update callbacks
- Real-time price data caching
- Ping/pong keep-alive mechanism
- Exchange-specific message parsing
- Error handling and logging

### 🔄 In Progress
- Historical data integration
- Technical indicator calculation
- Multi-exchange arbitrage detection

## Usage

### Python Usage

```python
from websocket_price_feed import WebSocketPriceFeed, ExchangeType

# Create price feed
feed = WebSocketPriceFeed(ExchangeType.KRAKEN)

# Register callback
def on_price_update(pair, price_data):
    print(f"Price update: {pair} = ${price_data['price']}")

feed.register_callback("BTC/USD", on_price_update)

# Connect and subscribe
await feed.connect(["BTC/USD", "ETH/USD"])

# Start listening
await feed.listen()
```

### TypeScript Usage

```typescript
import { WebSocketPriceFeed, ExchangeType } from './services/websocketPriceFeed';

// Create price feed
const feed = new WebSocketPriceFeed({ 
  exchange: ExchangeType.KRAKEN 
});

// Register event listeners
feed.on('priceUpdate', (pair: string, priceData: PriceData) => {
  console.log(`Price update: ${pair} = $${priceData.price}`);
});

// Start feed
feed.start(['BTC/USD', 'ETH/USD']);

// Stop feed
feed.stop();
```

### Integration with Trading Engine

```typescript
import { MarketDataService } from './services/marketDataService';

const marketDataService = new MarketDataService(ExchangeType.KRAKEN, true);

marketDataService.on('marketData', (pair: string, data: MarketData) => {
  // Use market data for trading decisions
  const signal = strategy.generateSignals(data);
  if (signal.action !== 'hold') {
    tradeExecutor.executeTrade(signal, portfolio, data);
  }
});

await marketDataService.start(['BTC/USD']);
```

## Exchange Support

### Kraken
- Public ticker updates
- Private channel support (with API keys)
- Authentication support

### Binance
- Ticker stream
- URL-based subscriptions

### KuCoin
- Market ticker
- Topic-based subscriptions

### Coinbase
- Ticker channel
- Product ID subscriptions

## Configuration

### Environment Variables
```bash
# Kraken API (for private channels)
KRAKEN_API_KEY=your_api_key
KRAKEN_API_SECRET=your_api_secret

# WebSocket settings
WEBSOCKET_ENABLED=true
WEBSOCKET_RECONNECT_DELAY=5
WEBSOCKET_MAX_RECONNECT_ATTEMPTS=10
```

### Config File
```python
from config import Config

config = Config()
websocket_enabled = config.get_bool('websocket_enabled', True)
reconnect_delay = config.get_int('websocket_reconnect_delay', 5)
```

## Reconnection Logic

The WebSocket implementation includes automatic reconnection:
- Reconnects on connection loss
- Exponential backoff (configurable delay)
- Maximum reconnect attempts limit
- Graceful degradation to REST API polling

## Error Handling

- Connection errors → Automatic reconnection
- Parse errors → Logged and skipped
- Timeout errors → Ping/pong keep-alive
- Max reconnect attempts → Fallback to REST API

## Performance

- **Latency**: <100ms (WebSocket) vs ~5000ms (REST polling)
- **Updates**: Real-time vs 5-second intervals
- **Bandwidth**: Lower (push vs pull)
- **Connection**: Persistent vs per-request

## Testing

### Test WebSocket Connection
```python
python websocket_price_feed.py
```

### Test Integration
```python
python websocket_integration_example.py
```

### Test TypeScript Service
```typescript
// In Node.js or browser console
import { WebSocketPriceFeed } from './services/websocketPriceFeed';
const feed = new WebSocketPriceFeed({ exchange: 'kraken' });
feed.start(['BTC/USD']);
```

## Migration from REST API

To migrate from REST API polling to WebSocket:

1. Replace REST API calls with WebSocket subscriptions
2. Update trading engines to use `MarketDataService`
3. Remove polling intervals
4. Add WebSocket event handlers
5. Test reconnection logic

## Troubleshooting

### Connection Issues
- Check firewall settings
- Verify exchange WebSocket URLs
- Check network connectivity
- Review exchange API status

### Authentication Errors
- Verify API keys are correct
- Check API key permissions
- Ensure proper signature generation

### Message Parsing Errors
- Check exchange message format
- Verify pair naming conventions
- Review exchange documentation

## Next Steps

1. ✅ WebSocket implementation complete
2. 🔄 Integrate with live trading engine
3. 🔄 Add more technical indicators
4. 🔄 Implement multi-exchange arbitrage
5. 🔄 Add WebSocket monitoring dashboard

## Dependencies

### Python
- `websockets` - WebSocket client library
- `asyncio` - Async support

### TypeScript
- `ws` - WebSocket library
- `@types/ws` - TypeScript types

Install with:
```bash
npm install ws @types/ws
pip install websockets
```

