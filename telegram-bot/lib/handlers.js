import { processMessageWithAI } from './ai.js';
import { createTelegramWallet, importTelegramWallet, getTelegramWallet, getTelegramWalletAddress, hasTelegramWallet } from './wallet.js';
import { sendSOLTransaction, getBalance, swapTokens, getTransactionHistory } from './solana.js';
import { merlinBridge } from './bridge.js';
import { InlineKeyboard } from 'grammy';
import { escapeUsername, safeMarkdown } from './utils.js';
import { 
  isGroupChat, 
  isBotMentioned, 
  extractMentionedUsernames, 
  resolveRecipient,
  getUserByTelegramId,
  registerGroupChat,
  updateUserUsername
} from './group-chat.js';

// Stylized inline keyboards
export function getMainMenu() {
  return new InlineKeyboard()
    .text('💰 Balance', 'balance')
    .text('📤 Send SOL', 'send')
    .row()
    .text('🔄 Swap Tokens', 'swap')
    .text('🌉 Bridge', 'bridge')
    .row()
    .text('📣 Socials', 'settings');
}

export function getWalletMenu() {
  return new InlineKeyboard()
    .text('🆕 Create Wallet', 'create_wallet')
    .row()
    .text('📥 Import Wallet', 'import_wallet')
    .row()
    .text('◀️ Back', 'main_menu');
}

export function getBackMenu() {
  return new InlineKeyboard()
    .text('◀️ Back to Menu', 'main_menu');
}

// Command handlers
export async function handleStart(ctx, session) {
  const telegramId = ctx.from.id.toString();
  const hasWallet = await hasTelegramWallet(telegramId);

  const welcomeMessage = `🧙‍♂️ *Welcome to Merlin!*\n\n` +
    `Your Solana Blockchain Assistant\n\n` +
    `${hasWallet ? '✅ Wallet connected' : '⚠️ No wallet found. Create or import one to get started.'}\n\n` +
    `Use the buttons below to interact, or chat with me naturally!`;

  if (hasWallet) {
    await ctx.reply(welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: getMainMenu()
    });
  } else {
    await ctx.reply(welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: getWalletMenu()
    });
  }
}

export async function handleBalance(ctx) {
  const telegramId = ctx.from.id.toString();
  const address = await getTelegramWalletAddress(telegramId);
  const isGroup = isGroupChat(ctx);
  
  if (!address) {
    const message = isGroup
      ? '❌ You need to create a wallet first! Say "@askmerlin_bot create wallet" or use /start to create your wallet.'
      : '❌ No wallet found. Please create or import a wallet first.';
    await ctx.reply(message, {
      reply_markup: isGroup ? undefined : getWalletMenu()
    });
    return;
  }

  try {
    console.log(`📊 Checking balance for user ${telegramId}, address: ${address}`);
    const balance = await getBalance(address);
    console.log(`✅ Balance result: ${balance} SOL`);
    
    const message = `💰 *Your Balance*\n\n` +
                   `Address: \`${address}\`\n` +
                   `Balance: *${balance.toFixed(4)} SOL*\n\n` +
                   `💡 *Tip:* If you recently sent SOL, it may take a few seconds to appear.`;
    
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: isGroup ? undefined : getMainMenu()
    });
  } catch (error) {
    console.error(`❌ Balance check failed for ${address}:`, error);
    await ctx.reply(
      `❌ Error fetching balance: ${error.message}\n\n` +
      `💡 *Troubleshooting:*\n` +
      `• Make sure you sent SOL to the correct address\n` +
      `• Wait a few moments and try again\n` +
      `• The bot uses Solana mainnet`,
      {
        parse_mode: 'Markdown',
        reply_markup: isGroup ? undefined : getMainMenu()
      }
    );
  }
}

