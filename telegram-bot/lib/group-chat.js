import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Check if message is from a group chat
 */
export function isGroupChat(ctx) {
  const chatType = ctx.chat?.type;
  return chatType === 'group' || chatType === 'supergroup';
}

/**
 * Check if bot is mentioned in the message
 */
export function isBotMentioned(ctx, botUsername) {
  const messageText = ctx.message?.text || '';
  const entities = ctx.message?.entities || [];
  
  // Check for mention entities
  for (const entity of entities) {
    if (entity.type === 'mention') {
      const mention = messageText.substring(entity.offset, entity.offset + entity.length);
      if (mention.toLowerCase() === `@${botUsername.toLowerCase()}`) {
        return true;
      }
    }
  }
  
  // Also check if bot is directly mentioned in text
  if (messageText.toLowerCase().includes(`@${botUsername.toLowerCase()}`)) {
    return true;
  }
  
  return false;
}

/**
 * Extract mentioned usernames from message
 */
export function extractMentionedUsernames(ctx) {
  const messageText = ctx.message?.text || '';
  const entities = ctx.message?.entities || [];
  const usernames = [];
  
  for (const entity of entities) {
    if (entity.type === 'mention') {
      const mention = messageText.substring(entity.offset, entity.offset + entity.length);
      // Remove @ symbol
      const username = mention.substring(1);
      usernames.push(username);
    }
  }
  
  return usernames;
}

/**
 * Resolve username to Telegram user ID (secure - uses user ID not username)
 */
export async function resolveUsernameToUserId(username, bot) {
  try {
    // First, try to find in database
    const user = await prisma.telegramUser.findFirst({
      where: {
        username: username.toLowerCase()
      },
      select: {
        telegramId: true
      }
    });
    
    if (user) {
      return user.telegramId;
    }
    
    // If not in database, try to resolve via Telegram API
    // Note: This requires the user to have interacted with the bot
    // For security, we'll primarily use database lookups
    
    return null;
  } catch (error) {
    console.error('Error resolving username:', error);
    return null;
  }
}

/**
 * Get user by Telegram user ID (secure lookup)
 */
export async function getUserByTelegramId(telegramId) {
  try {
    const user = await prisma.telegramUser.findUnique({
      where: {
        telegramId: telegramId.toString()
      }
    });
    return user;
  } catch (error) {
    console.error('Error getting user by Telegram ID:', error);
    return null;
  }
}

/**
 * Get user by username (for lookups)
 */
export async function getUserByUsername(username) {
  try {
    const user = await prisma.telegramUser.findFirst({
      where: {
        username: username.toLowerCase()
      }
    });
    return user;
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
}

/**
 * Register or update group chat
 */
export async function registerGroupChat(ctx) {
  try {
    const chatId = ctx.chat.id.toString();
    const chatType = ctx.chat.type;
    const title = ctx.chat.title;
    
    await prisma.groupChat.upsert({
      where: { chatId },
      update: {
        title,
        type: chatType,
        updatedAt: new Date()
      },
      create: {
        chatId,
        title,
        type: chatType
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error registering group chat:', error);
    return false;
  }
}

/**
 * Update user's username in database (for @username mentions)
 */
export async function updateUserUsername(telegramId, username) {
  try {
    await prisma.telegramUser.update({
      where: { telegramId: telegramId.toString() },
      data: { username: username?.toLowerCase() || null }
    });
    return true;
  } catch (error) {
    console.error('Error updating username:', error);
    return false;
  }
}

/**
 * Resolve recipient from message (can be @username or user ID)
 */
export async function resolveRecipient(mentionText, bot) {
  // Remove @ if present
  const username = mentionText.replace('@', '').toLowerCase();
  
  // Try to find user by username in database
  const user = await getUserByUsername(username);
  
  if (user) {
    return {
      telegramId: user.telegramId,
      username: user.username,
      publicKey: user.publicKey,
      hasWallet: !!user.publicKey
    };
  }
  
  return null;
}



