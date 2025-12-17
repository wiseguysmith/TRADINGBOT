# AutoBread Quant-Style Trading Modules

## Overview

AutoBread has been upgraded with five new alpha-generating modules that provide quant-style trading signals. These modules work together to generate high-quality trading signals with improved risk management.

## Module Architecture

```
AutoBread/
├── modules/
│   ├── fast_market_listener.py      # Speed Edge Module
│   ├── alt_data_engine.py           # Alternative Data Engine
│   ├── google_trend_predictor.py    # Google Trends integration
│   ├── sentiment_model.py           # Sentiment analysis
│   ├── microstructure_model.py      # Market microstructure
│   ├── orderbook_engine.py          # Order book analysis
│   ├── options_flow_engine.py       # Options flow analysis
│   ├── oi_analyzer.py               # Open interest analyzer
│   └── ai_volatility_predictor.py   # AI volatility prediction
├── strategy_manager.py              # Integrated signal manager
├── risk_manager.py                  # Enhanced risk management
└── trade_executor.py                # Trade execution with latency tracking
```

## Module Descriptions

### 1. Speed Edge Module (`fast_market_listener.py`)

**Purpose**: Detects real-time volatility spikes and expansion patterns

**Features**:
- WebSocket-based real-time ticker updates
- Rolling 30-second volatility calculation
- Volatility expansion detection
- Bullish/bearish volatility classification

**Signal Range**: -1 (bearish volatility expansion) to +1 (bullish volatility expansion)

**Weight**: 25% in combined signal

**Usage**:
```python
from modules.fast_market_listener import FastMarketListener

listener = FastMarketListener('binance')
signal = await listener.get_signal('BTC/USDT')
```

### 2. Alternative Data Engine (`alt_data_engine.py`)

**Purpose**: Combines multiple alternative data sources for sentiment analysis

**Components**:
- `google_trend_predictor.py`: Google Trends data
- `sentiment_model.py`: GitHub activity, Twitter sentiment (placeholder), web traffic

**Features**:
- Google Trends tracking
- GitHub commit activity analysis
- Sentiment scoring
- Web traffic monitoring (placeholder)

**Signal Range**: -0.5 (bearish trends) to +0.5 (bullish trends)

**Weight**: 20% in combined signal

**Usage**:
```python
from modules.alt_data_engine import AltDataEngine

engine = AltDataEngine()
signal = engine.get_signal('BTC/USDT')
```

### 3. Market Microstructure Module (`microstructure_model.py`)

**Purpose**: Analyzes order book depth and trade flow

**Components**:
- `orderbook_engine.py`: Real-time order book data
- `microstructure_model.py`: Bid/ask imbalance, large walls, CVD divergence

**Features**:
- Order book depth analysis
- Bid/ask imbalance calculation
- Large buy/sell wall detection
- Cumulative Volume Delta (CVD) divergence

**Signal Range**: -1 (bearish pressure) to +1 (bullish pressure)

**Weight**: 25% in combined signal

**Usage**:
```python
from modules.microstructure_model import MicrostructureModel

model = MicrostructureModel('binance')
signal = await model.get_signal('BTC/USDT')
```

### 4. Options Flow Module (`options_flow_engine.py`)

**Purpose**: Analyzes open interest, funding rates, and liquidations

**Components**:
- `oi_analyzer.py`: Open interest and funding rate analysis
- `options_flow_engine.py`: Combined options flow signals

**Features**:
- Perpetual funding rate tracking
- Open interest change detection
- Liquidation feed (placeholder)
- Trend strength analysis

**Signal Range**: -1 (bearish) to +1 (bullish)

**Weight**: 15% in combined signal

**Usage**:
```python
from modules.options_flow_engine import OptionsFlowEngine

engine = OptionsFlowEngine('binance')
signal = await engine.get_signal('BTC/USDT')
```

### 5. AI Volatility Predictor (`ai_volatility_predictor.py`)

**Purpose**: Predicts volatility probability using machine learning

**Features**:
- RandomForest/XGBoost model
- Multi-feature input (volatility, CVD, orderbook, funding, sentiment, trends, OI)
- Volatility probability prediction (0-1)
- Fallback heuristic model

**Signal Range**: 0 (low volatility) to 1 (high volatility)

**Weight**: 15% in combined signal (converted to -1 to +1 range)

**Usage**:
```python
from modules.ai_volatility_predictor import AIVolatilityPredictor

predictor = AIVolatilityPredictor()
features = {
    'volatility_history': 0.05,
    'cvd': 0.3,
    'orderbook_imbalance': 0.2,
    'funding_rate': 0.001,
    'sentiment': 0.1,
    'google_trends': 0.2,
    'oi_change': 0.1
}
signal = predictor.get_signal(features)
```

