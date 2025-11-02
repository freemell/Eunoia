import { Context, InlineKeyboard } from 'grammy';
import { getTelegramWallet, getTelegramWalletAddress, hasTelegramWallet, createTelegramWallet, importTelegramWallet } from './telegram-wallet';
import { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { SolanaDomainResolver } from './domain-resolver';

const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  'confirmed'
);

// Transaction interface for history
interface TransactionHistory {
  type: string;
  status: string;
  amount: string;
  token: string;
  txHash?: string;
  toAddress?: string;
  fromChain?: string;
  toChain?: string;
  createdAt: string;
}

// User session states
interface UserSession {
  telegramId: string;
  state: 'idle' | 'waiting_for_import_key' | 'waiting_for_send_amount' | 'waiting_for_send_to' | 'waiting_for_swap_from' | 'waiting_for_swap_to' | 'waiting_for_swap_amount';
  data?: Record<string, unknown>;
}

const userSessions = new Map<string, UserSession>();

function getSession(telegramId: string): UserSession {
  if (!userSessions.has(telegramId)) {
    userSessions.set(telegramId, { telegramId, state: 'idle' });
  }
  return userSessions.get(telegramId)!;
}

function setSession(telegramId: string, session: Partial<UserSession>) {
  const current = getSession(telegramId);
  userSessions.set(telegramId, { ...current, ...session });
}

function clearSession(telegramId: string) {
  userSessions.set(telegramId, { telegramId, state: 'idle' });
}

// Stylized inline keyboards
function getMainMenu() {
  return new InlineKeyboard()
    .text('💰 Balance', 'balance')
    .text('📤 Send SOL', 'send')
    .row()
    .text('🔄 Swap Tokens', 'swap')
    .text('🌉 Bridge', 'bridge')
    .row()
    .text('📋 History', 'history')
    .text('⚙️ Settings', 'settings');
}

function getWalletMenu() {
  return new InlineKeyboard()
    .text('🆕 Create Wallet', 'create_wallet')
    .row()
    .text('📥 Import Wallet', 'import_wallet')
    .row()
    .text('◀️ Back', 'main_menu');
}

function getBackMenu() {
  return new InlineKeyboard()
    .text('◀️ Back to Menu', 'main_menu');
}