export async function handleHistory(ctx, options = {}) {
  const telegramId = ctx.from.id.toString();
  const address = await getTelegramWalletAddress(telegramId);
  const isGroup = isGroupChat(ctx);

  if (!address) {
    const message = isGroup
      ? '❌ You need to create a wallet first! Say "@askmerlin_bot create wallet" or use /start to create your wallet.'
      : '❌ No wallet found. Please create or import a wallet first.';

    if (options.edit) {
      await ctx.editMessageText(message, {
        parse_mode: isGroup ? undefined : 'Markdown',
        reply_markup: isGroup ? undefined : getWalletMenu()
      });
    } else {
      await ctx.reply(message, {
        reply_markup: isGroup ? undefined : getWalletMenu()
      });
    }
    return;
  }

  try {
    const history = await getTransactionHistory(address, 10);

    let message = `📋 *Recent Transactions*\n\n` +
      `Address: \`${address}\`\n\n`;

    if (history.length === 0) {
      message += 'No transactions found yet. Once you start sending or receiving SOL, they will appear here.';
    } else {
      const lines = history.map((entry, index) => {
        const directionEmoji =
          entry.direction === 'in' ? '📥 Received' :
          entry.direction === 'out' ? '📤 Sent' : '🔁 Activity';

        const amount =
          typeof entry.amountChange === 'number'
            ? `${Math.abs(entry.amountChange).toFixed(4)} SOL`
            : 'Amount N/A';

        const timestamp = entry.blockTime
          ? new Date(entry.blockTime * 1000).toISOString().replace('T', ' ').replace('Z', ' UTC')
          : 'Time N/A';

        const status = entry.err ? '❌ Failed' : '✅ Confirmed';
        const link = `https://solscan.io/tx/${entry.signature}`;

        return `${index + 1}. ${directionEmoji}\n` +
          `   • Amount: *${amount}*\n` +
          `   • Status: ${status}\n` +
          `   • Time: ${timestamp}\n` +
          `   • [View on Solscan](${link})`;
      });

      message += lines.join('\n\n');
    }

    const payload = {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_markup: isGroup ? undefined : getMainMenu()
    };

    if (options.edit) {
      await ctx.editMessageText(message, payload);
    } else {
      await ctx.reply(message, payload);
    }
  } catch (error) {
    const errorMessage = `❌ Failed to load history: ${error.message}`;
    if (options.edit) {
      await ctx.editMessageText(errorMessage, {
        reply_markup: isGroup ? undefined : getBackMenu()
      });
    } else {
      await ctx.reply(errorMessage, {
        reply_markup: isGroup ? undefined : getBackMenu()
      });
    }
  }
}

export async function handleSettings(ctx, options = {}) {
  const message = `⚙️ *Merlin Settings*\n\n` +
    `🌐 Website: [askmerlin.dev](https://askmerlin.dev/)\n` +
    `🐦 Twitter: [@askmerlindev](https://x.com/askmerlindev)\n\n` +
    `More settings coming soon!`;

  const payload = {
    parse_mode: 'Markdown',
    disable_web_page_preview: false,
    reply_markup: isGroupChat(ctx) ? undefined : getMainMenu()
  };

  if (options.edit) {
    await ctx.editMessageText(message, payload);
  } else {
    await ctx.reply(message, payload);
  }
}

export async function handleCreateWallet(ctx) {
  const telegramId = ctx.from.id.toString();
  const isGroup = isGroupChat(ctx);
  const userInfo = {
    username: ctx.from.username,
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name,
  };

  try {
    const { publicKey, isNew } = await createTelegramWallet(telegramId, userInfo);
    
    // Check if wallet already existed (update vs create)
    const walletStatus = isNew ? 'Created Successfully' : 'Already Exists';
    const message = `✅ *Wallet ${walletStatus}!*\n\n` +
      `Your wallet address:\n\`${publicKey}\`\n\n` +
      `${isNew ? '⚠️ *Important:* Your private key is encrypted and stored securely. Never share it with anyone!' : 'ℹ️ This is your existing wallet. You can use it in both private chats and group chats!'}`;
    
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: isGroup ? undefined : getMainMenu()
    });
  } catch (error) {
    await ctx.reply(
      `❌ Failed to create wallet: ${error.message}`,
      {
        reply_markup: isGroup ? undefined : getBackMenu()
      }
    );
  }
}

