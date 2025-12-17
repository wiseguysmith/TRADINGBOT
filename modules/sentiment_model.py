"""
Sentiment Model
Analyzes sentiment from various sources (Twitter/X placeholder, GitHub activity)
"""

import logging
from typing import Dict, Optional
from datetime import datetime, timedelta
import requests
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SentimentModel:
    """Sentiment analysis model"""
    
    def __init__(self):
        self.github_token = os.getenv('GITHUB_TOKEN', '')
        self.twitter_api_key = os.getenv('TWITTER_API_KEY', '')
        self.sentiment_cache: Dict[str, Dict] = {}
        self.cache_ttl = 300  # 5 minutes
    
    def _get_github_activity(self, symbol: str) -> Optional[Dict]:
        """Get GitHub activity for crypto project"""
        if not self.github_token:
            return None
        
        # Map symbols to GitHub repos
        repo_map = {
            'BTC': 'bitcoin/bitcoin',
            'ETH': 'ethereum/go-ethereum',
            'BNB': 'bnb-chain/bsc',
            'SOL': 'solana-labs/solana',
            'ADA': 'input-output-hk/cardano-node',
            'DOT': 'paritytech/polkadot',
            'AVAX': 'ava-labs/avalanchego'
        }
        
        base_symbol = symbol.split('/')[0] if '/' in symbol else symbol
        repo = repo_map.get(base_symbol)
        
        if not repo:
            return None
        
        try:
            headers = {'Authorization': f'token {self.github_token}'} if self.github_token else {}
            url = f"https://api.github.com/repos/{repo}/commits"
            
            # Get commits from last 7 days
            since = (datetime.now() - timedelta(days=7)).isoformat()
            params = {'since': since, 'per_page': 100}
            
            response = requests.get(url, headers=headers, params=params, timeout=5)
            
            if response.status_code == 200:
                commits = response.json()
                commit_count = len(commits)
                
                # Calculate activity score
                activity_score = min(commit_count / 50.0, 1.0)  # Normalize to 0-1
                
                return {
                    'commit_count': commit_count,
                    'activity_score': activity_score,
                    'repo': repo
                }
            else:
                logger.warning(f"GitHub API returned {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting GitHub activity: {e}")
            return None
    
    def _get_twitter_sentiment(self, symbol: str) -> Optional[Dict]:
        """Get Twitter/X sentiment (placeholder)"""
        # TODO: Implement actual Twitter API integration
        # For now, return stub data
        logger.info(f"Twitter sentiment for {symbol} - placeholder implementation")
        return {
            'sentiment_score': 0.0,
            'tweet_count': 0,
            'source': 'placeholder'
        }
    
    def _get_web_traffic(self, symbol: str) -> Optional[Dict]:
        """Get web traffic data (placeholder)"""
        # TODO: Implement web traffic scraping
        logger.info(f"Web traffic for {symbol} - placeholder implementation")
        return {
            'traffic_score': 0.0,
            'source': 'placeholder'
        }
    
    def get_signal(self, symbol: str) -> float:
        """
        Get sentiment signal
        
        Returns:
            float: Signal from -0.5 (negative sentiment) to +0.5 (positive sentiment)
        """
        try:
            # Check cache
            cache_key = symbol
            if cache_key in self.sentiment_cache:
                cached = self.sentiment_cache[cache_key]
                if (datetime.now() - cached['timestamp']).seconds < self.cache_ttl:
                    return cached['signal']
            
            signal = 0.0
            weight_sum = 0.0
            
            # GitHub activity (40% weight)
            github_data = self._get_github_activity(symbol)
            if github_data:
                github_signal = (github_data['activity_score'] - 0.5) * 2  # Convert to -1 to +1
                signal += github_signal * 0.4
                weight_sum += 0.4
            
            # Twitter sentiment (30% weight)
            twitter_data = self._get_twitter_sentiment(symbol)
            if twitter_data:
                twitter_signal = twitter_data.get('sentiment_score', 0.0)
                signal += twitter_signal * 0.3
                weight_sum += 0.3
            
            # Web traffic (30% weight)
            web_data = self._get_web_traffic(symbol)
            if web_data:
                web_signal = (web_data.get('traffic_score', 0.5) - 0.5) * 2
                signal += web_signal * 0.3
                weight_sum += 0.3
            
            # Normalize if weights were applied
            if weight_sum > 0:
                signal = signal / weight_sum
            
            # Clamp to -0.5 to +0.5 range
            signal = max(-0.5, min(0.5, signal))
            
            # Cache result
            self.sentiment_cache[cache_key] = {
                'signal': signal,
                'timestamp': datetime.now()
            }
            
            return signal
            
        except Exception as e:
            logger.error(f"Error getting sentiment signal: {e}")
            return 0.0


if __name__ == '__main__':
    model = SentimentModel()
    signal = model.get_signal('BTC/USDT')
    print(f"Sentiment Signal: {signal}")

