/**
 * Swap Service
 * Executes token swaps directly with a keypair (for server-side operations like limit orders)
 */

import { Keypair, Connection, VersionedTransaction, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';

const LAMPORTS_PER_SOL = 1_000_000_000;

// Token mint addresses
const tokenMints: Record<string, string> = {
  'SOL': 'So11111111111111111111111111111111111111112',
  'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  'WIF': 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
};

const tokenDecimals: Record<string, number> = {
  'SOL': 9,
  'USDC': 6,
  'USDT': 6,
  'BONK': 5,
  'WIF': 6,
};

function getRpcUrl(): string {
  return process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
}

function getConnection(): Connection {
  return new Connection(getRpcUrl(), 'confirmed');
}

async function getTokenBalance(userPublicKey: PublicKey, tokenMint: string): Promise<{ balance: number; decimals: number }> {
  try {
    const mintAddress = tokenMints[tokenMint.toUpperCase()] || tokenMint;
    const mintPubkey = new PublicKey(mintAddress);
    const tokenAccount = await getAssociatedTokenAddress(mintPubkey, userPublicKey);
    const connection = getConnection();
    const accountInfo = await getAccount(connection, tokenAccount);
    const decimals = tokenDecimals[tokenMint.toUpperCase()] || 6;
    const balance = Number(accountInfo.amount) / Math.pow(10, decimals);
    return { balance, decimals };
  } catch (error) {
    if (error instanceof Error && (error.message.includes('could not find account') || error.message.includes('Invalid param'))) {
      return { balance: 0, decimals: tokenDecimals[tokenMint.toUpperCase()] || 6 };
    }
    throw error;
  }
}

async function getBalance(address: string): Promise<number> {
  const connection = getConnection();
  const publicKey = new PublicKey(address);
  const balanceLamports = await connection.getBalance(publicKey, 'confirmed');
  return balanceLamports / LAMPORTS_PER_SOL;
}

export async function executeSwap(
  keypair: Keypair,
  fromToken: string,
  toToken: string,
  amount: string | number,
  percentage?: number | null
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    const userPublicKey = keypair.publicKey;
    const fromMint = tokenMints[fromToken.toUpperCase()] || fromToken;
    const toMint = tokenMints[toToken.toUpperCase()] || toToken;

    let amountNum: number;
    let amountInSmallestUnit: number;

    // Handle percentage-based swaps
    if (percentage !== null && percentage !== undefined && percentage > 0 && percentage <= 100) {
      let currentBalance: number;
      let decimals: number;

      if (fromToken.toUpperCase() === 'SOL') {
        currentBalance = await getBalance(userPublicKey.toString());
        decimals = 9;
        amountNum = (currentBalance * percentage) / 100;
        amountInSmallestUnit = Math.floor(amountNum * 1e9);
      } else {
        const tokenBalance = await getTokenBalance(userPublicKey, fromToken);
        currentBalance = tokenBalance.balance;
        decimals = tokenBalance.decimals;
        amountNum = (currentBalance * percentage) / 100;
        amountInSmallestUnit = Math.floor(amountNum * Math.pow(10, decimals));
      }
    } else {
      // Handle regular amount-based swaps
      amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Invalid amount');
      }

      let decimals = tokenDecimals[fromToken.toUpperCase()] || 6;
      if (fromToken.toUpperCase() !== 'SOL' && !tokenDecimals[fromToken.toUpperCase()]) {
        try {
          const { decimals: fetchedDecimals } = await getTokenBalance(userPublicKey, fromToken);
          decimals = fetchedDecimals;
        } catch {
          console.warn(`Could not fetch decimals for ${fromToken}, using default: 6`);
        }
      }

      if (fromToken.toUpperCase() === 'SOL') {
        amountInSmallestUnit = Math.floor(amountNum * 1e9);
      } else {
        amountInSmallestUnit = Math.floor(amountNum * Math.pow(10, decimals));
      }
    }

    if (amountInSmallestUnit <= 0) {
      throw new Error('Amount too small to swap');
    }

    // Get quote from Jupiter
    const quoteUrl = `https://lite-api.jup.ag/swap/v1/quote?` + new URLSearchParams({
      inputMint: fromMint,
      outputMint: toMint,
      amount: amountInSmallestUnit.toString(),
      slippageBps: '50',
    });

    const quoteResponse = await fetch(quoteUrl);
    if (!quoteResponse.ok) {
      const errorText = await quoteResponse.text();
      throw new Error(`Failed to get quote: ${errorText}`);
    }
    const quote = await quoteResponse.json();

    if (!quote || !quote.outAmount) {
      throw new Error('Invalid quote response from Jupiter');
    }

    // Get swap transaction
    const swapUrl = 'https://lite-api.jup.ag/swap/v1/swap';
    const swapResponse = await fetch(swapUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: userPublicKey.toString(),
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

    if (!swapResponseData || !swapResponseData.swapTransaction) {
      throw new Error('Invalid swap transaction response from Jupiter');
    }

    // Deserialize and sign transaction
    const swapTransactionBuf = Buffer.from(swapResponseData.swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    transaction.sign([keypair]);

    // Send transaction
    const connection = getConnection();
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    // Wait for confirmation
    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, 'confirmed');

    return { success: true, signature };
  } catch (error) {
    console.error('Swap execution error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Swap failed'
    };
  }
}

