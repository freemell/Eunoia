/**
 * Market Data Service
 * Fetches token prices and market cap data from various APIs
 */

interface TokenMarketData {
  price: number;
  marketCap: number;
  symbol: string;
  name: string;
  address: string;
}

/**
 * Get token market data from Birdeye API (free tier available)
 * Falls back to CoinGecko if Birdeye fails
 */
export async function getTokenMarketData(tokenAddress: string): Promise<TokenMarketData | null> {
  try {
    // Try Birdeye API first (free tier, no API key required for basic data)
    const birdeyeUrl = `https://public-api.birdeye.so/defi/token_overview?address=${tokenAddress}`;
    
    const response = await fetch(birdeyeUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        return {
          price: data.data.price || 0,
          marketCap: data.data.marketCap || 0,
          symbol: data.data.symbol || 'UNKNOWN',
          name: data.data.name || 'Unknown Token',
          address: tokenAddress,
        };
      }
    }
  } catch (error) {
    console.error('Birdeye API error:', error);
  }

  // Fallback: Try CoinGecko (if token is listed)
  try {
    // Note: CoinGecko requires token to be listed, which many new Solana tokens aren't
    // This is a placeholder - you might want to use a different service
    const coingeckoUrl = `https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=${tokenAddress}&vs_currencies=usd&include_market_cap=true`;
    const response = await fetch(coingeckoUrl);
    
    if (response.ok) {
      const data = await response.json();
      const tokenData = data[tokenAddress.toLowerCase()];
      if (tokenData) {
        return {
          price: tokenData.usd || 0,
          marketCap: tokenData.usd_market_cap || 0,
          symbol: 'UNKNOWN',
          name: 'Unknown Token',
          address: tokenAddress,
        };
      }
    }
  } catch (error) {
    console.error('CoinGecko API error:', error);
  }

  return null;
}

/**
 * Get token price from Jupiter (can be used as fallback)
 */
export async function getTokenPriceFromJupiter(tokenAddress: string): Promise<number | null> {
  try {
    // Get SOL price first
    const solMint = 'So11111111111111111111111111111111111111112';
    const quoteUrl = `https://lite-api.jup.ag/swap/v1/quote?` + new URLSearchParams({
      inputMint: solMint,
      outputMint: tokenAddress,
      amount: '1000000000', // 1 SOL in lamports
      slippageBps: '50',
    });

    const response = await fetch(quoteUrl);
    if (response.ok) {
      const quote = await response.json();
      if (quote.outAmount) {
        // This gives us tokens per SOL, we'd need SOL price to convert to USD
        // For now, return null and use market cap-based approach
        return null;
      }
    }
  } catch (error) {
    console.error('Jupiter price fetch error:', error);
  }

  return null;
}

/**
 * Check if a limit order condition is met
 */
export async function checkLimitOrderCondition(
  tokenAddress: string,
  triggerType: 'market_cap' | 'price',
  triggerValue: string
): Promise<boolean> {
  const marketData = await getTokenMarketData(tokenAddress);
  
  if (!marketData) {
    console.warn(`Could not fetch market data for token ${tokenAddress}`);
    return false;
  }

  const triggerNum = parseFloat(triggerValue);
  if (isNaN(triggerNum)) {
    console.error(`Invalid trigger value: ${triggerValue}`);
    return false;
  }

  if (triggerType === 'market_cap') {
    // Market cap is typically in USD, triggerValue should be in thousands (e.g., "50" = 50k)
    const marketCapInThousands = marketData.marketCap / 1000;
    return marketCapInThousands >= triggerNum;
  } else if (triggerType === 'price') {
    return marketData.price >= triggerNum;
  }

  return false;
}

