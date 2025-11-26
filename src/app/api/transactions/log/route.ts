import { NextResponse } from 'next/server';
import { memoryDb } from '@/lib/memory-db';

export async function POST(req: Request) {
  try {
    const {
      walletAddress,
      type,
      fromChain,
      toChain,
      token,
      amount,
      fromAddress,
      toAddress,
      txHash,
      status = 'pending',
      bridgeTxId,
      protocol,
      fee,
      blockNumber,
      gasUsed
    } = await req.json();

    if (!walletAddress || !type || !token || !amount) {
      return NextResponse.json({ 
        error: 'Missing required fields: walletAddress, type, token, amount' 
      }, { status: 400 });
    }

    // Use memory database
    await memoryDb.upsertWallet({
      address: walletAddress,
      userId: 'default'
    });

    const transaction = await memoryDb.createTransaction({
      walletAddress,
      type,
      fromChain,
      toChain,
      token,
      amount,
      fromAddress,
      toAddress,
      txHash,
      status,
      bridgeTxId,
      protocol,
      fee,
      blockNumber,
      gasUsed
    });

    return NextResponse.json({
      success: true,
      transaction,
      message: 'Transaction logged successfully'
    });

  } catch (error) {
    console.error('Transaction logging error:', error);
    return NextResponse.json(
      { error: 'Failed to log transaction', success: false },
      { status: 500 }
    );
  }
}
