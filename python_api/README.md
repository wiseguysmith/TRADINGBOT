# AutoBread Quant API Server

FastAPI server exposing Python quant modules as REST API endpoints for TypeScript backend integration.

## Quick Start

### 1. Install Dependencies

```bash
cd python_api
pip install -r requirements.txt
```

### 2. Configure Environment

Ensure your root `.env` file includes:

```env
# Quant API Configuration
QUANT_API_HOST=0.0.0.0
QUANT_API_PORT=8000
LOG_LEVEL=INFO

# External Data
EXTERNAL_DATA_ENABLED=true
GOOGLE_TRENDS_ENABLED=true
GITHUB_API_KEY=your_github_key_here

# Trading
KRAKEN_PAIR_DEFAULT=BTC/USDT
DEFAULT_EXCHANGE=binance

# CORS (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Module Weights (optional, defaults shown)
WEIGHT_SPEED=0.25
WEIGHT_ALT_DATA=0.20
WEIGHT_MICROSTRUCTURE=0.25
WEIGHT_OPTIONS_FLOW=0.15
WEIGHT_VOLATILITY=0.15
```

### 3. Run Server

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### Health Check
```
GET /health
```

### Individual Signals
```
GET /alpha/speed/{symbol}
GET /alpha/alt-data/{symbol}
GET /alpha/microstructure/{symbol}
GET /alpha/options-flow/{symbol}
GET /alpha/volatility/{symbol}
```

### Combined Signal
```
GET /alpha/combined/{symbol}
```

## Example Usage

### Get Speed Signal
```bash
curl http://localhost:8000/alpha/speed/BTCUSDT
```

### Get Combined Signal
```bash
curl http://localhost:8000/alpha/combined/BTCUSDT
```

### Get Volatility Signal with Features
```bash
curl "http://localhost:8000/alpha/volatility/BTCUSDT?volatility_history=0.05&cvd=1000&funding_rate=0.0001"
```

## Response Format

All endpoints return standardized JSON:

```json
{
  "symbol": "BTCUSDT",
  "timestamp": "2024-12-19T14:55:00Z",
  "signal": 0.42,
  "components": {
    "speed": 0.25
  },
  "metadata": {
    "module": "fast_market_listener",
    "exchange": "binance",
    "signal_range": "[-1, 1]"
  }
}
```

## Combined Signal

The combined endpoint calls all modules asynchronously and weights them:

- Speed: 25%
- Alt Data: 20%
- Microstructure: 25%
- Options Flow: 15%
- Volatility: 15%

## Logging

Logs are written to:
- Console (stdout)
- File: `python_api/logs/quant_api.log`

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Architecture

```
python_api/
├── main.py                 # FastAPI app entry point
├── routers/
│   └── alpha_signals.py   # API route handlers
├── services/
│   ├── speed_service.py
│   ├── alt_data_service.py
│   ├── microstructure_service.py
│   ├── options_flow_service.py
│   └── volatility_service.py
├── utils/
│   ├── response_models.py  # Pydantic models
│   └── error_handler.py    # Error handling
└── config/
    └── settings.py         # Configuration
```

## Integration with TypeScript

The TypeScript backend can now call these endpoints:

```typescript
const response = await fetch('http://localhost:8000/alpha/combined/BTCUSDT');
const data = await response.json();
console.log('Combined Signal:', data.signal);
```

