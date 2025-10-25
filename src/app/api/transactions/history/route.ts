import { NextResponse } from 'next/server';
import { memoryDb } from '@/lib/memory-db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('walletAddress');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Use memory database
    const transactions = await memoryDb.findManyTransactions(
      { walletAddress },
      { orderBy: { createdAt: 'desc' }, take: limit, skip: offset }
    );

    const totalCount = await memoryDb.countTransactions({ walletAddress });
    const wallet = await memoryDb.findUniqueWallet({ address: walletAddress });

    return NextResponse.json({
      success: true,
      transactions,
      wallet,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Transaction history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction history', success: false },
      { status: 500 }
    );
  }
}
