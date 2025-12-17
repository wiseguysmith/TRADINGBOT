"""
Trade Executor
Executes trades, manages orders, and handles order lifecycle
Integrates with exchange APIs and risk management
"""

import json
import os
import time
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OrderStatus(Enum):
    PENDING = "pending"
    OPEN = "open"
    FILLED = "filled"
    PARTIALLY_FILLED = "partially_filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"

class OrderType(Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP_LOSS = "stop_loss"
    TAKE_PROFIT = "take_profit"

class TradeExecutor:
    """Executes trades and manages order lifecycle"""
    
    def __init__(self, exchange_client=None, risk_manager=None):
        self.exchange_client = exchange_client
        self.risk_manager = risk_manager
        self.active_orders = {}
        self.order_history = []
        self.positions = {}
    
    def execute_trade(self, trade_signal: Dict, portfolio: Dict, market_data: Dict,
                     oi_data: Optional[Dict] = None, sentiment_data: Optional[Dict] = None) -> Dict:
        """Execute a trade based on signal"""
        try:
            # Measure execution latency (speed edge check)
            execution_start = time.time()
            
            # Run safety checks if risk manager is available
            if self.risk_manager:
                checks = self.risk_manager.run_safety_checks(
                    trade_signal, portfolio, market_data, oi_data, sentiment_data
                )
                if not checks['allowed']:
                    return {
                        'success': False,
                        'error': 'Safety checks failed',
                        'details': checks['errors'],
                        'warnings': checks['warnings']
                    }
                
                # Use adjusted trade if provided
                if checks.get('adjusted_trade'):
                    trade_signal = checks['adjusted_trade']
            
            # Create order
            order = self.create_order(trade_signal, market_data)
            
            # Execute order (mock for now, integrate with real exchange)
            if self.exchange_client:
                result = self._execute_on_exchange(order)
            else:
                result = self._mock_execute(order)
            
            # Measure execution latency
            execution_latency_ms = (time.time() - execution_start) * 1000
            
            # Check if speed edge is working (latency should be < 100ms)
            if execution_latency_ms > 100:
                logger.warning(f"High execution latency: {execution_latency_ms:.2f}ms")
            
            # Record order with latency
            order['execution_latency_ms'] = execution_latency_ms
            self.active_orders[order['id']] = order
            self.order_history.append(order)
            
            # Update positions
            self._update_positions(order)
            
            return {
                'success': True,
                'order': order,
                'message': f"Trade executed: {order['type']} {order['amount']} {order['pair']}",
                'execution_latency_ms': execution_latency_ms
            }
            
        except Exception as e:
            logger.error(f"Error executing trade: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_order(self, trade_signal: Dict, market_data: Dict) -> Dict:
        """Create an order from trade signal"""
        order_id = f"order_{int(time.time() * 1000)}"
        
        order = {
            'id': order_id,
            'pair': trade_signal.get('pair', 'BTC/USD'),
            'type': trade_signal.get('action', 'buy').upper(),
            'order_type': OrderType.MARKET.value,
            'amount': trade_signal.get('amount', 0),
            'price': market_data.get('price', trade_signal.get('price', 0)),
            'status': OrderStatus.PENDING.value,
            'timestamp': datetime.now().isoformat(),
            'strategy': trade_signal.get('strategy', 'unknown'),
            'stop_loss': trade_signal.get('stopLoss'),
            'take_profit': trade_signal.get('takeProfit'),
            'confidence': trade_signal.get('confidence', 0)
        }
        
        return order
    
    def _execute_on_exchange(self, order: Dict) -> Dict:
        """Execute order on real exchange"""
        # TODO: Integrate with actual exchange API
        # This would call exchange_client.place_order(order)
        return {'status': 'filled', 'filled_price': order['price']}
    
    def _mock_execute(self, order: Dict) -> Dict:
        """Mock order execution for testing"""
        order['status'] = OrderStatus.FILLED.value
        order['filled_price'] = order['price']
        order['filled_at'] = datetime.now().isoformat()
        return {'status': 'filled', 'filled_price': order['price']}
    
    def _update_positions(self, order: Dict):
        """Update position tracking"""
        pair = order['pair']
        if pair not in self.positions:
            self.positions[pair] = {
                'size': 0,
                'entry_price': 0,
                'total_cost': 0
            }
        
        position = self.positions[pair]
        
        if order['type'] == 'BUY':
            # Add to position
            new_size = order['amount'] / order['filled_price']
            total_cost = position['total_cost'] + order['amount']
            total_size = position['size'] + new_size
            
            position['size'] = total_size
            position['entry_price'] = total_cost / total_size if total_size > 0 else 0
            position['total_cost'] = total_cost
        elif order['type'] == 'SELL':
            # Reduce position
            sell_size = order['amount'] / order['filled_price']
            position['size'] = max(0, position['size'] - sell_size)
            if position['size'] == 0:
                position['entry_price'] = 0
                position['total_cost'] = 0
    
    def cancel_order(self, order_id: str) -> Dict:
        """Cancel an active order"""
        if order_id not in self.active_orders:
            return {'success': False, 'error': 'Order not found'}
        
        order = self.active_orders[order_id]
        order['status'] = OrderStatus.CANCELLED.value
        order['cancelled_at'] = datetime.now().isoformat()
        
        del self.active_orders[order_id]
        
        return {'success': True, 'order': order}
    
    def get_active_orders(self) -> List[Dict]:
        """Get all active orders"""
        return list(self.active_orders.values())
    
    def get_positions(self) -> Dict:
        """Get all current positions"""
        return self.positions.copy()
    
    def check_stop_loss_take_profit(self, market_data: Dict) -> List[Dict]:
        """Check if stop loss or take profit should be triggered"""
        triggered_orders = []
        
        for order_id, order in list(self.active_orders.items()):
            if order['status'] != OrderStatus.FILLED.value:
                continue
            
            current_price = market_data.get('price', 0)
            filled_price = order.get('filled_price', order['price'])
            
            # Check stop loss
            if order.get('stop_loss') and current_price <= order['stop_loss']:
                sell_order = self.create_order({
                    'pair': order['pair'],
                    'action': 'sell',
                    'amount': order['amount'],
                    'price': current_price,
                    'strategy': order['strategy'],
                    'reason': 'Stop loss triggered'
                }, market_data)
                triggered_orders.append(sell_order)
            
            # Check take profit
            elif order.get('take_profit') and current_price >= order['take_profit']:
                sell_order = self.create_order({
                    'pair': order['pair'],
                    'action': 'sell',
                    'amount': order['amount'],
                    'price': current_price,
                    'strategy': order['strategy'],
                    'reason': 'Take profit triggered'
                }, market_data)
                triggered_orders.append(sell_order)
        
        return triggered_orders


if __name__ == '__main__':
    # Test the trade executor
    executor = TradeExecutor()
    
    trade_signal = {
        'pair': 'BTC/USD',
        'action': 'buy',
        'amount': 100,
        'price': 45000,
        'strategy': 'conservative',
        'stopLoss': 43000,
        'takeProfit': 47000,
        'confidence': 0.75
    }
    
    portfolio = {'balance': 1000}
    market_data = {'price': 45000}
    
    result = executor.execute_trade(trade_signal, portfolio, market_data)
    print("Trade execution result:", json.dumps(result, indent=2))
    
    print("\nActive orders:", len(executor.get_active_orders()))
    print("Positions:", json.dumps(executor.get_positions(), indent=2))

