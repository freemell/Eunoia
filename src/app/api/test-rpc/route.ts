import { NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';

export async function GET() {
  const rpcEndpoints = [
    'https://api.mainnet-beta.solana.com',
    'https://rpc.ankr.com/solana',
    'https://solana-api.projectserum.com',
    'https://solana.public-rpc.com'
  ];

  const results = [];

  for (const rpcUrl of rpcEndpoints) {
    try {
      console.log('Testing RPC URL:', rpcUrl);
      const connection = new Connection(rpcUrl, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 5000,
      });
      
      // Test with a simple request
      const slot = await connection.getSlot();
      results.push({
        url: rpcUrl,
        status: 'success',
        slot: slot
      });
      console.log(`✅ ${rpcUrl} - Slot: ${slot}`);
    } catch (error) {
      results.push({
        url: rpcUrl,
        status: 'failed',
        error: error.message
      });
      console.log(`❌ ${rpcUrl} - Error: ${error.message}`);
    }
  }

  return NextResponse.json({
    results,
    working: results.filter(r => r.status === 'success').length,
    total: results.length
  });
}

