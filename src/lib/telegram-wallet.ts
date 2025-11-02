import { Keypair } from '@solana/web3.js';
import { encrypt, decrypt } from './encryption';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a new Solana wallet for a Telegram user
 */
export async function createTelegramWallet(telegramId: string, userInfo: {
  username?: string;
  firstName?: string;
  lastName?: string;
}): Promise<{ publicKey: string; address: string }> {
  try {
    // Generate new keypair
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toString();
    const privateKeyArray = Array.from(keypair.secretKey);
    const privateKeyString = JSON.stringify(privateKeyArray);

    // Encrypt the private key
    const { encrypted, iv } = encrypt(privateKeyString);

    // Check if user already exists
    const existingUser = await prisma.telegramUser.findUnique({
      where: { telegramId }
    });

    if (existingUser) {
      // Update existing user
      await prisma.telegramUser.update({
        where: { telegramId },
        data: {
          encryptedKey: encrypted,
          iv,
          publicKey,
          username: userInfo.username,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
        }
      });
    } else {
      // Create new user
      await prisma.telegramUser.create({
        data: {
          telegramId,
          username: userInfo.username,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          encryptedKey: encrypted,
          iv,
          publicKey,
        }
      });
    }

    return {
      publicKey,
      address: publicKey
    };
  } catch (error) {
    console.error('Error creating Telegram wallet:', error);
    throw new Error('Failed to create wallet');
  }
}

/**
 * Import a wallet from private key for a Telegram user
 */
export async function importTelegramWallet(
  telegramId: string,
  privateKeyString: string,
  userInfo: {
    username?: string;
    firstName?: string;
    lastName?: string;
  }
): Promise<{ publicKey: string; address: string }> {
  try {
    let keypair: Keypair;
    
    // Try parsing as JSON array first (our format)
    try {
      const privateKeyArray = JSON.parse(privateKeyString);
      keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
    } catch {
      // Try as base58 string
      try {
        const { Keypair: SolanaKeypair } = await import('@solana/web3.js');
        keypair = SolanaKeypair.fromSecretKey(
          Buffer.from(privateKeyString, 'base64')
        );
      } catch {
        throw new Error('Invalid private key format. Use JSON array or base64.');
      }
    }

    const publicKey = keypair.publicKey.toString();
    
    // Re-encrypt with our system
    const { encrypted, iv } = encrypt(JSON.stringify(Array.from(keypair.secretKey)));

    // Check if user already exists
    const existingUser = await prisma.telegramUser.findUnique({
      where: { telegramId }
    });

    if (existingUser) {
      // Update existing user
      await prisma.telegramUser.update({
        where: { telegramId },
        data: {
          encryptedKey: encrypted,
          iv,
          publicKey,
          username: userInfo.username,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
        }
      });
    } else {
      // Create new user
      await prisma.telegramUser.create({
        data: {
          telegramId,
          username: userInfo.username,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          encryptedKey: encrypted,
          iv,
          publicKey,
        }
      });
    }

    return {
      publicKey,
      address: publicKey
    };
  } catch (error) {
    console.error('Error importing Telegram wallet:', error);
    throw new Error(`Failed to import wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get Keypair from encrypted storage for a Telegram user
 */
export async function getTelegramWallet(telegramId: string): Promise<Keypair | null> {
  try {
    const user = await prisma.telegramUser.findUnique({
      where: { telegramId }
    });

    if (!user) {
      return null;
    }

    // Decrypt private key
    const decryptedKeyString = decrypt(user.encryptedKey, user.iv);
    const privateKeyArray = JSON.parse(decryptedKeyString);
    
    return Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
  } catch (error) {
    console.error('Error getting Telegram wallet:', error);
    return null;
  }
}

/**
 * Get public key (address) for a Telegram user
 */
export async function getTelegramWalletAddress(telegramId: string): Promise<string | null> {
  try {
    const user = await prisma.telegramUser.findUnique({
      where: { telegramId },
      select: { publicKey: true }
    });

    return user?.publicKey || null;
  } catch (error) {
    console.error('Error getting Telegram wallet address:', error);
    return null;
  }
}

/**
 * Check if user has a wallet
 */
export async function hasTelegramWallet(telegramId: string): Promise<boolean> {
  try {
    const user = await prisma.telegramUser.findUnique({
      where: { telegramId },
      select: { id: true }
    });
    return !!user;
  } catch {
    return false;
  }
}

