import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Solana connection
export const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com');

// Get SOL balance
export async function getBalance(publicKey: PublicKey): Promise<number> {
  try {
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error getting balance:', error);
    throw error;
  }
}

// Create send SOL transaction
export async function createSendTransaction(
  from: PublicKey,
  to: PublicKey,
  amount: number
): Promise<Transaction> {
  try {
    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports,
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = from;

    return transaction;
  } catch (error) {
    console.error('Error creating send transaction:', error);
    throw error;
  }
}

// Get transaction history
export async function getTransactionHistory(publicKey: PublicKey, limit: number = 10) {
  try {
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit });
    
    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        try {
          const tx = await connection.getTransaction(sig.signature);
          return {
            signature: sig.signature,
            slot: sig.slot,
            blockTime: sig.blockTime,
            confirmationStatus: sig.confirmationStatus,
            transaction: tx
          };
        } catch (error) {
          console.error('Error fetching transaction:', error);
          return null;
        }
      })
    );

    return transactions.filter(tx => tx !== null);
  } catch (error) {
    console.error('Error getting transaction history:', error);
    throw error;
  }
}

// Validate Solana address
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

