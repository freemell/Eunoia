/**
 * Generate pseudo market data for Kalshi when API is unavailable
 * This provides a fallback experience for users
 */

interface PseudoMarket {
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

/**
 * Generate pseudo markets based on query keywords
 */
export function generatePseudoMarkets(query: string): PseudoMarket[] {
  const lowerQuery = query.toLowerCase();
  const markets: PseudoMarket[] = [];

  // Inflation-related markets
  if (lowerQuery.includes('inflation') || lowerQuery.includes('3%') || lowerQuery.includes('price')) {
    markets.push({
      ticker: 'INFLATION-2024-Q2',
      title: 'Will US inflation rate exceed 3% in Q2 2024?',
      yes_bid: 45,
      yes_ask: 48,
      no_bid: 52,
      no_ask: 55,
      status: 'open',
      event_ticker: 'INFLATION-2024',
      series_ticker: 'INFLATION',
    });
    markets.push({
      ticker: 'INFLATION-2024-Q3',
      title: 'Will US inflation rate exceed 3.5% in Q3 2024?',
      yes_bid: 38,
      yes_ask: 42,
      no_bid: 58,
      no_ask: 62,
      status: 'open',
      event_ticker: 'INFLATION-2024',
      series_ticker: 'INFLATION',
    });
  }

  // Election-related markets
  if (lowerQuery.includes('election') || lowerQuery.includes('president') || lowerQuery.includes('democrat') || lowerQuery.includes('republican')) {
    markets.push({
      ticker: 'PRES-2024-WINNER',
      title: 'Will the winner of the 2024 US presidential election be a Democrat?',
      yes_bid: 52,
      yes_ask: 55,
      no_bid: 45,
      no_ask: 48,
      status: 'open',
      event_ticker: 'PRES-2024',
      series_ticker: 'PRES',
    });
    markets.push({
      ticker: 'PRES-2024-TURNOUT',
      title: 'Will voter turnout exceed 60% in the 2024 election?',
      yes_bid: 65,
      yes_ask: 68,
      no_bid: 32,
      no_ask: 35,
      status: 'open',
      event_ticker: 'PRES-2024',
      series_ticker: 'PRES',
    });
  }

  // Bitcoin/Crypto markets
  if (lowerQuery.includes('bitcoin') || lowerQuery.includes('btc') || lowerQuery.includes('crypto') || lowerQuery.includes('50k') || lowerQuery.includes('30k')) {
    markets.push({
      ticker: 'BTC-2024-50K',
      title: 'Will Bitcoin price exceed $50,000 by end of 2024?',
      yes_bid: 58,
      yes_ask: 62,
      no_bid: 38,
      no_ask: 42,
      status: 'open',
      event_ticker: 'BTC-2024',
      series_ticker: 'BTC',
    });
    markets.push({
      ticker: 'BTC-2024-30K',
      title: 'Will Bitcoin price exceed $30,000 in the next month?',
      yes_bid: 72,
      yes_ask: 75,
      no_bid: 25,
      no_ask: 28,
      status: 'open',
      event_ticker: 'BTC-2024',
      series_ticker: 'BTC',
    });
  }

  // Weather markets
  if (lowerQuery.includes('weather') || lowerQuery.includes('rain') || lowerQuery.includes('nyc') || lowerQuery.includes('snow')) {
    markets.push({
      ticker: 'WEATHER-NYC-TOMORROW',
      title: 'Will it rain in New York City tomorrow?',
      yes_bid: 35,
      yes_ask: 40,
      no_bid: 60,
      no_ask: 65,
      status: 'open',
      event_ticker: 'WEATHER-NYC',
      series_ticker: 'WEATHER',
    });
    markets.push({
      ticker: 'WEATHER-NYC-WEEK',
      title: 'Will NYC receive more than 2 inches of rain this week?',
      yes_bid: 28,
      yes_ask: 32,
      no_bid: 68,
      no_ask: 72,
      status: 'open',
      event_ticker: 'WEATHER-NYC',
      series_ticker: 'WEATHER',
    });
  }

  // Stock market markets
  if (lowerQuery.includes('stock') || lowerQuery.includes('s&p') || lowerQuery.includes('sp500') || lowerQuery.includes('dow') || lowerQuery.includes('market')) {
    markets.push({
      ticker: 'SP500-2024-4000',
      title: 'Will the S&P 500 close above 4,000 today?',
      yes_bid: 62,
      yes_ask: 65,
      no_bid: 35,
      no_ask: 38,
      status: 'open',
      event_ticker: 'SP500-2024',
      series_ticker: 'SP500',
    });
    markets.push({
      ticker: 'DOW-2024-35K',
      title: 'Will the Dow Jones exceed 35,000 in the next month?',
      yes_bid: 55,
      yes_ask: 58,
      no_bid: 42,
      no_ask: 45,
      status: 'open',
      event_ticker: 'DOW-2024',
      series_ticker: 'DOW',
    });
  }

  // Interest rate markets
  if (lowerQuery.includes('interest') || lowerQuery.includes('rate') || lowerQuery.includes('fed') || lowerQuery.includes('federal')) {
    markets.push({
      ticker: 'FED-RATE-2024-Q2',
      title: 'Will the Federal Reserve raise interest rates in Q2 2024?',
      yes_bid: 42,
      yes_ask: 46,
      no_bid: 54,
      no_ask: 58,
      status: 'open',
      event_ticker: 'FED-RATE-2024',
      series_ticker: 'FED-RATE',
    });
  }

  // Unemployment markets
  if (lowerQuery.includes('unemployment') || lowerQuery.includes('job') || lowerQuery.includes('4%')) {
    markets.push({
      ticker: 'UNEMPLOY-2024-Q2',
      title: 'Will US unemployment rate fall below 4% in Q2 2024?',
      yes_bid: 48,
      yes_ask: 52,
      no_bid: 48,
      no_ask: 52,
      status: 'open',
      event_ticker: 'UNEMPLOY-2024',
      series_ticker: 'UNEMPLOY',
    });
  }

  // Oil markets
  if (lowerQuery.includes('oil') || lowerQuery.includes('80') || lowerQuery.includes('barrel')) {
    markets.push({
      ticker: 'OIL-2024-80',
      title: 'Will oil price exceed $80 per barrel in the next month?',
      yes_bid: 55,
      yes_ask: 58,
      no_bid: 42,
      no_ask: 45,
      status: 'open',
      event_ticker: 'OIL-2024',
      series_ticker: 'OIL',
    });
  }

  // Gold markets
  if (lowerQuery.includes('gold') || lowerQuery.includes('2k') || lowerQuery.includes('2000')) {
    markets.push({
      ticker: 'GOLD-2024-2K',
      title: 'Will gold price exceed $2,000 per ounce in the next month?',
      yes_bid: 45,
      yes_ask: 48,
      no_bid: 52,
      no_ask: 55,
      status: 'open',
      event_ticker: 'GOLD-2024',
      series_ticker: 'GOLD',
    });
  }

  // If no specific matches, return general markets
  if (markets.length === 0) {
    markets.push({
      ticker: 'SP500-2024-4000',
      title: 'Will the S&P 500 close above 4,000 today?',
      yes_bid: 62,
      yes_ask: 65,
      no_bid: 35,
      no_ask: 38,
      status: 'open',
      event_ticker: 'SP500-2024',
      series_ticker: 'SP500',
    });
    markets.push({
      ticker: 'INFLATION-2024-Q2',
      title: 'Will US inflation rate exceed 3% in Q2 2024?',
      yes_bid: 45,
      yes_ask: 48,
      no_bid: 52,
      no_ask: 55,
      status: 'open',
      event_ticker: 'INFLATION-2024',
      series_ticker: 'INFLATION',
    });
    markets.push({
      ticker: 'BTC-2024-50K',
      title: 'Will Bitcoin price exceed $50,000 by end of 2024?',
      yes_bid: 58,
      yes_ask: 62,
      no_bid: 38,
      no_ask: 42,
      status: 'open',
      event_ticker: 'BTC-2024',
      series_ticker: 'BTC',
    });
  }

  return markets.slice(0, 10); // Return up to 10 markets
}

