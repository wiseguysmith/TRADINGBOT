"""
AI Volatility Predictor
Uses machine learning to predict volatility probability
"""

import logging
import numpy as np
from typing import Dict, Optional, List
from datetime import datetime
import pickle
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from sklearn.ensemble import RandomForestRegressor
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logger.warning("scikit-learn not available, using simplified model")

class AIVolatilityPredictor:
    """AI-based volatility prediction model"""
    
    def __init__(self):
        self.model = None
        self.is_trained = False
        self.model_path = 'models/volatility_predictor.pkl'
        self.feature_names = [
            'volatility_history',
            'cvd',
            'orderbook_imbalance',
            'funding_rate',
            'sentiment',
            'google_trends',
            'oi_change'
        ]
        
        if SKLEARN_AVAILABLE:
            self.model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
        else:
            logger.warning("Using simplified linear model (install scikit-learn for better performance)")
    
    def _create_features(self, feature_dict: Dict) -> np.ndarray:
        """Create feature vector from input dictionary"""
        features = []
        
        for name in self.feature_names:
            value = feature_dict.get(name, 0.0)
            # Normalize features
            if name == 'volatility_history':
                value = min(value, 0.1) / 0.1  # Normalize to 0-1
            elif name == 'funding_rate':
                value = (value + 0.01) / 0.02  # Normalize funding rate
            elif name in ['cvd', 'orderbook_imbalance', 'sentiment', 'google_trends', 'oi_change']:
                value = (value + 1) / 2  # Normalize -1 to +1 range to 0-1
            
            features.append(float(value))
        
        return np.array(features).reshape(1, -1)
    
    def train(self, X: List[Dict], y: List[float]):
        """Train the model"""
        if not SKLEARN_AVAILABLE:
            logger.warning("Cannot train model without scikit-learn")
            return
        
        try:
            # Convert to feature matrix
            X_features = np.array([self._create_features(x).flatten() for x in X])
            y_array = np.array(y)
            
            # Train model
            self.model.fit(X_features, y_array)
            self.is_trained = True
            
            logger.info(f"Model trained on {len(X)} samples")
            
            # Save model
            os.makedirs('models', exist_ok=True)
            with open(self.model_path, 'wb') as f:
                pickle.dump(self.model, f)
                
        except Exception as e:
            logger.error(f"Error training model: {e}")
    
    def load_model(self):
        """Load trained model"""
        if not SKLEARN_AVAILABLE:
            return
        
        try:
            if os.path.exists(self.model_path):
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                self.is_trained = True
                logger.info("Model loaded from file")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
    
    def predict(self, feature_dict: Dict) -> float:
        """Predict volatility probability"""
        try:
            if SKLEARN_AVAILABLE and self.is_trained and self.model:
                features = self._create_features(feature_dict)
                prediction = self.model.predict(features)[0]
                return float(np.clip(prediction, 0.0, 1.0))
            else:
                # Fallback: simple heuristic
                return self._heuristic_prediction(feature_dict)
                
        except Exception as e:
            logger.error(f"Error predicting volatility: {e}")
            return self._heuristic_prediction(feature_dict)
    
    def _heuristic_prediction(self, feature_dict: Dict) -> float:
        """Heuristic volatility prediction (fallback)"""
        volatility = feature_dict.get('volatility_history', 0.0)
        cvd = abs(feature_dict.get('cvd', 0.0))
        imbalance = abs(feature_dict.get('orderbook_imbalance', 0.0))
        
        # Simple weighted combination
        vol_prob = min(volatility / 0.1, 1.0)  # Normalize to 0-1
        activity_prob = (cvd + imbalance) / 2
        
        # Combine probabilities
        combined = (vol_prob * 0.6) + (activity_prob * 0.4)
        
        return float(np.clip(combined, 0.0, 1.0))
    
    def get_signal(self, feature_dict: Dict) -> float:
        """
        Get volatility probability signal
        
        Returns:
            float: Volatility probability from 0 (low volatility) to 1 (high volatility)
        """
        try:
            # Load model if not loaded
            if not self.is_trained:
                self.load_model()
            
            # Predict volatility probability
            vol_prob = self.predict(feature_dict)
            
            logger.info(f"Volatility Probability: {vol_prob:.3f}")
            
            return vol_prob
            
        except Exception as e:
            logger.error(f"Error getting volatility signal: {e}")
            return 0.5  # Neutral probability


if __name__ == '__main__':
    predictor = AIVolatilityPredictor()
    
    # Example feature dictionary
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
    print(f"Volatility Probability: {signal}")

