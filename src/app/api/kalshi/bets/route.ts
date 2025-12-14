import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getMarket } from '@/lib/kalshi';

const prisma = new PrismaClient();

/**
 * POST /api/kalshi/bets - Save a new bet
 */
export async function POST(req: Request) {
  try {
    const {
      walletAddress,
      userId,
      telegramId,
      marketTicker,
      marketTitle,
      side,
      amount,
      entryPrice,
      txHash,
      marketData,
    } = await req.json();

    if (!walletAddress || !marketTicker || !side || !amount || entryPrice === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, marketTicker, side, amount, entryPrice' },
        { status: 400 }
      );
    }

    // Calculate initial current value (same as entry value initially)
    const currentValue = parseFloat(amount);

    const bet = await prisma.kalshiBet.create({
      data: {
        walletAddress,
        userId: userId || null,
        telegramId: telegramId || null,
        marketTicker,
        marketTitle: marketTitle || marketTicker,
        side,
        amount,
        entryPrice: parseFloat(entryPrice.toString()),
        currentPrice: parseFloat(entryPrice.toString()), // Initially same as entry
        currentValue,
        txHash: txHash || null,
        status: 'active',
        marketData: marketData ? JSON.stringify(marketData) : null,
      },
    });

    return NextResponse.json({ success: true, bet });
  } catch (error) {
    console.error('❌ Error saving Kalshi bet:', error);
    return NextResponse.json(
      { error: 'Failed to save bet', success: false },
      { status: 500 }
    );
  }
}

/**
 * GET /api/kalshi/bets - Get active bets for a wallet
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('walletAddress');
    const status = searchParams.get('status') || 'active';

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress parameter is required' },
        { status: 400 }
      );
    }

    // Fetch active bets
    const bets = await prisma.kalshiBet.findMany({
      where: {
        walletAddress,
        status: status === 'all' ? undefined : status,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Update current prices and values for active bets
    const updatedBets = await Promise.all(
      bets.map(async (bet) => {
        if (bet.status === 'active') {
          try {
            // Fetch current market data
            const market = await getMarket(bet.marketTicker);
            if (market) {
              // Get current price based on side
              const currentPrice =
                bet.side === 'yes'
                  ? market.yes_bid || market.yes_ask || bet.entryPrice
                  : market.no_bid || market.no_ask || bet.entryPrice;

              // Calculate current value
              // If you bet YES at 50% and current price is 60%, your bet is worth more
              // Current value = (entry price / current price) * amount
              const entryPriceDecimal = bet.entryPrice / 100;
              const currentPriceDecimal = currentPrice / 100;
              let currentValue: number;

              if (bet.side === 'yes') {
                // For YES bets: value increases as price goes up
                // If you bought at 50% and it's now 60%, value = (50/60) * amount = 0.833 * amount
                // But actually, if you bet $1 at 50%, you get 2 shares. At 60%, those shares are worth $1.20
                // So: shares = amount / entryPrice, value = shares * currentPrice
                const shares = parseFloat(bet.amount) / entryPriceDecimal;
                currentValue = shares * currentPriceDecimal;
              } else {
                // For NO bets: value increases as price goes down
                // If you bought at 50% and it's now 40%, value = (50/40) * amount = 1.25 * amount
                const noEntryPrice = 100 - bet.entryPrice;
                const noCurrentPrice = 100 - currentPrice;
                const shares = parseFloat(bet.amount) / (noEntryPrice / 100);
                currentValue = shares * (noCurrentPrice / 100);
              }

              // Update bet with current price and value
              const updatedBet = await prisma.kalshiBet.update({
                where: { id: bet.id },
                data: {
                  currentPrice,
                  currentValue,
                  updatedAt: new Date(),
                },
              });

              return updatedBet;
            }
          } catch (error) {
            console.error(`Error updating bet ${bet.id}:`, error);
            // Return bet with existing values if update fails
          }
        }
        return bet;
      })
    );

    return NextResponse.json({
      success: true,
      bets: updatedBets,
      count: updatedBets.length,
    });
  } catch (error) {
    console.error('❌ Error fetching Kalshi bets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bets', success: false },
      { status: 500 }
    );
  }
}