// Helper: Format balance message
async function formatBalanceMessage(telegramId: string): Promise<string> {
  const address = await getTelegramWalletAddress(telegramId);
  if (!address) {
    return '❌ No wallet found. Please create or import a wallet first.';
  }

  try {
    const balanceResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/solana/balance?address=${address}`);
    const balanceData = await balanceResponse.json();
    
    if (balanceData.success) {
      return `💰 *Your Balance*\n\n` +
             `Address: \`${address}\`\n` +
             `Balance: *${balanceData.balance.toFixed(4)} SOL*\n` +
             `Lamports: ${balanceData.lamports.toLocaleString()}`;
    } else {
      return `❌ Failed to get balance: ${balanceData.error}`;
    }
  } catch (error) {
    return `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

// Helper: Send SOL transaction
async function sendSOLTransaction(keypair: Keypair, to: string, amount: number | string): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    let recipientAddress = to;
    
    // Resolve .sol domain if needed
    if (to.endsWith('.sol')) {
      const domainResult = await SolanaDomainResolver.resolveDomain(to);
      if (!domainResult.success) {
        return { success: false, error: `Failed to resolve domain: ${domainResult.error}` };
      }
      recipientAddress = domainResult.address;
    }

    // Validate addresses
    const fromPubkey = keypair.publicKey;
    const toPubkey = new PublicKey(recipientAddress);

    if (fromPubkey.equals(toPubkey)) {
      return { success: false, error: 'Cannot send to yourself' };
    }

    // Get current balance
    const balance = await connection.getBalance(fromPubkey);
    const solBalance = balance / LAMPORTS_PER_SOL;

    // Calculate amount
    let lamports: number;
    if (amount === 'all') {
      lamports = balance - 5000; // Leave some for fees
    } else if (typeof amount === 'string') {
      lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
    } else {
      lamports = Math.floor(amount * LAMPORTS_PER_SOL);
    }

    if (lamports > balance) {
      return { success: false, error: `Insufficient balance. You have ${solBalance.toFixed(4)} SOL` };
    }

    // Create and sign transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    // Sign transaction
    transaction.sign(keypair);

    // Send transaction
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');

    return { success: true, signature };
  } catch (error) {
    console.error('Send SOL error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Bot command handlers
export async function handleTelegramMessage(ctx: Context) {
  const telegramId = ctx.from?.id.toString() || '';
  const messageText = ctx.message?.text || '';

  try {
    // Handle commands
    if (messageText.startsWith('/')) {
      const command = messageText.split(' ')[0];
      
      switch (command) {
        case '/start':
          await handleStart(ctx);
          return;
        case '/help':
          await handleHelp(ctx);
          return;
        case '/wallet':
          await handleWallet(ctx);
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

    // Handle callback queries (button presses)
    if (ctx.callbackQuery) {
      await handleCallbackQuery(ctx);
      return;
    }

    // Handle state-based input
    if (session.state === 'waiting_for_import_key') {
      await handleImportKey(ctx, messageText);
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
      const keypair = await getTelegramWallet(telegramId);
      if (!keypair) {
        await ctx.reply('❌ No wallet found. Please create or import a wallet first.', {
          reply_markup: getBackMenu()
        });
        clearSession(telegramId);
        return;
      }

      const amount = session.data?.amount || '0';
      const result = await sendSOLTransaction(keypair, messageText, amount);
      
      if (result.success && result.signature) {
        await ctx.reply(
          `✅ Transaction successful!\n\n` +
          `Amount: ${amount} SOL\n` +
          `To: ${messageText}\n` +
          `Signature: \`${result.signature}\`\n\n` +
          `View on Solscan: https://solscan.io/tx/${result.signature}`,
          { reply_markup: getMainMenu() }
        );
      } else {
        await ctx.reply(`❌ Transaction failed: ${result.error}`, {
          reply_markup: getMainMenu()
        });
      }
      clearSession(telegramId);
      return;
    }

    // Default: show main menu
    await ctx.reply('Welcome to Merlin! Choose an action:', {
      reply_markup: getMainMenu()
    });

  } catch (error) {
    console.error('Error handling Telegram message:', error);
    await ctx.reply('❌ An error occurred. Please try again.', {
      reply_markup: getBackMenu()
    });
  }
}

async function handleStart(ctx: Context) {
  const telegramId = ctx.from?.id.toString() || '';
  const hasWallet = await hasTelegramWallet(telegramId);

  const welcomeMessage = `🧙‍♂️ *Welcome to Merlin!*\n\n` +
    `Your Solana Blockchain Assistant\n\n` +
    `${hasWallet ? '✅ Wallet connected' : '⚠️ No wallet found. Create or import one to get started.'}\n\n` +
    `Use the buttons below to interact:`;

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

async function handleHelp(ctx: Context) {
  const helpMessage = `🧙‍♂️ *Merlin Bot Commands*\n\n` +
    `*/start* - Start the bot\n` +
    `*/wallet* - Manage your wallet\n` +
    `*/balance* - Check your SOL balance\n` +
    `*/help* - Show this help message\n\n` +
    `*Features:*\n` +
    `💰 Check balance\n` +
    `📤 Send SOL\n` +
    `🔄 Swap tokens\n` +
    `🌉 Bridge tokens\n` +
    `📋 View transaction history`;

  await ctx.reply(helpMessage, {
    parse_mode: 'Markdown',
    reply_markup: getMainMenu()
  });
}

async function handleWallet(ctx: Context) {
  const telegramId = ctx.from?.id.toString() || '';
  const hasWallet = await hasTelegramWallet(telegramId);

  if (hasWallet) {
    const address = await getTelegramWalletAddress(telegramId);
    await ctx.reply(
      `⚙️ *Wallet Settings*\n\n` +
      `Address: \`${address}\`\n\n` +
      `Choose an action:`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('🔄 Create New Wallet', 'create_wallet')
          .row()
          .text('📥 Import Wallet', 'import_wallet')
          .row()
          .text('◀️ Back', 'main_menu')
      }
    );
  } else {
    await ctx.reply('📱 You need to create or import a wallet first:', {
      reply_markup: getWalletMenu()
    });
  }
}

async function handleBalance(ctx: Context) {
  const message = await formatBalanceMessage(ctx.from?.id.toString() || '');
  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: getMainMenu()
  });
}

