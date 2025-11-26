import { NextResponse } from 'next/server';
import { merlinBridge } from '@/lib/bridge';

// Bridge protocol configurations
const BRIDGE_PROTOCOLS = {
  'merlin': {
    name: 'Merlin Bridge',
    supportedChains: ['ethereum', 'base', 'polygon', 'avalanche'],
    fee: '0.0005 SOL',
    time: '3-5 minutes',
    url: 'https://merlin-bridge.com',
    contract: 'Merlin Bridge Contract'
  },
  'wormhole': {
    name: 'Wormhole',
    supportedChains: ['ethereum', 'polygon', 'avalanche', 'bsc', 'arbitrum', 'optimism'],
    fee: '0.001 SOL',
    time: '5-10 minutes',
    url: 'https://wormhole.com',
    contract: 'Wormhole Bridge'
  },
  'allbridge': {
    name: 'AllBridge',
    supportedChains: ['polygon', 'avalanche', 'bsc'],
    fee: '0.0003 SOL',
    time: '2-4 minutes',
    url: 'https://allbridge.io',
    contract: 'AllBridge Contract'
  }
};

// Get optimal bridge protocol for destination chain
function getOptimalBridge(toChain: string) {
  if (['ethereum', 'base'].includes(toChain)) {
    return BRIDGE_PROTOCOLS.merlin;
  } else if (['polygon', 'avalanche', 'bsc'].includes(toChain)) {
    return BRIDGE_PROTOCOLS.allbridge;
  } else {
    return BRIDGE_PROTOCOLS.wormhole;
  }
}


export async function POST(req: Request) {
  try {
    const { fromChain, toChain, token, amount, toAddress, userWallet } = await req.json();

    if (!fromChain || !toChain || !token || !amount || !toAddress) {
      return NextResponse.json({ 
        error: 'Missing required parameters: fromChain, toChain, token, amount, toAddress' 
      }, { status: 400 });
    }

    // Check if user has a bridge-compatible wallet
    if (!userWallet) {
      return NextResponse.json({
        error: 'Bridge wallet required',
        message: 'To bridge tokens, you need to connect a wallet that supports cross-chain transactions.',
        requiresBridgeWallet: true,
        supportedWallets: [
          'Phantom (with bridge support)',
          'Solflare (with bridge support)', 
          'MetaMask (for destination chain)',
          'WalletConnect compatible wallets'
        ],
        bridgeProtocols: Object.values(BRIDGE_PROTOCOLS).map(p => p.name),
        success: false
      });
    }

    // Get bridge quote using real bridge implementation
    const bridgeQuote = await merlinBridge.getBridgeQuote({
      fromChain,
      toChain,
      token,
      amount,
      toAddress
    });
    
    // Generate bridge transaction data
    const bridgeTransaction = {
      fromChain,
      toChain,
      token,
      amount,
      toAddress,
      userWallet,
      protocol: getOptimalBridge(toChain).name,
      bridgeFee: bridgeQuote.bridgeFee,
      estimatedTime: bridgeQuote.estimatedTime,
      slippage: bridgeQuote.slippage,
      minimumAmount: bridgeQuote.minimumAmount,
      requiresApproval: true,
      steps: [
        '1. Approve token spending on source chain',
        '2. Lock tokens in bridge contract',
        '3. Wait for bridge confirmation',
        '4. Receive tokens on destination chain'
      ],
      // Real bridge integration data
      bridgeData: {
        sourceChainId: fromChain === 'solana' ? '101' : '1', // Solana mainnet
        targetChainId: toChain === 'ethereum' ? '1' : 
                      toChain === 'base' ? '8453' :
                      toChain === 'polygon' ? '137' : '1',
        tokenAddress: token === 'SOL' ? 'So11111111111111111111111111111111111111112' : null,
        amount: amount === 'all' ? 'MAX' : amount,
        recipient: toAddress,
        bridgeProtocol: getOptimalBridge(toChain).name.toLowerCase()
      }
    };
    
    return NextResponse.json({
      message: `Bridge transaction prepared: ${amount} ${token} from ${fromChain} to ${toChain}`,
      transaction: bridgeTransaction,
      bridgeRequirements: {
        protocol: getOptimalBridge(toChain).name,
        bridgeFee: bridgeQuote.bridgeFee,
        estimatedTime: bridgeQuote.estimatedTime,
        slippage: bridgeQuote.slippage,
        minimumAmount: bridgeQuote.minimumAmount,
        requiresApproval: true,
        steps: bridgeTransaction.steps
      },
      success: true
    });

  } catch (error) {
    console.error('Bridge API error:', error);
    return NextResponse.json(
      { error: 'Failed to process bridge request', success: false },
      { status: 500 }
    );
  }
}
