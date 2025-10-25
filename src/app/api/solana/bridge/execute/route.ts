import { NextResponse } from 'next/server';
import { merlinBridge } from '@/lib/bridge';

export async function POST(req: Request) {
  try {
    const { bridgeData, userWallet, signature } = await req.json();

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
      userWallet: userWallet || ''
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

function getBridgeUrl(protocol: string) {
  const urls = {
    'Merlin Bridge': 'https://merlin-bridge.com',
    'Wormhole': 'https://wormhole.com',
    'AllBridge': 'https://allbridge.io'
  };
  return urls[protocol as keyof typeof urls] || 'https://merlin-bridge.com';
}

function getExplorerUrl(chain: string, address: string) {
  const explorers = {
    'ethereum': `https://etherscan.io/address/${address}`,
    'base': `https://basescan.org/address/${address}`,
    'polygon': `https://polygonscan.com/address/${address}`,
    'avalanche': `https://snowtrace.io/address/${address}`,
    'bsc': `https://bscscan.com/address/${address}`,
    'arbitrum': `https://arbiscan.io/address/${address}`,
    'optimism': `https://optimistic.etherscan.io/address/${address}`
  };
  return explorers[chain as keyof typeof explorers] || `https://etherscan.io/address/${address}`;
}
