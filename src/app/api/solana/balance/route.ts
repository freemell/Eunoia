import { NextResponse } from 'next/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    console.log('Checking balance for address:', address);
    
    // Try multiple RPC endpoints for better reliability
    const rpcEndpoints = [
        'https://api.mainnet-beta.solana.com',
        'https://rpc.ankr.com/solana',
        'https://solana-api.projectserum.com',
        'https://solana.public-rpc.com'
    ];
    
    let connection;
    let balance;
    let lastError;
    
    for (const rpcUrl of rpcEndpoints) {
        try {
            console.log('Trying RPC URL:', rpcUrl);
            connection = new Connection(rpcUrl, {
                commitment: 'confirmed',
                confirmTransactionInitialTimeout: 10000, // 10 second timeout
            });
            const publicKey = new PublicKey(address);
            
            // Get balance in lamports with timeout
            const balancePromise = connection.getBalance(publicKey);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 10000)
            );
            
            balance = await Promise.race([balancePromise, timeoutPromise]) as number;
            console.log('Balance in lamports:', balance);
            break; // Success, exit loop
        } catch (error) {
            console.log(`RPC endpoint ${rpcUrl} failed:`, error instanceof Error ? error.message : 'Unknown error');
            // Check if error message contains HTML (indicates server error page)
            if (error instanceof Error && error.message && error.message.includes('<!DOCTYPE')) {
                console.log(`RPC endpoint ${rpcUrl} returned HTML error page`);
            }
            lastError = error;
            continue; // Try next endpoint
        }
    }
    
    if (balance === undefined) {
        throw lastError || new Error('All RPC endpoints failed');
    }
    
    // Convert to SOL
    const solBalance = balance / LAMPORTS_PER_SOL;
    console.log('Balance in SOL:', solBalance);

    return NextResponse.json({
      address,
      balance: solBalance,
      lamports: balance,
      success: true
    });

  } catch (error) {
    console.error('Balance check error:', error);
    return NextResponse.json(
      { error: `Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`, success: false },
      { status: 500 }
    );
  }
}
