import { NextResponse } from 'next/server';
import { merlinBridge } from '@/lib/bridge';

export async function POST(req: Request) {
  try {
    const { bridgeData, userWallet } = await req.json();

    if (!bridgeData || !userWallet) {
      return NextResponse.json({ 
        error: 'Missing bridge data or wallet information' 
      }, { status: 400 });
    }

    const { fromChain, toChain, token, amount, toAddress } = bridgeData;

    console.log('Bridge execution data:', { fromChain, toChain, token, amount, toAddress, userWallet });

    // Execute the actual bridge transaction using Merlin Bridge
    const bridgeResult = await merlinBridge.executeBridge({
      fromChain: fromChain || 'solana',
      toChain: toChain || 'ethereum',
      token: token || 'SOL',
      amount: amount || '0.01',
      toAddress: toAddress || '',
    });

    if (bridgeResult.success) {
      // Log the bridge transaction
      try {
        await fetch('/api/transactions/simple-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: userWallet,
            type: 'bridge',
            fromChain: fromChain || 'solana',
            toChain: toChain || 'ethereum',
            token: token || 'SOL',
            amount: amount || '0.01',
            fromAddress: userWallet,
            toAddress: toAddress || '',
            txHash: bridgeResult.transactionHash,
            status: 'completed',
            bridgeTxId: bridgeResult.transactionHash,
            protocol: 'Merlin Bridge',
            fee: '0.0005'
          })
        });
      } catch (logError) {
        console.error('Failed to log bridge transaction:', logError);
      }

      return NextResponse.json({
        message: bridgeResult.message,
        bridgeTxId: bridgeResult.transactionHash,
        status: 'completed',
        success: true
      });
    } else {
      return NextResponse.json({
        error: bridgeResult.error || 'Bridge execution failed',
        message: bridgeResult.message,
        success: false
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Bridge execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute bridge transaction', success: false },
      { status: 500 }
    );
  }
}

