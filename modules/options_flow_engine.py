"""
Options Flow Engine
Combines open interest, funding rates, and liquidations
"""

import asyncio
import logging
from typing import Dict, Optional
from oi_analyzer import OIAnalyzer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OptionsFlowEngine:
    """Options flow analysis engine"""
    
    def __init__(self, exchange: str = 'binance'):
        self.oi_analyzer = OIAnalyzer(exchange)
        self.exchange = exchange
    
    async def get_signal(self, symbol: str) -> float:
        """
        Get options flow signal
        
        Returns:
            float: Signal from -1 (bearish) to +1 (bullish)
        """
        try:
            # Get signal from OI analyzer (which includes funding rates)
            signal = await self.oi_analyzer.get_signal(symbol)
            
            # TODO: Add liquidation analysis when implemented
            # liquidations = self.oi_analyzer._get_liquidations(symbol)
            # if liquidations:
            #     if liquidations['long_liquidations'] > liquidations['short_liquidations']:
            #         signal -= 0.1  # More long liquidations = bearish
            #     else:
            #         signal += 0.1  # More short liquidations = bullish
            
            logger.info(f"Options Flow Signal for {symbol}: {signal:.3f}")
            
            return signal
            
        except Exception as e:
            logger.error(f"Error getting options flow signal: {e}")
            return 0.0


if __name__ == '__main__':
    async def test():
        engine = OptionsFlowEngine('binance')
        signal = await engine.get_signal('BTC/USDT')
        print(f"Options Flow Signal: {signal}")
    
    asyncio.run(test())

