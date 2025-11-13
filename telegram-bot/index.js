import { Bot } from 'grammy';
import { config } from 'dotenv';
import { createTelegramWallet, importTelegramWallet, getTelegramWallet, getTelegramWalletAddress, hasTelegramWallet } from './lib/wallet.js';
import { sendSOLTransaction, getBalance } from './lib/solana.js';
import { 
  handleStart, 
  handleBalance, 
  handleCreateWallet, 
  handleImportWallet,
  handleSendSOL,
  handleAIMessage,
  handleGroupChatMessage,
  handleSettings,
  getMainMenu,
  getWalletMenu,
  getBackMenu
} from './lib/handlers.js';
import { isGroupChat } from './lib/group-chat.js';

// Load environment variables
config();

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN is not set!');
  process.exit(1);
}

// Get bot username for mentions
let botUsername = 'askmerlin_bot'; // Default fallback
bot.api.getMe().then(me => {
  botUsername = me.username;
  console.log(`✅ Bot username: @${botUsername}`);
}).catch(err => {
  console.warn('⚠️ Could not get bot username, using default:', err);
});

// User session states
const userSessions = new Map();

function getSession(telegramId) {
  if (!userSessions.has(telegramId)) {
    userSessions.set(telegramId, { telegramId, state: 'idle' });
  }
  return userSessions.get(telegramId);
}

function setSession(telegramId, session) {
  const current = getSession(telegramId);
  userSessions.set(telegramId, { ...current, ...session });
}

function clearSession(telegramId) {
  userSessions.set(telegramId, { telegramId, state: 'idle' });
}

// Command handlers are now imported from lib/handlers.js

async function handleCallbackQuery(ctx) {
  const telegramId = ctx.from.id.toString();
  const callbackData = ctx.callbackQuery.data;
  const session = getSession(telegramId);

  await ctx.answerCallbackQuery();

  try {
    switch (callbackData) {
      case 'main_menu':
        clearSession(telegramId);
        await ctx.editMessageText('Welcome to Merlin! Choose an action:', {
          reply_markup: getMainMenu()
        });
        break;

      case 'balance':
        await handleBalance(ctx);
        break;

      case 'create_wallet':
        await handleCreateWallet(ctx);
        break;

      case 'swap':
    await ctx.editMessageText(
      `🔄 *How to Swap with Merlin*\n\n` +
      `1. Confirm your Merlin wallet holds enough SOL for the swap and fees.\n` +
      `2. Ask Merlin in chat, for example: "swap 0.1 SOL to USDC" or "buy 25 bonk".\n` +
      `3. For selling, you can say "sell 50% BONK" and Merlin calculates the amount.\n` +
      `4. Review the token mint address to avoid scams; swaps execute immediately.\n\n` +
      `⚠️ Always double-check token symbols or mint addresses before swapping.`,
      {
        parse_mode: 'Markdown',
        reply_markup: getMainMenu()
      }
    );
        break;

      case 'bridge':
    await ctx.editMessageText(
      `🌉 *How to Bridge with Merlin*\n\n` +
      `1. Ensure your Merlin wallet holds at least *0.1 SOL* for bridge and network fees.\n` +
      `2. Ask Merlin in chat, for example: "bridge 0.1 SOL from solana to bsc 0xYourEVMAddress".\n` +
      `3. Double-check the destination address—bridge transfers cannot be reversed.\n` +
      `4. Leave a small SOL buffer so future transactions and swaps still succeed.\n\n` +
      `⚠️ Always verify chain names and addresses before bridging to avoid losing funds.`,
      {
        parse_mode: 'Markdown',
        reply_markup: getMainMenu()
      }
    );
        break;

      case 'settings':
        await handleSettings(ctx, { edit: true });
        break;

      case 'import_wallet':
        setSession(telegramId, { state: 'waiting_for_import_key' });
        await ctx.editMessageText(
          `📥 *Import Wallet*\n\n` +
          `Send your private key (JSON array format):\n` +
          `Example: [123,45,67,...]\n\n` +
          `⚠️ Make sure you trust this bot!`,
          {
            parse_mode: 'Markdown',
            reply_markup: getBackMenu()
          }
        );
        break;

      case 'send':
        const hasWallet = await hasTelegramWallet(telegramId);
        if (!hasWallet) {
          await ctx.editMessageText('❌ No wallet found. Please create or import a wallet first.', {
            reply_markup: getWalletMenu()
          });
          break;
        }
        setSession(telegramId, { state: 'waiting_for_send_amount', data: {} });
        await ctx.editMessageText(
          `📤 *Send SOL*\n\n` +
          `Enter the amount to send (e.g., 0.5 or "all"):`,
          {
            parse_mode: 'Markdown',
            reply_markup: getBackMenu()
          }
        );
        break;

      default:
        await ctx.editMessageText('Unknown action. Try again.', {
          reply_markup: getMainMenu()
        });
    }
  } catch (error) {
    console.error('Error handling callback:', error);
    await ctx.editMessageText('❌ An error occurred. Please try again.', {
      reply_markup: getBackMenu()
    });
  }
}

