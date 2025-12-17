"""
Risk Manager
Manages risk limits, position sizing, and safety checks
Integrates with the JavaScript safety engine
"""

import json
import os
from typing import Dict, Optional, Any
from datetime import datetime, timedelta
from pathlib import Path

class RiskManager:
    """Manages trading risk and safety limits"""
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self.default_config()
        self.daily_stats = {
            'trades': 0,
            'loss': 0.0,
            'start_balance': None,
            'last_reset': datetime.now()
        }
        self.is_trading_paused = False
        self.pause_reason = None
    
    def default_config(self) -> Dict:
        """Default risk configuration"""
        return {
            'max_daily_trades': 50,
            'max_daily_loss_percentage': 0.25,  # 25%
            'max_position_size_percentage': 0.30,  # 30%
            'volatility_threshold': 0.10,  # 10%
            'stop_trading_on_loss': True
        }
    
    def reset_daily_stats(self, start_balance: float):
        """Reset daily statistics"""
        self.daily_stats = {
            'trades': 0,
            'loss': 0.0,
            'start_balance': start_balance,
            'last_reset': datetime.now()
        }
        self.is_trading_paused = False
        self.pause_reason = None
    
    def check_daily_reset(self) -> bool:
        """Check if we should reset daily stats (new day)"""
        now = datetime.now()
        last_reset = self.daily_stats['last_reset']
        
        if isinstance(last_reset, str):
            last_reset = datetime.fromisoformat(last_reset)
        
        return (now.date() != last_reset.date() or
                now.month != last_reset.month or
                now.year != last_reset.year)
    
    def run_safety_checks(self, trade: Dict, portfolio: Dict, market_data: Optional[Dict] = None, 
                         oi_data: Optional[Dict] = None, sentiment_data: Optional[Dict] = None) -> Dict:
        """Run safety checks before executing a trade"""
        checks = {
            'allowed': True,
            'warnings': [],
            'errors': [],
            'adjusted_trade': trade.copy()
        }
        
        market_data = market_data or {}
        
        # Check if trading is paused
        if self.is_trading_paused:
            checks['allowed'] = False
            checks['errors'].append(f"Trading is paused: {self.pause_reason}")
            return checks
        
        # Check daily reset
        if self.check_daily_reset() and portfolio.get('balance'):
            self.reset_daily_stats(portfolio['balance'])
        
        # Check max daily trades
        if self.daily_stats['trades'] >= self.config['max_daily_trades']:
            checks['allowed'] = False
            checks['errors'].append(f"Daily trade limit reached: {self.config['max_daily_trades']} trades")
            return checks
        
        # Check position size
        balance = portfolio.get('balance', 1)
        position_size_percentage = trade.get('amount', 0) / balance if balance > 0 else 0
        
        if position_size_percentage > self.config['max_position_size_percentage']:
            checks['allowed'] = False
            checks['errors'].append(
                f"Position size {position_size_percentage*100:.2f}% exceeds maximum "
                f"{self.config['max_position_size_percentage']*100:.2f}%"
            )
            checks['adjusted_trade']['amount'] = balance * self.config['max_position_size_percentage']
            checks['warnings'].append(f"Suggested position size: ${checks['adjusted_trade']['amount']:.2f}")
        
        # Check daily loss limit
        if self.daily_stats['start_balance']:
            current_loss = max(0, self.daily_stats['start_balance'] - balance)
            loss_percentage = current_loss / self.daily_stats['start_balance']
            
            if loss_percentage >= self.config['max_daily_loss_percentage']:
                checks['allowed'] = False
                checks['errors'].append(f"Daily loss limit reached: {loss_percentage*100:.2f}%")
                
                if self.config['stop_trading_on_loss']:
                    self.is_trading_paused = True
                    self.pause_reason = f"Daily loss limit exceeded: {loss_percentage*100:.2f}%"
                return checks
            
            # Warn if approaching loss limit
            if loss_percentage > self.config['max_daily_loss_percentage'] * 0.8:
                checks['warnings'].append(f"Approaching daily loss limit: {loss_percentage*100:.2f}%")
        
        # Check volatility threshold
        volatility = market_data.get('volatility', 0) if market_data else 0
        if volatility > self.config['volatility_threshold']:
            checks['allowed'] = False
            checks['errors'].append(
                f"Volatility {volatility*100:.2f}% exceeds threshold "
                f"{self.config['volatility_threshold']*100:.2f}%"
            )
            return checks
        elif volatility > self.config['volatility_threshold'] * 0.7:
            checks['warnings'].append(f"High volatility detected: {volatility*100:.2f}%")
        
        # Check OI collapsing (new check)
        if oi_data and 'oi_change' in oi_data:
            oi_change = oi_data['oi_change']
            if oi_change < -0.15:  # OI dropping more than 15%
                checks['allowed'] = False
                checks['errors'].append(f"Open interest collapsing: {oi_change*100:.2f}%")
                return checks
            elif oi_change < -0.10:
                checks['warnings'].append(f"Open interest declining: {oi_change*100:.2f}%")
        
        # Check negative sentiment dominance (new check)
        if sentiment_data and 'sentiment_score' in sentiment_data:
            sentiment = sentiment_data['sentiment_score']
            if sentiment < -0.3:  # Strongly negative sentiment
                checks['allowed'] = False
                checks['errors'].append(f"Negative sentiment dominance: {sentiment:.2f}")
                return checks
            elif sentiment < -0.2:
                checks['warnings'].append(f"Negative sentiment detected: {sentiment:.2f}")
        
        # Check portfolio balance
        if balance <= 0:
            checks['allowed'] = False
            checks['errors'].append('Portfolio balance is zero or negative')
            return checks
        
        # Check if trade amount exceeds balance
        if trade.get('amount', 0) > balance:
            checks['allowed'] = False
            checks['errors'].append(f"Trade amount ${trade.get('amount', 0)} exceeds balance ${balance}")
            checks['adjusted_trade']['amount'] = balance * 0.95
            checks['warnings'].append(f"Suggested trade amount: ${checks['adjusted_trade']['amount']:.2f}")
        
        return checks
    
    def record_trade(self, trade: Dict, profit_loss: float):
        """Record a completed trade"""
        self.daily_stats['trades'] += 1
        
        if profit_loss < 0:
            self.daily_stats['loss'] += abs(profit_loss)
        
        # Check if we should pause trading after recording loss
        if self.config['stop_trading_on_loss'] and self.daily_stats['start_balance']:
            loss_percentage = self.daily_stats['loss'] / self.daily_stats['start_balance']
            if loss_percentage >= self.config['max_daily_loss_percentage']:
                self.is_trading_paused = True
                self.pause_reason = f"Daily loss limit exceeded: {loss_percentage*100:.2f}%"
    
    def get_status(self) -> Dict:
        """Get current risk manager status"""
        return {
            'is_trading_paused': self.is_trading_paused,
            'pause_reason': self.pause_reason,
            'daily_stats': {
                **self.daily_stats,
                'last_reset': self.daily_stats['last_reset'].isoformat() 
                    if isinstance(self.daily_stats['last_reset'], datetime) 
                    else self.daily_stats['last_reset']
            },
            'limits': self.config
        }
    
    def pause_trading(self, reason: str = 'Manual pause'):
        """Manually pause trading"""
        self.is_trading_paused = True
        self.pause_reason = reason
    
    def resume_trading(self):
        """Resume trading"""
        self.is_trading_paused = False
        self.pause_reason = None


if __name__ == '__main__':
    # Test the risk manager
    manager = RiskManager()
    
    portfolio = {'balance': 1000.0}
    trade = {'amount': 100, 'price': 45000, 'type': 'BUY'}
    market_data = {'volatility': 0.05}
    
    checks = manager.run_safety_checks(trade, portfolio, market_data)
    print("Safety checks:", json.dumps(checks, indent=2))
    
    status = manager.get_status()
    print("\nRisk manager status:", json.dumps(status, indent=2, default=str))