export async function handleImportWallet(ctx, messageText) {
  const telegramId = ctx.from.id.toString();
  const userInfo = {
    username: ctx.from.username,
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name,
  };
  
  try {
    const { publicKey } = await importTelegramWallet(telegramId, messageText, userInfo);
    
    await ctx.reply(
      `✅ *Wallet Imported Successfully!*\n\n` +
      `Your wallet address:\n\`${publicKey}\``,
      {
        parse_mode: 'Markdown',
        reply_markup: getMainMenu()
      }
    );
    return true;
  } catch (error) {
    await ctx.reply(
      `❌ Failed to import wallet: ${error.message}\n\n` +
      `Please check your private key format and try again.`,
      {
        reply_markup: getBackMenu()
      }
    );
    return false;
  }
}

export async function handleSendSOL(ctx, session, amount, recipient, recipientUsername = null) {
  const telegramId = ctx.from.id.toString();
  const keypair = await getTelegramWallet(telegramId);
  
  if (!keypair) {
    const isGroup = isGroupChat(ctx);
    const message = isGroup 
      ? '❌ You need to create a wallet first! Say "@askmerlin_bot create wallet" or use /start to create your wallet.'
      : '❌ No wallet found. Please create or import a wallet first.';
    
    await ctx.reply(message, {
      reply_markup: isGroup ? undefined : getBackMenu()
    });
    return false;
  }

  // If recipient is a username, resolve it to an address
  let recipientAddress = recipient;
  let recipientInfo = null;
  
  if (recipientUsername) {
    recipientInfo = await resolveRecipient(recipientUsername);
    if (recipientInfo && recipientInfo.publicKey) {
      recipientAddress = recipientInfo.publicKey;
    } else {
      await ctx.reply(
        `❌ User @${escapeUsername(recipientUsername)} doesn't have a wallet yet. They need to create one first!`,
        { 
          parse_mode: 'Markdown',
          reply_markup: isGroupChat(ctx) ? undefined : getMainMenu() 
        }
      );
      return false;
    }
  }

  const result = await sendSOLTransaction(keypair, recipientAddress, amount);
  
  if (result.success && result.signature) {
    const solscanLink = `https://solscan.io/tx/${result.signature}`;
    const explorerLink = `https://explorer.solana.com/tx/${result.signature}`;
    
    // Escape username if present to prevent Markdown parsing errors
    const recipientDisplay = recipientUsername 
      ? `@${escapeUsername(recipientUsername)}` 
      : `\`${recipientAddress}\``;
    
    const message = `✅ *Transaction Successful!*\n\n` +
      `💰 Amount: *${amount} SOL*\n` +
      `📤 To: ${recipientDisplay}\n` +
      `🔗 Signature: \`${result.signature}\`\n\n` +
      `[🔍 View on Solscan](${solscanLink})\n` +
      `[🌐 View on Explorer](${explorerLink})`;
    
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: isGroupChat(ctx) ? undefined : getMainMenu()
    });
    
    // If sending to a username in group chat, notify the recipient via private message
    // This is the ONLY private message sent from group chat context (intentional notification)
    if (recipientInfo && recipientInfo.telegramId && isGroupChat(ctx) && recipientUsername) {
      try {
        const senderName = escapeUsername(ctx.from.first_name || ctx.from.username || 'someone');
        await ctx.api.sendMessage(
          recipientInfo.telegramId,
          `💰 You received ${amount} SOL from ${senderName} in a group chat!\n\n` +
          `[🔍 View Transaction](${solscanLink})`,
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('Error notifying recipient:', error);
        // User might have blocked the bot, that's okay - don't fail the transaction
      }
    }
    
    return true;
  } else {
    await ctx.reply(`❌ Transaction failed: ${result.error}`, {
      reply_markup: isGroupChat(ctx) ? undefined : getMainMenu()
    });
    return false;
  }
}

/**
 * Process AI action and execute it
 */
