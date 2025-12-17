"""
WebSocket Integration Example
Demonstrates how to use WebSocket price feeds with trading system
"""

import asyncio
import json
from websocket_price_feed import WebSocketPriceFeed, ExchangeType
from strategy_manager import StrategyManager
from risk_manager import RiskManager
from trade_executor import TradeExecutor

class TradingBotWithWebSocket:
    """Trading bot integrated with WebSocket price feeds"""
    
    def __init__(self):
        self.price_feed = WebSocketPriceFeed(ExchangeType.KRAKEN)
        self.strategy_manager = StrategyManager()
        self.risk_manager = RiskManager()
        self.trade_executor = TradeExecutor(risk_manager=self.risk_manager)
        self.portfolio = {'balance': 1000.0}
        self.running = False
    
    async def on_price_update(self, pair: str, price_data: dict):
        """Handle price update from WebSocket"""
        print(f"\n📊 Price update for {pair}: ${price_data['price']:.2f}")
        
        # Generate trading signals
        market_data = {
            'price': price_data['price'],
            'volume': price_data['volume'],
            'volatility': 0.03,  # Would calculate from historical data
            'rsi': 45  # Would calculate from historical data
        }
        
        # Use conservative strategy
        signal = self.strategy_manager.generate_signals('conservative', market_data)
        
        if signal.get('action') != 'hold':
            print(f"🎯 Signal: {signal['action']} with {signal.get('confidence', 0)*100:.1f}% confidence")
            
            # Create trade
            trade = {
                'pair': pair,
                'action': signal['action'],
                'amount': self.portfolio['balance'] * signal.get('positionSize', 0.05),
                'price': price_data['price'],
                'strategy': 'conservative',
                'stopLoss': price_data['price'] * (1 - signal.get('stopLoss', 0.02)),
                'takeProfit': price_data['price'] * (1 + signal.get('takeProfit', 0.04)),
                'confidence': signal.get('confidence', 0)
            }
            
            # Execute trade
            result = self.trade_executor.execute_trade(trade, self.portfolio, market_data)
            
            if result.get('success'):
                print(f"✅ Trade executed: {result['message']}")
                # Update portfolio
                if trade['action'] == 'buy':
                    self.portfolio['balance'] -= trade['amount']
                else:
                    self.portfolio['balance'] += trade['amount']
            else:
                print(f"❌ Trade rejected: {result.get('error')}")
    
    async def start(self, pairs: list):
        """Start the trading bot"""
        self.running = True
        
        # Register price update callback
        for pair in pairs:
            self.price_feed.register_callback(pair, self.on_price_update)
        
        # Connect to WebSocket
        await self.price_feed.connect(pairs)
        
        # Start listening
        print(f"🚀 Trading bot started, monitoring {pairs}")
        print(f"💰 Initial balance: ${self.portfolio['balance']:.2f}")
        
        await self.price_feed.listen()
    
    async def stop(self):
        """Stop the trading bot"""
        self.running = False
        await self.price_feed.disconnect()
        print("🛑 Trading bot stopped")


async def main():
    """Main function"""
    bot = TradingBotWithWebSocket()
    
    try:
        # Start bot with BTC/USD pair
        await bot.start(['BTC/USD'])
    except KeyboardInterrupt:
        print("\n⏹️  Stopping bot...")
        await bot.stop()


if __name__ == '__main__':
    asyncio.run(main())

