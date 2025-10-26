import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

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

    // Get quote from Jupiter using HTTP API
    const quoteUrl = `https://quote-api.jup.ag/v6/quote?` + new URLSearchParams({
      inputMint: fromMint,
      outputMint: toMint,
      amount: amountInLamports.toString(),
      slippageBps: '50', // 0.5% slippage
    });

    const quoteResponse = await fetch(quoteUrl);
    if (!quoteResponse.ok) {
      throw new Error(`Failed to get quote: ${quoteResponse.statusText}`);
    }
    const quote = await quoteResponse.json();

    console.log('✅ Got quote:', quote);

    if (!quote || !quote.outAmount) {
      throw new Error('Invalid quote response from Jupiter');
    }

    // Get swap transaction from Jupiter using HTTP API
    console.log('🔄 Creating swap transaction...');
    
    const swapUrl = 'https://quote-api.jup.ag/v6/swap';
    const swapResponse = await fetch(swapUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: userWallet,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        priorityLevelWithMaxLamports: 'fast',
      }),
    });

    if (!swapResponse.ok) {
      const errorText = await swapResponse.text();
      throw new Error(`Failed to create swap transaction: ${errorText}`);
    }
    
    const swapResponseData = await swapResponse.json();

    console.log('✅ Swap transaction created');

    if (!swapResponseData || !swapResponseData.swapTransaction) {
      throw new Error('Invalid swap transaction response from Jupiter');
    }

    // Return the transaction that needs to be signed by the user
    return NextResponse.json({
      success: true,
      transaction: swapResponseData.swapTransaction,
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
