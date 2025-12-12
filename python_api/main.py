"""
AutoBread Quant API Server
FastAPI server exposing Python quant modules as REST API endpoints
"""

import logging
import sys
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime

from routers import alpha_signals, signals
from config.settings import settings
from utils.error_handler import handle_exception, QuantAPIError

# Setup logging
log_file = Path(settings.LOG_FILE)
log_file.parent.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description="REST API for AutoBread quant trading modules"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(alpha_signals.router)
app.include_router(signals.router)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": exc.__class__.__name__,
            "message": str(exc),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "path": str(request.url)
        }
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": settings.API_TITLE,
        "version": settings.API_VERSION
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.API_TITLE,
        "version": settings.API_VERSION,
        "endpoints": {
            "health": "/health",
            "signals": "POST /signals",
            "speed": "/alpha/speed/{symbol}",
            "alt_data": "/alpha/alt-data/{symbol}",
            "microstructure": "/alpha/microstructure/{symbol}",
            "options_flow": "/alpha/options-flow/{symbol}",
            "volatility": "/alpha/volatility/{symbol}",
            "combined": "/alpha/combined/{symbol}"
        },
        "docs": "/docs"
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    logger.info("=" * 60)
    logger.info("Quant API Server running...")
    logger.info(f"Version: {settings.API_VERSION}")
    logger.info(f"Host: {settings.API_HOST}")
    logger.info(f"Port: {settings.API_PORT}")
    logger.info(f"Log Level: {settings.LOG_LEVEL}")
    logger.info(f"External Data Enabled: {settings.EXTERNAL_DATA_ENABLED}")
    logger.info(f"Google Trends Enabled: {settings.GOOGLE_TRENDS_ENABLED}")
    logger.info("=" * 60)

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler"""
    logger.info("Quant API Server shutting down...")

if __name__ == "__main__":
    import uvicorn
    print("Quant API Server running...")
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        log_level=settings.LOG_LEVEL.lower(),
        reload=True
    )

