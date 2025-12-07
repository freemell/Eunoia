/**
 * Kalshi API Service
 * Handles interactions with Kalshi prediction markets
 */

const KALSHI_API_BASE = 'https://trading-api.kalshi.com/trade-api/v2';
const KALSHI_PUBLIC_API = 'https://api.calendar.kalshi.com/trade-api/v2';

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
 * Search for markets by query
 */
export async function searchMarkets(query: string): Promise<KalshiMarket[]> {
  try {
    const response = await fetch(
      `${KALSHI_PUBLIC_API}/markets?limit=20&keyword=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Kalshi API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.markets || [];
  } catch (error) {
    console.error('Error searching Kalshi markets:', error);
    throw error;
  }
}

/**
 * Get market details by ticker
 */
export async function getMarket(ticker: string): Promise<KalshiMarket | null> {
  try {
    const response = await fetch(
      `${KALSHI_PUBLIC_API}/markets/${ticker}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Kalshi API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.market || null;
  } catch (error) {
    console.error('Error getting Kalshi market:', error);
    throw error;
  }
}

/**
 * Get user's positions
 */
export async function getPositions(): Promise<KalshiPosition[]> {
  try {
    const headers = getKalshiHeaders();
    const response = await fetch(`${KALSHI_API_BASE}/portfolio/positions`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Kalshi API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.positions || [];
  } catch (error) {
    console.error('Error getting Kalshi positions:', error);
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

    const response = await fetch(`${KALSHI_API_BASE}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Kalshi API error: ${response.statusText}`
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
    const response = await fetch(`${KALSHI_API_BASE}/orders/${orderId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Kalshi API error: ${response.statusText}`);
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
    const response = await fetch(`${KALSHI_API_BASE}/portfolio/balance`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Kalshi API error: ${response.statusText}`);
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

