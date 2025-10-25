import { NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';

export async function GET() {
  try {
    const rpcEndpoints = [
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com',
      'https://solana.public-rpc.com'
    ];
    
    let connection;
    let lastError;
    
    for (const rpcUrl of rpcEndpoints) {
      try {
        console.log('Trying RPC URL:', rpcUrl);
        connection = new Connection(rpcUrl, 'confirmed');
        // Test connection by getting a recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        console.log('Successfully got blockhash from:', rpcUrl);
        break; // Success, exit loop
      } catch (error) {
        console.log(`RPC endpoint ${rpcUrl} failed:`, error instanceof Error ? error.message : 'Unknown error');
        lastError = error;
        continue; // Try next endpoint
      }
    }
    
    if (!connection) {
      throw lastError || new Error('All RPC endpoints failed');
    }
    
    const { blockhash } = await connection.getLatestBlockhash();
    
    return NextResponse.json({
      success: true,
      blockhash,
      rpc: connection.rpcEndpoint
    });
  } catch (error) {
    console.error('Blockhash API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error', success: false },
      { status: 500 }
    );
  }
}






