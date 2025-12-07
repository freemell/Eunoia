/**
 * Kalshi API Service
 * Handles interactions with Kalshi prediction markets
 */

import { createSign } from 'crypto';
import { randomUUID } from 'crypto';

// Kalshi API endpoints - Unified under trade-api/v2
const KALSHI_API_BASE = 'https://trading-api.kalshi.com/trade-api/v2';

interface KalshiMarket {
  ticker: string;
  title: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  status: string;
  event_ticker: string;
  series_ticker: string;
}

interface KalshiOrder {
  order_id: string;
  ticker: string;
  side: 'yes' | 'no';
  action: 'buy' | 'sell';
  count: number;
  type: 'limit' | 'market';
  yes_price?: number;
  no_price?: number;
}

interface KalshiPosition {
  ticker: string;
  position: number;
  entry_price: number;
  current_price: number;
  unrealized_pnl: number;
}

/**
 * Generate signed headers for Kalshi API requests
 * Kalshi requires RSA-SHA256 signing for authenticated endpoints
 */
function getKalshiSignedHeaders(
  method: string,
  path: string,
  payload: string = ''
): HeadersInit {
  const apiKey = process.env.KALSHI_API_KEY;
  const privateKey = process.env.KALSHI_PRIVATE_KEY;
  
  if (!apiKey) {
    throw new Error('KALSHI_API_KEY not configured');
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // For public endpoints (GET /markets, /events), no signing needed
  // For authenticated endpoints, use RSA signing
  if (privateKey && (method === 'POST' || method === 'DELETE' || path.includes('/portfolio'))) {
    const timestamp = Date.now().toString();
    const nonce = randomUUID();
    
    // Create message to sign: method + path + timestamp + nonce + payload
    const message = `${method}\n${path}\n${timestamp}\n${nonce}\n${payload}`;
    
    // Sign with RSA-SHA256
    const signer = createSign('RSA-SHA256');
    signer.update(message);
    
    // Handle multiline private key (replace \n with actual newlines)
    const formattedKey = privateKey.replace(/\\n/g, '\n');
    const signature = signer.sign(formattedKey, 'base64');
    
    headers['X-Kalshi-Timestamp'] = timestamp;
    headers['X-Kalshi-Nonce'] = nonce;
    headers['X-Kalshi-Signature'] = signature;
  }

  return headers;
}

/**
 * Create an AbortController with timeout
 */
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

/**
 * Search for markets by query
 * Public endpoint - no authentication required
 */
export async function searchMarkets(query: string): Promise<KalshiMarket[]> {
  try {
    const path = '/trade-api/v2/markets';
    const url = `${KALSHI_API_BASE}?limit=20&keyword=${encodeURIComponent(query)}&status=open`;
    console.log('🔍 Searching Kalshi markets:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: createTimeoutSignal(10000), // 10 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error('❌ Kalshi API error:', response.status, errorText);
      throw new Error(`Kalshi API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const markets = data.markets || data || [];
    console.log('✅ Kalshi markets found:', Array.isArray(markets) ? markets.length : 0);
    return Array.isArray(markets) ? markets : [];
  } catch (error) {
    console.error('❌ Error searching Kalshi markets:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to search Kalshi markets: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get market details by ticker
 * Public endpoint - no authentication required
 */
export async function getMarket(ticker: string): Promise<KalshiMarket | null> {
  try {
    const url = `${KALSHI_API_BASE}/markets/${ticker}`;
    console.log('🔍 Getting Kalshi market:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: createTimeoutSignal(10000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Kalshi API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.market || data || null;
  } catch (error) {
    console.error('❌ Error getting Kalshi market:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to get Kalshi market: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get user's positions
 * Requires authentication with RSA signing
 */
export async function getPositions(): Promise<KalshiPosition[]> {
  try {
    const path = '/trade-api/v2/portfolio/positions';
    const headers = getKalshiSignedHeaders('GET', path);
    const url = `${KALSHI_API_BASE}/portfolio/positions`;
    console.log('🔍 Getting Kalshi positions:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: createTimeoutSignal(10000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error('❌ Kalshi API error:', response.status, errorText);
      throw new Error(`Kalshi API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.positions || [];
  } catch (error) {
    console.error('❌ Error getting Kalshi positions:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to get Kalshi positions: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Place an order on Kalshi
 */
export async function placeOrder(order: {
  ticker: string;
  side: 'yes' | 'no';
  action: 'buy' | 'sell';
  count: number;
  type: 'limit' | 'market';
  yes_price?: number;
  no_price?: number;
}): Promise<{ order_id: string; status: string }> {
  try {
    const orderPayload: any = {
      ticker: order.ticker,
      side: order.side,
      action: order.action,
      count: order.count,
      type: order.type,
    };

    if (order.type === 'limit') {
      if (order.side === 'yes' && order.yes_price) {
        orderPayload.yes_price = order.yes_price;
      } else if (order.side === 'no' && order.no_price) {
        orderPayload.no_price = order.no_price;
      }
    }

    const path = '/trade-api/v2/orders';
    const payload = JSON.stringify(orderPayload);
    const headers = getKalshiSignedHeaders('POST', path, payload);
    const url = `${KALSHI_API_BASE}/orders`;
    console.log('📝 Placing Kalshi order:', url, orderPayload);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: payload,
      signal: createTimeoutSignal(15000), // 15 second timeout for orders
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      console.error('❌ Kalshi order error:', response.status, errorData);
      throw new Error(
        errorData.message || errorData.error || `Kalshi API error (${response.status}): ${errorText}`
      );
    }

    const data = await response.json();
    return {
      order_id: data.order_id || data.orderId,
      status: data.status || 'pending',
    };
  } catch (error) {
    console.error('Error placing Kalshi order:', error);
    throw error;
  }
}

/**
 * Cancel an order
 */
export async function cancelOrder(orderId: string): Promise<void> {
  try {
    const path = `/trade-api/v2/orders/${orderId}`;
    const headers = getKalshiSignedHeaders('DELETE', path);
    const url = `${KALSHI_API_BASE}/orders/${orderId}`;
    console.log('🗑️ Canceling Kalshi order:', url);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      signal: createTimeoutSignal(10000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Kalshi API error (${response.status}): ${errorText}`);
    }
  } catch (error) {
    console.error('Error canceling Kalshi order:', error);
    throw error;
  }
}

/**
 * Get user's balance
 */
export async function getBalance(): Promise<{ balance: number; currency: string }> {
  try {
    const path = '/trade-api/v2/portfolio/balance';
    const headers = getKalshiSignedHeaders('GET', path);
    const url = `${KALSHI_API_BASE}/portfolio/balance`;
    console.log('💰 Getting Kalshi balance:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: createTimeoutSignal(10000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Kalshi API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return {
      balance: data.balance || 0,
      currency: data.currency || 'USD',
    };
  } catch (error) {
    console.error('Error getting Kalshi balance:', error);
    throw error;
  }
}

/**
 * Format market odds for display
 */
export function formatMarketOdds(market: KalshiMarket): string {
  const yesPrice = market.yes_bid || 0;
  const noPrice = market.no_bid || 0;
  const yesPercent = (yesPrice / 100).toFixed(1);
  const noPercent = (noPrice / 100).toFixed(1);
  
  return `Yes: ${yesPercent}% | No: ${noPercent}%`;
}