export async function handleAIAction(ctx, aiResult, session, setSessionFn) {
  const telegramId = ctx.from.id.toString();
  const { action, params, response } = aiResult;
  const isGroup = isGroupChat(ctx);

  // For swap, bridge, and send actions, skip sending the AI response and execute directly
  // For other actions, send the AI response first
  if (action !== 'swap' && action !== 'bridge' && action !== 'send') {
    // First, send the AI response (escape usernames to prevent Markdown parsing errors)
    // In group chats, only reply in the group chat, never send private messages
    const safeResponse = safeMarkdown(response, true);
    
    // Only reply in the chat where the message came from (group chat or private chat)
    if (isGroup) {
      // Group chat: reply in group only
      await ctx.reply(safeResponse, {
        parse_mode: 'Markdown',
        reply_markup: undefined // No inline keyboards in group chats
      });
    } else {
      // Private chat: normal reply with menu
      await ctx.reply(safeResponse, {
        parse_mode: 'Markdown',
        reply_markup: getMainMenu()
      });
    }
  }

  // Then execute the action if needed
  switch (action) {
    case 'balance':
      await handleBalance(ctx);
      break;

    case 'send':
      if (params.amount && (params.to || params.domain || params.toUsername)) {
        const hasWallet = await hasTelegramWallet(telegramId);
        if (!hasWallet) {
          const isGroup = isGroupChat(ctx);
          const message = isGroup
            ? '❌ You need to create a wallet first! Say "@askmerlin_bot create wallet" or use /start to create your wallet.'
            : '❌ No wallet found. Please create or import a wallet first.';
          await ctx.reply(message, {
            reply_markup: isGroup ? undefined : getWalletMenu()
          });
          break;
        }
        
        // Execute send transaction (support username, domain, or address)
        const recipient = params.to || params.domain || '';
        const recipientUsername = params.toUsername || null;
        await handleSendSOL(ctx, session, params.amount, recipient, recipientUsername);
      } else {
        // Missing params, ask for them
        if (!params.amount) {
          setSessionFn(telegramId, { state: 'waiting_for_send_amount', data: {} });
          await ctx.reply('📤 How much SOL would you like to send?', {
            reply_markup: getBackMenu()
          });
        } else if (!params.to && !params.domain && !params.toUsername) {
          setSessionFn(telegramId, { state: 'waiting_for_send_to', data: { amount: params.amount } });
          await ctx.reply('📤 Enter recipient address, .sol domain, or @username:', {
            reply_markup: getBackMenu()
          });
        }
      }
      break;

    case 'connect':
      const hasWallet = await hasTelegramWallet(telegramId);
      if (!hasWallet) {
        const message = isGroup
          ? '📱 You need to create a wallet first! Say "@askmerlin_bot create wallet" or use /start to create your wallet.'
          : '📱 You need to create or import a wallet first:';
        await ctx.reply(message, {
          reply_markup: isGroup ? undefined : getWalletMenu()
        });
      } else {
        const address = await getTelegramWalletAddress(telegramId);
        await ctx.reply(
          `✅ *Wallet Connected*\n\n` +
          `Address: \`${address}\``,
          {
            parse_mode: 'Markdown',
            reply_markup: isGroup ? undefined : getMainMenu()
          }
        );
      }
      break;

    case 'create_wallet':
      await handleCreateWallet(ctx);
      break;

    case 'swap':
      if (params.fromToken && params.toToken && (params.amount || params.percentage !== undefined)) {
        const hasWallet = await hasTelegramWallet(telegramId);
        if (!hasWallet) {
          const message = isGroup
            ? '❌ You need to create a wallet first! Say "@askmerlin_bot create wallet" or use /start to create your wallet.'
            : '❌ No wallet found. Please create or import a wallet first.';
          await ctx.reply(message, {
            reply_markup: isGroup ? undefined : getWalletMenu()
          });
          break;
        }

        const keypair = await getTelegramWallet(telegramId);
        if (!keypair) {
          await ctx.reply('❌ Failed to access wallet. Please try again.', {
            reply_markup: isGroup ? undefined : getMainMenu()
          });
          break;
        }

        // Handle percentage-based swaps (for selling by percentage)
        let percentage = null;
        if (params.percentage !== undefined) {
          percentage = parseFloat(params.percentage);
          if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
            await ctx.reply('❌ Invalid percentage. Please provide a percentage between 1 and 100.', {
              parse_mode: 'Markdown',
              reply_markup: isGroup ? undefined : getMainMenu()
            });
            break;
          }
        }

        // Execute swap (pass percentage if provided, otherwise use amount)
        const amount = params.amount || '0'; // Default amount if percentage-based
        const result = await swapTokens(keypair, params.fromToken, params.toToken, amount, percentage);
        
        if (result.success && result.signature) {
          const solscanLink = `https://solscan.io/tx/${result.signature}`;
          const explorerLink = `https://explorer.solana.com/tx/${result.signature}`;
          
          let message = `✅ *Swap Successful!*\n\n`;
          
          // Show percentage info if it was a percentage-based swap
          if (percentage !== null) {
            message += `📊 Sold *${percentage}%* of your ${params.fromToken} balance\n\n`;
          }
          
          message += `💰 Swapped: *${result.quote?.inputAmount?.toFixed(4) || params.amount || 'calculated'} ${params.fromToken}*\n`;
          message += `➡️ Received: *${result.quote?.outputAmount?.toFixed(4) || 'calculating...'} ${params.toToken}*\n`;
          
          if (result.quote?.priceImpact) {
            const priceImpact = parseFloat(result.quote.priceImpact);
            const priceImpactEmoji = priceImpact > 1 ? '⚠️' : '✅';
            message += `${priceImpactEmoji} Price Impact: ${priceImpact.toFixed(2)}%\n`;
          }
          
          message += `\n🔗 Signature: \`${result.signature}\`\n\n`;
          message += `[🔍 View on Solscan](${solscanLink})\n`;
          message += `[🌐 View on Explorer](${explorerLink})`;
          
          await ctx.reply(message, {
            parse_mode: 'Markdown',
            reply_markup: isGroup ? undefined : getMainMenu()
          });
        } else {
          await ctx.reply(
            `❌ Swap failed: ${result.error || 'Unknown error'}\n\n` +
            `💡 Make sure you have enough balance and the token addresses are correct.`,
            {
              parse_mode: 'Markdown',
              reply_markup: isGroup ? undefined : getMainMenu()
            }
          );
        }
      } else {
        await ctx.reply('❌ Missing swap parameters. Please provide fromToken, toToken, and amount or percentage.', {
          reply_markup: isGroup ? undefined : getMainMenu()
        });
      }
      break;

    case 'bridge':
      if (params.fromChain && params.toChain && params.amount && params.toAddress) {
        const hasWallet = await hasTelegramWallet(telegramId);
        if (!hasWallet) {
          const message = isGroup
            ? '❌ You need to create a wallet first! Say "@askmerlin_bot create wallet" or use /start to create your wallet.'
            : '❌ No wallet found. Please create or import a wallet first.';
          await ctx.reply(message, {
            reply_markup: isGroup ? undefined : getWalletMenu()
          });
          break;
        }

        // Get user's keypair for signing bridge transaction
        const keypair = await getTelegramWallet(telegramId);
        if (!keypair) {
          await ctx.reply('❌ Failed to access wallet. Please try again.', {
            reply_markup: isGroup ? undefined : getMainMenu()
          });
          break;
        }

        // Execute bridge transaction directly (no confirmation)
        const bridgeResult = await merlinBridge.executeBridge({
          fromChain: params.fromChain,
          toChain: params.toChain,
          token: params.token || 'SOL',
          amount: params.amount,
          toAddress: params.toAddress
        }, keypair);

        if (bridgeResult.success) {
          const solscanLink = `https://solscan.io/tx/${bridgeResult.transactionHash}`;
          const explorerLink = `https://explorer.solana.com/tx/${bridgeResult.transactionHash}`;
          
          let message = `✅ *Bridge Transaction Initiated!*\n\n` +
            `🌉 Bridging: *${params.amount} ${params.token || 'SOL'}*\n` +
            `📤 From: *${params.fromChain}*\n` +
            `📥 To: *${params.toChain}*\n` +
            `📍 Destination: \`${params.toAddress.slice(0, 8)}...${params.toAddress.slice(-8)}\`\n`;
          
          if (bridgeResult.estimatedTime) {
            message += `⏱️ Estimated time: ${bridgeResult.estimatedTime}\n`;
          }
          
          message += `\n🔗 Transaction: \`${bridgeResult.transactionHash}\`\n\n` +
            `[🔍 View on Solscan](${solscanLink})\n` +
            `[🌐 View on Explorer](${explorerLink})\n\n` +
            `💡 *Note:* The bridge transaction is processing. Tokens will arrive on ${params.toChain} once the bridge completes.`;

          await ctx.reply(message, {
            parse_mode: 'Markdown',
            reply_markup: isGroup ? undefined : getMainMenu()
          });
        } else {
          await ctx.reply(
            `❌ Bridge failed: ${bridgeResult.error || bridgeResult.message || 'Unknown error'}`,
            {
              parse_mode: 'Markdown',
              reply_markup: isGroup ? undefined : getMainMenu()
            }
          );
        }
      } else {
        await ctx.reply('❌ Missing bridge parameters. Please provide fromChain, toChain, amount, and toAddress.', {
          reply_markup: isGroup ? undefined : getMainMenu()
        });
      }
      break;

    case 'tx':
    case 'history':
      await ctx.reply('📋 Transaction history is temporarily disabled due to RPC rate limits.');
      break;

    case 'chat':
      // Just the AI response, nothing more
      break;

    default:
      // For other actions (tx, etc.), just show the AI response
      // Future implementations can handle these
      break;
  }
}

