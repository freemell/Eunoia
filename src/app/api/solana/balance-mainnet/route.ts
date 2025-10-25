import { NextResponse } from 'next/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    console.log('Checking MAINNET balance for address:', address);
    const rpcUrl = 'https://api.mainnet-beta.solana.com';
    console.log('Using MAINNET RPC URL:', rpcUrl);
    
    const connection = new Connection(rpcUrl);
    const publicKey = new PublicKey(address);
    
    // Get balance in lamports
    const balance = await connection.getBalance(publicKey);
    console.log('Balance in lamports:', balance);
    
    // Convert to SOL
    const solBalance = balance / LAMPORTS_PER_SOL;
    console.log('Balance in SOL:', solBalance);

    return NextResponse.json({
      address,
      balance: solBalance,
      lamports: balance,
      network: 'mainnet',
      success: true
    });

  } catch (error) {
    console.error('Mainnet balance check error:', error);
    return NextResponse.json(
      { error: `Failed to get mainnet balance: ${error instanceof Error ? error.message : 'Unknown error'}`, success: false },
      { status: 500 }
    );
  }
}