## Signal Combination

The `strategy_manager.py` combines all module signals with the following weights:

```python
combined_signal = (
    0.25 * speed_signal +
    0.20 * alt_data_signal +
    0.25 * microstructure_signal +
    0.15 * options_flow_signal +
    0.15 * (volatility_signal - 0.5) * 2  # Convert 0-1 to -1 to +1
)
```

**Trading Decisions**:
- `combined_signal > 0.2` → Consider LONG
- `combined_signal < -0.2` → Consider SHORT
- Otherwise → HOLD

## Enhanced Risk Management

The `risk_manager.py` now includes additional checks:

1. **Volatility Check**: Rejects trades if volatility exceeds threshold
2. **OI Collapsing Check**: Rejects trades if open interest drops >15%
3. **Sentiment Check**: Rejects trades if sentiment is strongly negative (<-0.3)

## Trade Execution Enhancements

The `trade_executor.py` now includes:

1. **Latency Measurement**: Tracks execution latency in milliseconds
2. **Speed Edge Validation**: Warns if latency exceeds 100ms
3. **Enhanced Safety Checks**: Integrates OI and sentiment data

## Configuration

### Environment Variables

```bash
# Exchange API Keys
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret
KRAKEN_API_KEY=your_kraken_api_key
KRAKEN_API_SECRET=your_kraken_api_secret

# GitHub API (for sentiment analysis)
GITHUB_TOKEN=your_github_token

# Twitter API (placeholder)
TWITTER_API_KEY=your_twitter_api_key
```

### Config File

Update `config.py` with module-specific settings:

```python
config.set('websocket_enabled', True)
config.set('volatility_threshold', 0.10)
config.set('max_oi_change', -0.15)
config.set('min_sentiment_score', -0.3)
```

## Testing

Run the test harness to verify all modules:

```bash
python tests/test_signals.py
```

This will test:
- Individual module signal generation
- Strategy manager integration
- Risk manager checks
- Trade executor functionality

## Dependencies

All required dependencies are listed in `requirements.txt`:

```
websockets          # WebSocket connections
pytrends            # Google Trends API
requests            # HTTP requests
scikit-learn        # Machine learning
numpy               # Numerical operations
pandas              # Data manipulation
```

## Usage Example

```python
import asyncio
from strategy_manager import StrategyManager
from risk_manager import RiskManager
from trade_executor import TradeExecutor

async def main():
    # Initialize managers
    strategy_mgr = StrategyManager(exchange='binance')
    risk_mgr = RiskManager()
    executor = TradeExecutor(risk_manager=risk_mgr)
    
    # Get combined signal
    signal_data = await strategy_mgr.get_combined_signal('BTC/USDT')
    
    print(f"Combined Signal: {signal_data['signal']:.3f}")
    print(f"Action: {signal_data['action']}")
    
    # Execute trade if signal is strong enough
    if signal_data['action'] != 'HOLD':
        trade_signal = {
            'pair': 'BTC/USDT',
            'action': signal_data['action'].lower(),
            'amount': 100,
            'price': 45000,
            'strategy': 'quant_alpha'
        }
        
        portfolio = {'balance': 1000}
        market_data = {'price': 45000, 'volatility': 0.03}
        
        result = executor.execute_trade(trade_signal, portfolio, market_data)
        print(f"Trade Result: {result}")

asyncio.run(main())
```

## Performance Considerations

1. **WebSocket Connections**: Modules use persistent WebSocket connections for real-time data
2. **Caching**: Some modules cache results to reduce API calls
3. **Async I/O**: All WebSocket operations are async for better performance
4. **Error Handling**: Modules gracefully handle API failures and return neutral signals

## Future Enhancements

1. **Twitter/X Integration**: Full sentiment analysis implementation
2. **Liquidation Feed**: Real-time liquidation data integration
3. **Model Training**: Automated model retraining pipeline
4. **Multi-Exchange**: Support for additional exchanges
5. **Backtesting**: Historical signal validation

## Troubleshooting

### Module Import Errors
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check Python path includes `modules/` directory

### WebSocket Connection Issues
- Verify exchange API keys are set
- Check network connectivity
- Review exchange WebSocket documentation

### API Rate Limits
- Modules include rate limiting and caching
- Consider using API keys with higher limits
- Implement request throttling if needed

## Support

For issues or questions:
1. Check module logs for error messages
2. Review test harness output
3. Verify API keys and configuration
4. Test individual modules separately

---

**Status**: ✅ All modules implemented and integrated!