/**
 * Handle AI message processing
 */
export async function handleAIMessage(ctx, messageText, session, setSessionFn) {
  try {
    // Check if this message is a reply to another message
    let repliedToMessage = null;
    if (ctx.message?.reply_to_message?.text) {
      repliedToMessage = ctx.message.reply_to_message.text;
      console.log('📎 Detected reply to message:', repliedToMessage);
    }

    // Process message with AI (include context from replied message if available)
    const aiResult = await processMessageWithAI(messageText, repliedToMessage);
    
    // Handle the AI action
    await handleAIAction(ctx, aiResult, session, setSessionFn);
    
    return true;
  } catch (error) {
    console.error('Error handling AI message:', error);
    await ctx.reply('❌ Sorry, I encountered an error processing your message. Please try again.', {
      reply_markup: getBackMenu()
    });
    return false;
  }
}

/**
 * Handle group chat messages
 * IMPORTANT: Only responds in the group chat, never sends private messages
 */
export async function handleGroupChatMessage(ctx, botUsername) {
  try {
    const telegramId = ctx.from.id.toString();
    const messageText = ctx.message?.text || '';
    
    // Update user's username in database for @username mentions
    if (ctx.from.username) {
      await updateUserUsername(telegramId, ctx.from.username);
    }
    
    // Register group chat
    await registerGroupChat(ctx);
    
    // Check if bot is mentioned
    if (!isBotMentioned(ctx, botUsername)) {
      return; // Ignore messages without bot mention
    }
    
    // Remove bot mention from message for AI processing
    const cleanMessage = messageText
      .replace(new RegExp(`@${botUsername}`, 'gi'), '')
      .trim();
    
    if (!cleanMessage) {
      // Only reply in group chat
      await ctx.reply('👋 Hi! I can help you with Solana transactions. Try:\n\n' +
        '• "send 1 SOL to @username"\n' +
        '• "check my balance"\n' +
        '• "create wallet"\n' +
        '• "send 0.5 SOL to @alice"\n\n' +
        'Use /start or say "create wallet" to get started!');
      return;
    }
    
    // Get session for user
    const session = { telegramId, state: 'idle' };
    
    // Process with AI - all responses will go to group chat via ctx.reply()
    await handleAIMessage(ctx, cleanMessage, session, () => {});
    
  } catch (error) {
    console.error('Error handling group chat message:', error);
    // Don't reply in group chat on error to avoid spam
  }
}
