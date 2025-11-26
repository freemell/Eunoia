import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PublicKey } from '@solana/web3.js';

const prisma = new PrismaClient();

// Token symbol to address mapping (for resolving symbols to addresses)
const tokenMints: Record<string, string> = {
  'SOL': 'So11111111111111111111111111111111111111112',
  'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  'WIF': 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
};

/**
 * Resolve token identifier to contract address
 * Accepts: token symbol, token name, or contract address
 */
function resolveTokenAddress(tokenIdentifier: string): string {
  // If it's already a known symbol, return the mapped address
  const upperToken = tokenIdentifier.toUpperCase();
  if (tokenMints[upperToken]) {
    return tokenMints[upperToken];
  }
  
  // Otherwise, assume it's a contract address and validate it
  try {
    // Validate it's a valid Solana public key
    new PublicKey(tokenIdentifier);
    return tokenIdentifier;
  } catch (error) {
    throw new Error(`Invalid token identifier: ${tokenIdentifier}. Please provide a valid token symbol or contract address.`);
  }
}

export async function POST(req: Request) {
  try {
    const {
      walletAddress,
      userId,
      telegramId,
      tokenAddress,
      tokenSymbol,
      orderType, // 'buy' or 'sell'
      triggerType, // 'market_cap' or 'price'
      triggerValue, // e.g., "50" for 50k market cap, or "0.001" for price
      amount, // e.g., "0.1" SOL or "50%" for percentage
      amountType = 'fixed', // 'fixed' or 'percentage'
    } = await req.json();

    // Validation
    if (!walletAddress || !tokenAddress || !orderType || !triggerType || !triggerValue) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: walletAddress, tokenAddress, orderType, triggerType, triggerValue'
      }, { status: 400 });
    }

    if (!['buy', 'sell'].includes(orderType)) {
      return NextResponse.json({
        success: false,
        error: 'orderType must be "buy" or "sell"'
      }, { status: 400 });
    }

    if (!['market_cap', 'price'].includes(triggerType)) {
      return NextResponse.json({
        success: false,
        error: 'triggerType must be "market_cap" or "price"'
      }, { status: 400 });
    }

    // Validate and resolve token address (supports both symbols and contract addresses)
    let resolvedTokenAddress: string;
    try {
      resolvedTokenAddress = resolveTokenAddress(tokenAddress);
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Invalid token address'
      }, { status: 400 });
    }

    // Validate wallet address is a valid Solana address
    try {
      new PublicKey(walletAddress);
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid wallet address. Please provide a valid Solana address.'
      }, { status: 400 });
    }

    // Create limit order (use resolved token address)
    const limitOrder = await prisma.limitOrder.create({
      data: {
        walletAddress,
        userId: userId || null,
        telegramId: telegramId || null,
        tokenAddress: resolvedTokenAddress, // Use resolved address
        tokenSymbol: tokenSymbol || null,
        orderType,
        triggerType,
        triggerValue,
        amount: amount || null,
        amountType: amountType || 'fixed',
        status: 'active',
      },
    });

    return NextResponse.json({
      success: true,
      order: limitOrder,
      message: `Limit order created: ${orderType} ${amount || 'all'} when ${tokenSymbol || 'token'} ${triggerType} reaches ${triggerValue}${triggerType === 'market_cap' ? 'k' : ''}`
    });
  } catch (error) {
    console.error('Error creating limit order:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create limit order'
    }, { status: 500 });
  }
}

