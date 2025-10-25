import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    let transaction;

    try {
      // Try Prisma first
      const wallet = await prisma.wallet.upsert({
        where: { address: walletAddress },
        update: {},
        create: {
          address: walletAddress,
          userId: 'default'
        }
      });

      transaction = await prisma.transaction.create({
        data: {
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
        }
      });
    } catch (prismaError) {
      console.log('Prisma failed, using memory database:', prismaError);
      
      // Fallback to memory database
      await memoryDb.upsertWallet({
        address: walletAddress,
        userId: 'default'
      });

      transaction = await memoryDb.createTransaction({
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
    }

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
