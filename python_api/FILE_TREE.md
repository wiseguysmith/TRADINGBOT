# Python API Server - File Tree

```
python_api/
├── __init__.py
├── main.py                      # FastAPI app entry point
├── requirements.txt              # Python dependencies
├── README.md                     # Documentation
├── FILE_TREE.md                 # This file
│
├── config/
│   └── settings.py              # Configuration management
│
├── routers/
│   └── alpha_signals.py         # API route handlers
│
├── services/
│   ├── speed_service.py          # Speed edge service wrapper
│   ├── alt_data_service.py      # Alternative data service wrapper
│   ├── microstructure_service.py # Microstructure service wrapper
│   ├── options_flow_service.py  # Options flow service wrapper
│   └── volatility_service.py    # Volatility prediction service wrapper
│
├── utils/
│   ├── response_models.py        # Pydantic response models
│   └── error_handler.py          # Error handling utilities
│
└── logs/
    └── quant_api.log            # Log file (created at runtime)
```

## File Count

- **Total Files**: 13
- **Python Files**: 11
- **Documentation**: 2
- **Configuration**: 1

## Endpoints Created

1. `GET /health` - Health check
2. `GET /alpha/speed/{symbol}` - Speed edge signal
3. `GET /alpha/alt-data/{symbol}` - Alternative data signal
4. `GET /alpha/microstructure/{symbol}` - Microstructure signal
5. `GET /alpha/options-flow/{symbol}` - Options flow signal
6. `GET /alpha/volatility/{symbol}` - Volatility prediction signal
7. `GET /alpha/combined/{symbol}` - Combined signal from all modules

## Integration Points

- **Python Modules**: Imports from `/modules/` directory
- **Environment**: Reads from root `.env` file
- **TypeScript**: Exposes REST API for TypeScript backend
- **CORS**: Configured for Next.js frontend (localhost:3000, localhost:3001)

