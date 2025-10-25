// Simple in-memory database fallback
interface Transaction {
  id: string;
  walletAddress: string;
  type: string;
  fromChain?: string;
  toChain?: string;
  token: string;
  amount: string;
  fromAddress?: string;
  toAddress?: string;
  txHash?: string;
  status: string;
  bridgeTxId?: string;
  protocol?: string;
  fee?: string;
  blockNumber?: string;
  gasUsed?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Wallet {
  id: string;
  address: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

class MemoryDatabase {
  private transactions: Map<string, Transaction> = new Map();
  private wallets: Map<string, Wallet> = new Map();

  // Transaction methods
  async createTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const now = new Date();
    
    const transaction: Transaction = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.transactions.set(id, transaction);
    return transaction;
  }

  async findManyTransactions(where: { walletAddress: string }, options: { orderBy: { createdAt: string }, take: number, skip: number }): Promise<Transaction[]> {
    const transactions = Array.from(this.transactions.values())
      .filter(tx => tx.walletAddress === where.walletAddress)
      .sort((a, b) => {
        if (options.orderBy.createdAt === 'desc') {
          return b.createdAt.getTime() - a.createdAt.getTime();
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      })
      .slice(options.skip, options.skip + options.take);
    
    return transactions;
  }

  async countTransactions(where: { walletAddress: string }): Promise<number> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.walletAddress === where.walletAddress).length;
  }

  // Wallet methods
  async upsertWallet(data: { address: string, userId: string }): Promise<Wallet> {
    const existing = Array.from(this.wallets.values())
      .find(w => w.address === data.address);
    
    if (existing) {
      return existing;
    }
    
    const id = `wallet_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const now = new Date();
    
    const wallet: Wallet = {
      id,
      address: data.address,
      userId: data.userId,
      createdAt: now,
      updatedAt: now
    };
    
    this.wallets.set(id, wallet);
    return wallet;
  }

  async findUniqueWallet(where: { address: string }): Promise<Wallet | null> {
    const wallet = Array.from(this.wallets.values())
      .find(w => w.address === where.address);
    
    return wallet || null;
  }
}

export const memoryDb = new MemoryDatabase();

