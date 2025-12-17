"""
Configuration settings for Quant API Server
Loads environment variables from root .env file (unified config)
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from typing import Optional

# Load environment variables from root .env file (same as TypeScript)
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class Settings:
    """Application settings"""
    
    # API Configuration
    API_HOST: str = os.getenv("QUANT_API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("QUANT_API_PORT", "8000"))
    API_TITLE: str = "AutoBread Quant API"
    API_VERSION: str = "1.0.0"
    
    # External Data Configuration
    EXTERNAL_DATA_ENABLED: bool = os.getenv("EXTERNAL_DATA_ENABLED", "true").lower() == "true"
    GOOGLE_TRENDS_ENABLED: bool = os.getenv("GOOGLE_TRENDS_ENABLED", "true").lower() == "true"
    
    # API Keys
    GITHUB_API_KEY: Optional[str] = os.getenv("GITHUB_API_KEY")
    
    # Trading Configuration
    KRAKEN_PAIR_DEFAULT: str = os.getenv("KRAKEN_PAIR_DEFAULT", "BTC/USDT")
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = os.getenv("LOG_FILE", "python_api/logs/quant_api.log")
    
    # CORS
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")
    
    # Module Weights (for combined signal)
    WEIGHT_SPEED: float = float(os.getenv("WEIGHT_SPEED", "0.25"))
    WEIGHT_ALT_DATA: float = float(os.getenv("WEIGHT_ALT_DATA", "0.20"))
    WEIGHT_MICROSTRUCTURE: float = float(os.getenv("WEIGHT_MICROSTRUCTURE", "0.25"))
    WEIGHT_OPTIONS_FLOW: float = float(os.getenv("WEIGHT_OPTIONS_FLOW", "0.15"))
    WEIGHT_VOLATILITY: float = float(os.getenv("WEIGHT_VOLATILITY", "0.15"))
    
    # Exchange Configuration
    DEFAULT_EXCHANGE: str = os.getenv("DEFAULT_EXCHANGE", "binance")
    
    @property
    def module_weights(self) -> dict:
        """Get module weights as dictionary"""
        return {
            "speed": self.WEIGHT_SPEED,
            "alt_data": self.WEIGHT_ALT_DATA,
            "microstructure": self.WEIGHT_MICROSTRUCTURE,
            "options_flow": self.WEIGHT_OPTIONS_FLOW,
            "volatility": self.WEIGHT_VOLATILITY
        }

# Global settings instance
settings = Settings()