async function handleMessage(ctx) {
  const telegramId = ctx.from.id.toString();
  const messageText = ctx.message?.text || '';
  const session = getSession(telegramId);

  try {
    // Handle group chat messages first
    if (isGroupChat(ctx)) {
      await handleGroupChatMessage(ctx, botUsername);
      return;
    }
    
    // Handle commands (private chat only)
    if (messageText.startsWith('/')) {
      const command = messageText.split(' ')[0];
      
      switch (command) {
        case '/start':
          await handleStart(ctx, session);
          return;
        case '/help':
          await ctx.reply(
            `🧙‍♂️ *Merlin Bot Commands*\n\n` +
            `*/start* - Start the bot\n` +
            `*/wallet* - Manage your wallet\n` +
            `*/balance* - Check your SOL balance\n` +
            `*/help* - Show this help message`,
            {
              parse_mode: 'Markdown',
              reply_markup: getMainMenu()
            }
          );
          return;
        case '/balance':
          await handleBalance(ctx);
          return;
        default:
          await ctx.reply('Unknown command. Use /help to see available commands.', {
            reply_markup: getBackMenu()
          });
      }
      return;
    }

    // Handle state-based input
    if (session.state === 'waiting_for_import_key') {
      const success = await handleImportWallet(ctx, messageText);
      if (success) {
        clearSession(telegramId);
      }
      return;
    }

    if (session.state === 'waiting_for_send_amount') {
      setSession(telegramId, { state: 'waiting_for_send_to', data: { ...session.data, amount: messageText } });
      await ctx.reply(`📤 Enter recipient address or .sol domain:`, {
        reply_markup: getBackMenu()
      });
      return;
    }

    if (session.state === 'waiting_for_send_to') {
      const success = await handleSendSOL(ctx, session, session.data?.amount || '0', messageText);
      if (success) {
        clearSession(telegramId);
      }
      return;
    }

    // Default: Process with AI for natural language understanding
    await handleAIMessage(ctx, messageText, session, (telegramId, sessionUpdate) => {
      setSession(telegramId, sessionUpdate);
    });

  } catch (error) {
    console.error('Error handling message:', error);
    await ctx.reply('❌ An error occurred. Please try again.', {
      reply_markup: getBackMenu()
    });
  }
}

// Set up bot handlers
bot.on('message', handleMessage);
bot.on('callback_query', handleCallbackQuery);

// Error handling
bot.catch((err) => {
  console.error('Telegram bot error:', err);
});

// Export handlers for webhook mode
export { handleMessage, handleCallbackQuery };

// Start bot (only if not in webhook mode)
if (process.env.USE_WEBHOOK !== 'true') {
  console.log('🤖 Starting Merlin Telegram Bot (Polling mode)...');
  bot.start({
    onStart: (botInfo) => {
      console.log(`✅ Bot started successfully! @${botInfo.username}`);
      console.log('📱 Bot is ready! Send /start to test.');
    }
  });
} else {
  console.log('🤖 Bot initialized in webhook mode');
}

