import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { quoteApi, swapApi } from '@jup-ag/api';

export async function POST(req: Request) {
  try {
    const { fromToken, toToken, amount, userWallet } = await req.json();

    console.log('🔄 Swap request:', { fromToken, toToken, amount, userWallet });

    // Validate required parameters
    if (!fromToken || !toToken || !amount || !userWallet) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: fromToken, toToken, amount, userWallet'
      }, { status: 400 });
    }

    // Token mint addresses (common tokens)
    const tokenMints: Record<string, string> = {
      'SOL': 'So11111111111111111111111111111111111111112',
      'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      'WIF': 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    };

    const fromMint = tokenMints[fromToken.toUpperCase()] || fromToken;
    const toMint = tokenMints[toToken.toUpperCase()] || toToken;

    // Connect to Solana
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );

    // Get swap quote from Jupiter using SDK
    const amountInLamports = fromToken.toUpperCase() === 'SOL' 
      ? Math.floor(Number(amount) * 1e9) // Convert SOL to lamports
      : Math.floor(Number(amount) * 1e6); // Convert USDC/USDT to smallest unit

    console.log('📊 Fetching quote from Jupiter for:', {
      inputMint: fromMint,
      outputMint: toMint,
      amount: amountInLamports
    });

    const quote = await quoteApi.getQuote({
      inputMint: fromMint,
      outputMint: toMint,
      amount: amountInLamports,
      slippageBps: 50, // 0.5% slippage
    });

    console.log('✅ Got quote:', quote);

    if (!quote || !quote.outAmount) {
      throw new Error('Invalid quote response from Jupiter');
    }

    // Get swap transaction from Jupiter using SDK
    console.log('🔄 Creating swap transaction...');
    
    const swapResponse = await swapApi.postSwap({
      quoteResponse: quote,
      userPublicKey: new PublicKey(userWallet),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      priorityLevelWithMaxLamports: 'fast',
    });

    console.log('✅ Swap transaction created');

    if (!swapResponse || !swapResponse.swapTransaction) {
      throw new Error('Invalid swap transaction response from Jupiter');
    }

    // Return the transaction that needs to be signed by the user
    return NextResponse.json({
      success: true,
      transaction: swapResponse.swapTransaction,
      userPublicKey: userWallet,
      message: `Ready to swap ${amount} ${fromToken} to ${toToken}. Please sign the transaction in your wallet.`,
      quote: {
        inputAmount: quote.inAmount,
        outputAmount: quote.outAmount,
        priceImpact: quote.priceImpactPct,
        routePlan: quote.routePlan,
      }
    });

  } catch (error) {
    console.error('❌ Swap error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Swap failed'
    }, { status: 500 });
  }
}
