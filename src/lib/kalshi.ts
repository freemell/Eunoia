/**
 * Kalshi API Service
 * Handles interactions with Kalshi prediction markets
 */

// Kalshi API endpoints
// Production: https://trading-api.kalshi.com/v1
// Sandbox/Demo: https://demo.kalshi.com/trade-api/v2
// Public API (for market data): https://api.calendar.kalshi.com/trade-api/v2
const KALSHI_API_BASE = process.env.KALSHI_API_BASE || 'https://trading-api.kalshi.com/v1';
// Try public API first for market searches, fallback to trading API
const KALSHI_PUBLIC_API = 'https://api.calendar.kalshi.com/trade-api/v2';
const KALSHI_TRADING_API = 'https://trading-api.kalshi.com/v1';

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
 * Get Kalshi API headers with authentication
 * Note: Kalshi typically uses API Key ID + RSA private key for signing requests
 * For now, we'll use a simpler approach with the provided API key
 * Full RSA signing can be implemented later if needed
 */
function getKalshiHeaders(): HeadersInit {
  const apiKey = process.env.KALSHI_API_KEY;
  const apiSecret = process.env.KALSHI_API_SECRET;
  
  if (!apiKey) {
    throw new Error('KALSHI_API_KEY not configured');
  }

  // Kalshi API authentication
  // Option 1: If both key and secret are provided, use basic auth
  // Option 2: Use API key as X-API-Key header (common pattern)
  // Option 3: For full production, implement RSA signing with private key
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (apiSecret) {
    // Basic auth with key:secret
    const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  } else {
    // Try API key header approach
    headers['X-API-Key'] = apiKey;
    // Also try as bearer token (some endpoints may accept this)
    headers['Authorization'] = `Bearer ${apiKey}`;
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
 * Tries public API first, then falls back to trading API if needed
 */
export async function searchMarkets(query: string): Promise<KalshiMarket[]> {
  const endpoints = [
    `${KALSHI_PUBLIC_API}/markets`,
    `${KALSHI_TRADING_API}/markets`,
  ];
  
  for (const baseUrl of endpoints) {
    try {
      const url = `${baseUrl}?limit=20&keyword=${encodeURIComponent(query)}`;
      console.log('🔍 Searching Kalshi markets:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: createTimeoutSignal(10000), // 10 second timeout
      });

      if (!response.ok) {
        // If 404 or auth error, try next endpoint
        if (response.status === 404 || response.status === 401) {
          console.log(`⚠️ Endpoint ${baseUrl} returned ${response.status}, trying next...`);
          continue;
        }
        const errorText = await response.text().catch(() => response.statusText);
        console.error('❌ Kalshi API error:', response.status, errorText);
        throw new Error(`Kalshi API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const markets = data.markets || data || [];
      console.log('✅ Kalshi markets found:', markets.length);
      return Array.isArray(markets) ? markets : [];
    } catch (error) {
      // If it's a network error and we have more endpoints to try, continue
      if (error instanceof Error && error.name === 'AbortError' && baseUrl !== endpoints[endpoints.length - 1]) {
        console.log('⚠️ Request timeout, trying next endpoint...');
        continue;
      }
      // If this is the last endpoint or a different error, throw
      if (baseUrl === endpoints[endpoints.length - 1]) {
        console.error('❌ Error searching Kalshi markets:', error);
        if (error instanceof Error) {
          throw new Error(`Failed to search Kalshi markets: ${error.message}`);
        }
        throw error;
      }
    }
  }
  
  // Should not reach here, but just in case
  throw new Error('Failed to search Kalshi markets: All endpoints failed');
}

/**
 * Get market details by ticker
 */
export async function getMarket(ticker: string): Promise<KalshiMarket | null> {
  try {
    const url = `${KALSHI_PUBLIC_API}/markets/${ticker}`;
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
 */
export async function getPositions(): Promise<KalshiPosition[]> {
  try {
    const headers = getKalshiHeaders();
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
    const headers = getKalshiHeaders();
    
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

    const url = `${KALSHI_API_BASE}/orders`;
    console.log('📝 Placing Kalshi order:', url, orderPayload);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderPayload),
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
    const headers = getKalshiHeaders();
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
    const headers = getKalshiHeaders();
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

