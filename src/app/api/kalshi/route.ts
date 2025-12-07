import { NextResponse } from 'next/server';
import {
  searchMarkets,
  getMarket,
  getPositions,
  placeOrder,
  cancelOrder,
  getBalance,
  formatMarketOdds,
} from '@/lib/kalshi';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'search': {
        const query = searchParams.get('query');
        if (!query) {
          return NextResponse.json(
            { error: 'Query parameter is required' },
            { status: 400 }
          );
        }
        const markets = await searchMarkets(query);
        return NextResponse.json({ success: true, markets });
      }

      case 'market': {
        const ticker = searchParams.get('ticker');
        if (!ticker) {
          return NextResponse.json(
            { error: 'Ticker parameter is required' },
            { status: 400 }
          );
        }
        const market = await getMarket(ticker);
        if (!market) {
          return NextResponse.json(
            { error: 'Market not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({ success: true, market });
      }

      case 'positions': {
        const positions = await getPositions();
        return NextResponse.json({ success: true, positions });
      }

      case 'balance': {
        const balance = await getBalance();
        return NextResponse.json({ success: true, balance });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: search, market, positions, balance' },
          { status: 400 }
        );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Kalshi API error:', errorMessage);
    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, ...params } = body;

    switch (action) {
      case 'order': {
        const { ticker, side, orderAction, count, type, yes_price, no_price } = params;
        
        if (!ticker || !side || !orderAction || !count || !type) {
          return NextResponse.json(
            { error: 'Missing required parameters: ticker, side, orderAction, count, type' },
            { status: 400 }
          );
        }

        const result = await placeOrder({
          ticker,
          side,
          action: orderAction,
          count,
          type,
          yes_price,
          no_price,
        });

        return NextResponse.json({ success: true, order: result });
      }

      case 'cancel': {
        const { orderId } = params;
        if (!orderId) {
          return NextResponse.json(
            { error: 'orderId is required' },
            { status: 400 }
          );
        }
        await cancelOrder(orderId);
        return NextResponse.json({ success: true, message: 'Order cancelled' });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: order, cancel' },
          { status: 400 }
        );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Kalshi API error:', errorMessage);
    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: 500 }
    );
  }
}

