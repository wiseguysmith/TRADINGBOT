import axios from 'axios';
import crypto from 'crypto';
import { Balance, Ticker } from '../types/index';
import { CONFIG } from '../config';

interface KrakenOHLCResponse {
  error: string[];
  result: {
    [key: string]: [number, string, string, string, string, string, string, number][];
  };
}

export class KrakenWrapper {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string = 'https://api.kraken.com';

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  private async makePublicRequest(endpoint: string, params: any = {}) {
    try {
      const response = await axios.get(`${this.baseUrl}/0/public/${endpoint}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error making public request to ${endpoint}:`, error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Status:', error.response?.status);
        console.error('URL:', error.config?.url);
      }
      return { error: ['API request failed'], result: {} };
    }
  }

  private async makePrivateRequest(endpoint: string, data: any = {}) {
    try {
      const nonce = Date.now().toString();
      const path = `/0/private/${endpoint}`;
      
      // Create signature
      const postData = new URLSearchParams({
        nonce,
        ...data
      }).toString();

      const signature = crypto
        .createHmac('sha512', Buffer.from(this.apiSecret, 'base64'))
        .update(path + postData)
        .digest('base64');

      const response = await axios.post(`${this.baseUrl}/0/private/${endpoint}`, postData, {
        headers: {
          'API-Key': this.apiKey,
          'API-Sign': signature
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Error making private request to ${endpoint}:`, error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Status:', error.response?.status);
        console.error('URL:', error.config?.url);
      }
      return { error: ['API request failed'], result: {} };
    }
  }

  async getOHLCData(symbol: string, interval: number = 1): Promise<KrakenOHLCResponse> {
    return this.makePublicRequest('OHLC', { pair: symbol, interval });
  }



  async getTradablePairs() {
    return this.makePublicRequest('AssetPairs');
  }

  async getTickerInformation(pairs: string[]) {
    return this.makePublicRequest('Ticker', { pair: pairs.join(',') });
  }

  async addOrder(orderData: {
    pair: string;
    type: 'buy' | 'sell';
    ordertype: 'market' | 'limit';
    volume: string;
    price?: string;
  }) {
    return this.makePrivateRequest('AddOrder', orderData);
  }

  async getOrderStatus(txid: string) {
    return this.makePrivateRequest('QueryOrders', { txid });
  }

  async getTicker(pair: string): Promise<Ticker | null> {
    const response = await this.makePublicRequest('Ticker', { pair });
    if (response.error && response.error.length > 0) {
      return null;
    }
    
    const pairData = response.result[pair];
    if (!pairData) return null;
    
    return {
      pair,
      last: parseFloat(pairData[6]),
      bid: parseFloat(pairData[0]),
      ask: parseFloat(pairData[2]),
      volume: parseFloat(pairData[9]),
      timestamp: Date.now()
    };
  }

  async getBalance(): Promise<Balance> {
    const response = await this.makePrivateRequest('Balance');
    if (response.error && response.error.length > 0) {
      throw new Error(`Kraken API error: ${response.error.join(', ')}`);
    }
    
    // Calculate total USD value (simplified)
    const assets = response.result;
    let totalUSD = 0;
    let availableUSD = 0;
    
    // This is a simplified balance calculation
    // In production, you'd need to get current prices for all assets
    if (assets.ZUSD) {
      totalUSD += parseFloat(assets.ZUSD);
      availableUSD += parseFloat(assets.ZUSD);
    }
    
    return {
      asset: 'USD',
      free: availableUSD,
      total: totalUSD,
      totalUSD,
      availableUSD
    };
  }

  async placeBuyOrder(pair: string, quantity: number, price: number): Promise<any> {
    const orderData = {
      pair,
      type: 'buy' as const,
      ordertype: 'limit' as const,
      volume: quantity.toString(),
      price: price.toString()
    };
    
    const response = await this.addOrder(orderData);
    if (response.error && response.error.length > 0) {
      return { success: false, error: response.error[0] };
    }
    
    return { success: true, orderId: response.result.txid[0] };
  }

  async placeSellOrder(pair: string, quantity: number, price: number): Promise<any> {
    const orderData = {
      pair,
      type: 'sell' as const,
      ordertype: 'limit' as const,
      volume: quantity.toString(),
      price: price.toString()
    };
    
    const response = await this.addOrder(orderData);
    if (response.error && response.error.length > 0) {
      return { success: false, error: response.error[0] };
    }
    
    return { success: true, orderId: response.result.txid[0] };
  }

  async getOpenPositions(): Promise<any[]> {
    const response = await this.makePrivateRequest('OpenPositions');
    if (response.error && response.error.length > 0) {
      return [];
    }
    
    // Convert Kraken format to our format
    const positions = [];
    for (const [txid, position] of Object.entries(response.result)) {
      const pos = position as any;
      positions.push({
        pair: pos.pair,
        quantity: parseFloat(pos.vol),
        averagePrice: parseFloat(pos.cost) / parseFloat(pos.vol),
        entryTime: Date.now(), // Kraken doesn't provide entry time in this endpoint
        strategy: 'Unknown',
        stopLoss: 0, // Would need to be set separately
        takeProfit: 0 // Would need to be set separately
      });
    }
    
    return positions;
  }

  async cancelOrder(txid: string) {
    return this.makePrivateRequest('CancelOrder', { txid });
  }

  async getOpenOrders() {
    return this.makePrivateRequest('OpenOrders');
  }

  async getTradeHistory() {
    return this.makePrivateRequest('TradesHistory');
  }
} 