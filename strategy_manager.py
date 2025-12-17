"""
Strategy Manager
Manages trading strategies, signal generation, and strategy blending
Integrates with the JavaScript strategy system and new alpha modules
"""

import json
import os
import sys
import asyncio
import logging
from typing import Dict, List, Optional, Any
from pathlib import Path
from datetime import datetime

# Add modules and strategies directories to path
sys.path.insert(0, str(Path(__file__).parent / 'modules'))
sys.path.insert(0, str(Path(__file__).parent / 'strategies'))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import alpha modules
try:
    from fast_market_listener import FastMarketListener
    from alt_data_engine import AltDataEngine
    from microstructure_model import MicrostructureModel
    from options_flow_engine import OptionsFlowEngine
    from ai_volatility_predictor import AIVolatilityPredictor
    MODULES_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Some alpha modules not available: {e}")
    MODULES_AVAILABLE = False

class StrategyManager:
    """Manages trading strategies and signal generation with alpha modules"""
    
    def __init__(self, strategies_dir: str = 'strategies', exchange: str = 'binance'):
        self.strategies_dir = Path(strategies_dir)
        self.strategies = {}
        self.exchange = exchange
        self.load_strategies()
        
        # Initialize alpha modules
        if MODULES_AVAILABLE:
            self.speed_module = FastMarketListener(exchange)
            self.alt_data_module = AltDataEngine()
            self.microstructure_module = MicrostructureModel(exchange)
            self.options_flow_module = OptionsFlowEngine(exchange)
            self.volatility_predictor = AIVolatilityPredictor()
        else:
            self.speed_module = None
            self.alt_data_module = None
            self.microstructure_module = None
            self.options_flow_module = None
            self.volatility_predictor = None
    
    def load_strategies(self):
        """Load all available strategies"""
        try:
            # Import Node.js strategies via subprocess or use Python equivalents
            # For now, we'll define strategy metadata
            strategy_files = [
                'conservative', 'balanced', 'aggressive', 'income',
                'momentum', 'seasonal', 'defensive', 'scalping'
            ]
            
            for strategy_name in strategy_files:
                self.strategies[strategy_name] = {
                    'name': strategy_name,
                    'loaded': True
                }
        except Exception as e:
            print(f"Error loading strategies: {e}")
    
    def get_available_strategies(self) -> List[str]:
        """Get list of available strategy names"""
        return list(self.strategies.keys())
    
    def get_strategy_metadata(self, strategy_name: str) -> Optional[Dict]:
        """Get metadata for a specific strategy"""
        if strategy_name not in self.strategies:
            return None
        
        # Call Node.js strategy router to get metadata
        try:
            import subprocess
            result = subprocess.run(
                ['node', '-e', f"""
                    const router = require('./core/strategyRouter.js');
                    const meta = router.getStrategyMetadata('{strategy_name}');
                    console.log(JSON.stringify(meta));
                """],
                capture_output=True,
                text=True,
                cwd=Path(__file__).parent
            )
            if result.returncode == 0:
                return json.loads(result.stdout)
        except Exception as e:
            print(f"Error getting strategy metadata: {e}")
        
        return self.strategies.get(strategy_name)
    
    def generate_signals(self, strategy_name: str, market_data: Dict) -> Dict:
        """Generate trading signals for a strategy"""
        try:
            import subprocess
            result = subprocess.run(
                ['node', '-e', f"""
                    const router = require('./core/strategyRouter.js');
                    const signal = router.generateSingleStrategySignals('{strategy_name}', {json.dumps(market_data)});
                    console.log(JSON.stringify(signal));
                """],
                capture_output=True,
                text=True,
                cwd=Path(__file__).parent
            )
            if result.returncode == 0:
                return json.loads(result.stdout)
        except Exception as e:
            print(f"Error generating signals: {e}")
        
        return {'action': 'hold', 'confidence': 0}
    
    def generate_blended_signals(self, strategy_blend: Dict[str, float], market_data: Dict) -> Dict:
        """Generate signals from multiple strategies with weights"""
        try:
            import subprocess
            result = subprocess.run(
                ['node', '-e', f"""
                    const router = require('./core/strategyRouter.js');
                    const signals = router.generateAggregatedSignals(
                        {json.dumps(strategy_blend)},
                        {json.dumps(market_data)}
                    );
                    console.log(JSON.stringify(signals));
                """],
                capture_output=True,
                text=True,
                cwd=Path(__file__).parent
            )
            if result.returncode == 0:
                return json.loads(result.stdout)
        except Exception as e:
            print(f"Error generating blended signals: {e}")
        
        return {'action': 'hold', 'confidence': 0, 'strategyDetails': {}}
    
    def normalize_weights(self, strategy_blend: Dict[str, float]) -> Dict[str, float]:
        """Normalize strategy weights to sum to 1.0"""
        total = sum(strategy_blend.values())
        if total == 0:
            return strategy_blend
        
        return {k: v / total for k, v in strategy_blend.items()}
    
    async def get_alpha_signals(self, symbol: str) -> Dict[str, float]:
        """Get signals from all alpha modules"""
        signals = {
            'speed': 0.0,
            'alt_data': 0.0,
            'microstructure': 0.0,
            'options_flow': 0.0,
            'volatility': 0.5  # Default neutral volatility
        }
        
        if not MODULES_AVAILABLE:
            logger.warning("Alpha modules not available, returning zero signals")
            return signals
        
        try:
            # Speed Edge Module (25% weight)
            if self.speed_module:
                signals['speed'] = await self.speed_module.get_signal(symbol)
            
            # Alternative Data Engine (20% weight)
            if self.alt_data_module:
                signals['alt_data'] = self.alt_data_module.get_signal(symbol)
            
            # Microstructure Model (25% weight)
            if self.microstructure_module:
                signals['microstructure'] = await self.microstructure_module.get_signal(symbol)
            
            # Options Flow Engine (15% weight)
            if self.options_flow_module:
                signals['options_flow'] = await self.options_flow_module.get_signal(symbol)
            
            # AI Volatility Predictor (15% weight)
            if self.volatility_predictor:
                # Build feature dictionary for volatility predictor
                feature_dict = {
                    'volatility_history': abs(signals['speed']) * 0.05,  # Approximate
                    'cvd': signals['microstructure'],
                    'orderbook_imbalance': signals['microstructure'],
                    'funding_rate': 0.001,  # Would get from options flow
                    'sentiment': signals['alt_data'],
                    'google_trends': signals['alt_data'],
                    'oi_change': signals['options_flow']
                }
                signals['volatility'] = self.volatility_predictor.get_signal(feature_dict)
            
        except Exception as e:
            logger.error(f"Error getting alpha signals: {e}")
        
        return signals
    
    async def get_combined_signal(self, symbol: str) -> Dict[str, Any]:
        """
        Get combined signal from all alpha modules
        
        Returns:
            Dict with 'signal' (float), 'action' (str), and module breakdown
        """
        try:
            # Get signals from all modules
            alpha_signals = await self.get_alpha_signals(symbol)
            
            # Combine with weights
            combined_signal = (
                0.25 * alpha_signals['speed'] +
                0.20 * alpha_signals['alt_data'] +
                0.25 * alpha_signals['microstructure'] +
                0.15 * alpha_signals['options_flow'] +
                0.15 * (alpha_signals['volatility'] - 0.5) * 2  # Convert 0-1 to -1 to +1
            )
            
            # Determine action
            if combined_signal > 0.2:
                action = 'LONG'
            elif combined_signal < -0.2:
                action = 'SHORT'
            else:
                action = 'HOLD'
            
            return {
                'signal': combined_signal,
                'action': action,
                'confidence': abs(combined_signal),
                'module_signals': alpha_signals,
                'timestamp': json.dumps(datetime.now().isoformat())
            }
            
        except Exception as e:
            logger.error(f"Error getting combined signal: {e}")
            return {
                'signal': 0.0,
                'action': 'HOLD',
                'confidence': 0.0,
                'module_signals': {},
                'error': str(e)
            }


if __name__ == '__main__':
    async def test():
        # Test the strategy manager
        manager = StrategyManager()
        print("Available strategies:", manager.get_available_strategies())
        
        # Test alpha modules
        print("\nTesting alpha modules...")
        combined = await manager.get_combined_signal('BTC/USDT')
        print(f"\nCombined Signal: {combined['signal']:.3f}")
        print(f"Action: {combined['action']}")
        print(f"Module Signals: {combined['module_signals']}")
        
        # Test traditional strategy
        market_data = {
            'price': 45000,
            'rsi': 35,
            'volatility': 0.03
        }
        signal = manager.generate_signals('conservative', market_data)
        print("\nConservative strategy signal:", signal)
    
    asyncio.run(test())

