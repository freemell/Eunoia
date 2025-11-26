/**
 * Notification Service
 * Sends alerts when limit orders are executed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface LimitOrderNotification {
  orderId: string;
  orderType: 'buy' | 'sell';
  tokenSymbol?: string | null;
  tokenAddress: string;
  amount: string | null;
  amountType: string;
  triggerType: 'market_cap' | 'price';
  triggerValue: string;
  txHash?: string | null;
  success: boolean;
  error?: string | null;
}

/**
 * Send Telegram notification for limit order execution
 */
async function sendTelegramNotification(telegramId: string, notification: LimitOrderNotification): Promise<boolean> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.warn('TELEGRAM_BOT_TOKEN not set, cannot send Telegram notification');
      return false;
    }

    const tokenDisplay = notification.tokenSymbol || notification.tokenAddress.slice(0, 8) + '...';
    const amountDisplay = notification.amount 
      ? (notification.amountType === 'percentage' ? `${notification.amount}%` : `${notification.amount} SOL`)
      : 'all';
    
    const triggerDisplay = notification.triggerType === 'market_cap'
      ? `${notification.triggerValue}k market cap`
      : `$${notification.triggerValue} price`;

    let message = '';
    
    if (notification.success) {
      const actionEmoji = notification.orderType === 'buy' ? '🟢' : '🔴';
      const actionText = notification.orderType === 'buy' ? 'BOUGHT' : 'SOLD';
      
      message = `${actionEmoji} *Limit Order Executed!*\n\n` +
        `📊 Order: *${actionText}* ${amountDisplay} of ${tokenDisplay}\n` +
        `🎯 Trigger: ${triggerDisplay}\n` +
        `✅ Status: *Success*\n`;
      
      if (notification.txHash) {
        const solscanLink = `https://solscan.io/tx/${notification.txHash}`;
        const explorerLink = `https://explorer.solana.com/tx/${notification.txHash}`;
        message += `\n🔗 [View on Solscan](${solscanLink})\n` +
          `🌐 [View on Explorer](${explorerLink})`;
      }
    } else {
      message = `❌ *Limit Order Failed*\n\n` +
        `📊 Order: *${notification.orderType.toUpperCase()}* ${amountDisplay} of ${tokenDisplay}\n` +
        `🎯 Trigger: ${triggerDisplay}\n` +
        `❌ Status: *Failed*\n` +
        `⚠️ Error: ${notification.error || 'Unknown error'}\n\n` +
        `Please check your order and try again.`;
    }

    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send Telegram notification:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return false;
  }
}

/**
 * Send notification for limit order execution
 * Supports: Telegram users
 * Future: Web push notifications, email, etc.
 */
export async function sendLimitOrderNotification(
  order: {
    id: string;
    telegramId?: string | null;
    userId?: string | null;
    walletAddress: string;
    orderType: string;
    tokenSymbol?: string | null;
    tokenAddress: string;
    amount?: string | null;
    amountType: string;
    triggerType: string;
    triggerValue: string;
    txHash?: string | null;
    errorMessage?: string | null;
  },
  success: boolean
): Promise<void> {
  const notification: LimitOrderNotification = {
    orderId: order.id,
    orderType: order.orderType as 'buy' | 'sell',
    tokenSymbol: order.tokenSymbol,
    tokenAddress: order.tokenAddress,
    amount: order.amount || null,
    amountType: order.amountType,
    triggerType: order.triggerType as 'market_cap' | 'price',
    triggerValue: order.triggerValue,
    txHash: order.txHash || null,
    success,
    error: order.errorMessage || null,
  };

  // Send Telegram notification if user has telegramId
  if (order.telegramId) {
    try {
      const sent = await sendTelegramNotification(order.telegramId, notification);
      if (sent) {
        console.log(`✅ Notification sent to Telegram user ${order.telegramId} for order ${order.id}`);
      } else {
        console.warn(`⚠️ Failed to send Telegram notification to user ${order.telegramId}`);
      }
    } catch (error) {
      console.error(`❌ Error sending notification to Telegram user ${order.telegramId}:`, error);
    }
  }

  // Future: Add web push notifications for web users
  // Future: Add email notifications
  // Future: Add SMS notifications
}

/**
 * Send alert when limit order condition is approaching (optional feature)
 * Can be used to warn users before execution
 */
export async function sendLimitOrderApproachingAlert(
  order: {
    id: string;
    telegramId?: string | null;
    tokenSymbol?: string | null;
    tokenAddress: string;
    triggerType: string;
    triggerValue: string;
    currentValue: number;
  }
): Promise<void> {
  // Only send if within 10% of trigger value
  const triggerNum = parseFloat(order.triggerValue);
  const threshold = triggerNum * 0.1; // 10% threshold
  
  if (order.triggerType === 'market_cap') {
    const currentMc = order.currentValue / 1000; // Convert to thousands
    if (currentMc >= triggerNum - threshold && currentMc < triggerNum) {
      // Within 10% of target, send alert
      if (order.telegramId) {
        const tokenDisplay = order.tokenSymbol || order.tokenAddress.slice(0, 8) + '...';
        const message = `⚠️ *Limit Order Approaching!*\n\n` +
          `📊 Token: ${tokenDisplay}\n` +
          `🎯 Target: ${order.triggerValue}k market cap\n` +
          `📈 Current: ${currentMc.toFixed(1)}k market cap\n` +
          `\nYour limit order will execute soon!`;
        
        try {
          const botToken = process.env.TELEGRAM_BOT_TOKEN;
          if (botToken) {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: order.telegramId,
                text: message,
                parse_mode: 'Markdown',
              }),
            });
          }
        } catch (error) {
          console.error('Error sending approaching alert:', error);
        }
      }
    }
  }
}