async function handleCallbackQuery(ctx: Context) {
  const telegramId = ctx.from?.id.toString() || '';
  const callbackData = ctx.callbackQuery?.data || '';

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
        const balanceMsg = await formatBalanceMessage(telegramId);
        await ctx.editMessageText(balanceMsg, {
          parse_mode: 'Markdown',
          reply_markup: getMainMenu()
        });
        break;

      case 'create_wallet':
        await handleCreateWallet(ctx);
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

      case 'swap':
        await ctx.editMessageText('🔄 Swap functionality coming soon!', {
          reply_markup: getMainMenu()
        });
        break;

      case 'bridge':
        await ctx.editMessageText('🌉 Bridge functionality coming soon!', {
          reply_markup: getMainMenu()
        });
        break;

      case 'history':
        await handleHistory(ctx);
        break;

      case 'settings':
        await handleWallet(ctx);
        break;

      default:
        // Handle confirm actions
        if (callbackData.startsWith('confirm_')) {
          // Handle confirmations if needed in future
        }
    }
  } catch (error) {
    console.error('Error handling callback:', error);
    await ctx.editMessageText('❌ An error occurred. Please try again.', {
      reply_markup: getBackMenu()
    });
  }
}

async function handleCreateWallet(ctx: Context) {
  const telegramId = ctx.from?.id.toString() || '';
  const userInfo = {
    username: ctx.from?.username,
    firstName: ctx.from?.first_name,
    lastName: ctx.from?.last_name,
  };

  try {
    const { publicKey } = await createTelegramWallet(telegramId, userInfo);
    
    await ctx.editMessageText(
      `✅ *Wallet Created Successfully!*\n\n` +
      `Your wallet address:\n\`${publicKey}\`\n\n` +
      `⚠️ *Important:* Your private key is encrypted and stored securely. Never share it with anyone!`,
      {
        parse_mode: 'Markdown',
        reply_markup: getMainMenu()
      }
    );
  } catch (error) {
    await ctx.editMessageText(
      `❌ Failed to create wallet: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        reply_markup: getBackMenu()
      }
    );
  }
}

async function handleImportKey(ctx: Context, privateKey: string) {
  const telegramId = ctx.from?.id.toString() || '';
  const userInfo = {
    username: ctx.from?.username,
    firstName: ctx.from?.first_name,
    lastName: ctx.from?.last_name,
  };

  try {
    const { publicKey } = await importTelegramWallet(telegramId, privateKey, userInfo);
    clearSession(telegramId);
    
    await ctx.reply(
      `✅ *Wallet Imported Successfully!*\n\n` +
      `Your wallet address:\n\`${publicKey}\``,
      {
        parse_mode: 'Markdown',
        reply_markup: getMainMenu()
      }
    );
  } catch (error) {
    await ctx.reply(
      `❌ Failed to import wallet: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
      `Please check your private key format and try again.`,
      {
        reply_markup: getBackMenu()
      }
    );
  }
}

async function handleHistory(ctx: Context) {
  const telegramId = ctx.from?.id.toString() || '';
  const address = await getTelegramWalletAddress(telegramId);
  
  if (!address) {
    await ctx.editMessageText('❌ No wallet found. Please create or import a wallet first.', {
      reply_markup: getWalletMenu()
    });
    return;
  }

  try {
    const historyResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/transactions/simple-history?walletAddress=${address}&limit=10`
    );
    const historyData = await historyResponse.json();
    
    if (historyData.success && historyData.transactions.length > 0) {
      let message = `📋 *Transaction History*\n\n`;
      historyData.transactions.slice(0, 10).forEach((tx: TransactionHistory, index: number) => {
        message += `${index + 1}. *${tx.type}* - ${tx.amount} ${tx.token}\n`;
        message += `   Status: ${tx.status}\n`;
        if (tx.txHash) {
          message += `   [View Tx](https://solscan.io/tx/${tx.txHash})\n`;
        }
        message += `\n`;
      });
      
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: getMainMenu()
      });
    } else {
      await ctx.editMessageText('📋 No transactions found.', {
        reply_markup: getMainMenu()
      });
    }
  } catch {
    await ctx.editMessageText('❌ Failed to fetch transaction history.', {
      reply_markup: getMainMenu()
    });
  }
}

