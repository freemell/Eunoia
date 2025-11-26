import { Keypair } from '@solana/web3.js';
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from './encryption.js';

const prisma = new PrismaClient();

export async function createTelegramWallet(telegramId, userInfo) {
  try {
    // Check if user already has a wallet
    const existingUser = await prisma.telegramUser.findUnique({
      where: { telegramId }
    });

    if (existingUser && existingUser.publicKey) {
      // User already has a wallet - just update their info (username, name) but keep the same wallet
      await prisma.telegramUser.update({
        where: { telegramId },
        data: {
          username: userInfo.username,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
        }
      });
      return { publicKey: existingUser.publicKey, address: existingUser.publicKey, isNew: false };
    }

    // Create new wallet
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toString();
    const privateKeyArray = Array.from(keypair.secretKey);
    const privateKeyString = JSON.stringify(privateKeyArray);

    const { encrypted, iv } = encrypt(privateKeyString);

    if (existingUser) {
      // User exists but no wallet - add wallet to existing user
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
      // Create new user with wallet
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

    return { publicKey, address: publicKey, isNew: true };
  } catch (error) {
    console.error('Error creating wallet:', error);
    throw new Error('Failed to create wallet');
  }
}

export async function importTelegramWallet(telegramId, privateKeyString, userInfo) {
  try {
    let keypair;
    
    try {
      const privateKeyArray = JSON.parse(privateKeyString);
      keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
    } catch {
      throw new Error('Invalid private key format. Use JSON array format.');
    }

    const publicKey = keypair.publicKey.toString();
    const { encrypted, iv } = encrypt(JSON.stringify(Array.from(keypair.secretKey)));

    const existingUser = await prisma.telegramUser.findUnique({
      where: { telegramId }
    });

    if (existingUser) {
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

    return { publicKey, address: publicKey };
  } catch (error) {
    console.error('Error importing wallet:', error);
    throw new Error(`Failed to import wallet: ${error.message}`);
  }
}

export async function getTelegramWallet(telegramId) {
  try {
    const user = await prisma.telegramUser.findUnique({
      where: { telegramId }
    });

    if (!user) {
      return null;
    }

    const decryptedKeyString = decrypt(user.encryptedKey, user.iv);
    const privateKeyArray = JSON.parse(decryptedKeyString);
    
    return Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
  } catch (error) {
    console.error('Error getting wallet:', error);
    return null;
  }
}

export async function getTelegramWalletAddress(telegramId) {
  try {
    const user = await prisma.telegramUser.findUnique({
      where: { telegramId },
      select: { publicKey: true }
    });

    return user?.publicKey || null;
  } catch (error) {
    console.error('Error getting wallet address:', error);
    return null;
  }
}

export async function hasTelegramWallet(telegramId) {
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



