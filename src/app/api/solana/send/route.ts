import { NextResponse } from 'next/server';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { SolanaDomainResolver } from '@/lib/domain-resolver';

export async function POST(req: Request) {
  try {
    const { from, to, amount, domain } = await req.json();

    if (!from || !amount) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Resolve domain if provided
    let resolvedTo = to;
    if (domain) {
      const domainResult = await SolanaDomainResolver.resolveDomain(domain);
      if (!domainResult.success) {
        return NextResponse.json({ 
          error: `Failed to resolve domain ${domain}: ${domainResult.error}` 
        }, { status: 400 });
      }
      resolvedTo = domainResult.address;
    }

    if (!resolvedTo) {
      return NextResponse.json({ error: 'Missing recipient address or domain' }, { status: 400 });
    }

    // Try multiple RPC endpoints for better reliability
    const rpcEndpoints = [
        'https://api.mainnet-beta.solana.com',
        'https://rpc.ankr.com/solana',
        'https://solana-api.projectserum.com',
        'https://solana.public-rpc.com'
    ];
    
    let connection;
    let lastError;
    
    for (const rpcUrl of rpcEndpoints) {
        try {
            console.log('Trying RPC URL for send:', rpcUrl);
            connection = new Connection(rpcUrl);
            // Test connection by getting recent blockhash
            await connection.getLatestBlockhash();
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
    
    // Validate addresses
    const fromPubkey = new PublicKey(from);
    const toPubkey = new PublicKey(resolvedTo);
    
    // Get current balance
    const balance = await connection.getBalance(fromPubkey);
    const solBalance = balance / LAMPORTS_PER_SOL;
    
    // Calculate amount to send
    let lamports;
    if (amount === 'all') {
      lamports = balance - 5000; // Leave some for fees
    } else {
      lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
    }
    
    if (lamports > balance) {
      return NextResponse.json({ 
        error: 'Insufficient balance', 
        currentBalance: solBalance,
        success: false 
      }, { status: 400 });
    }
    
    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      })
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    // Serialize transaction for frontend signing
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

        // Log the transaction
        try {
          await fetch('/api/transactions/simple-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: from,
              type: 'send',
              fromChain: 'solana',
              token: 'SOL',
              amount: amount.toString(),
              fromAddress: from,
              toAddress: to,
              status: 'pending',
              fee: '0.000005' // Estimated fee
            })
          });
        } catch (logError) {
          console.error('Failed to log transaction:', logError);
        }

        return NextResponse.json({
          transaction: serializedTransaction.toString('base64'),
          message: `Transaction prepared: Send ${amount} SOL from ${from} to ${to}`,
          success: true
        });

  } catch (error) {
    console.error('Send SOL error:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction', success: false },
      { status: 500 }
    );
  }
}
