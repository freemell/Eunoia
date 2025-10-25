import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    // Mock balance for testing when RPC endpoints are down
    const mockBalance = Math.random() * 10; // Random balance between 0-10 SOL
    
    return NextResponse.json({
      address,
      balance: mockBalance,
      lamports: Math.floor(mockBalance * 1000000000), // Convert to lamports
      success: true,
      mock: true
    });

  } catch (error) {
    console.error('Balance fallback error:', error);
    return NextResponse.json(
      { error: `Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`, success: false },
      { status: 500 }
    );
  }
}

