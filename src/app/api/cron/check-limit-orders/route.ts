import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkLimitOrderCondition } from '@/lib/market-data';
import { Keypair } from '@solana/web3.js';
import { getTelegramWallet } from '@/lib/telegram-wallet';
import { executeSwap } from '@/lib/swap-service';
import { sendLimitOrderNotification } from '@/lib/notifications';

const prisma = new PrismaClient();

// This endpoint should be protected with a secret token
// Add to your .env: CRON_SECRET=your-secret-token
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  try {
    // Verify cron secret (for Vercel Cron Jobs)
    const authHeader = req.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    console.log('🔄 Checking limit orders...');

    // Get all active limit orders
    const activeOrders = await prisma.limitOrder.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`📊 Found ${activeOrders.length} active limit orders`);

    const results = {
      checked: 0,
      executed: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const order of activeOrders) {
      results.checked++;
      
      try {
        // Check if condition is met
        const conditionMet = await checkLimitOrderCondition(
          order.tokenAddress,
          order.triggerType as 'market_cap' | 'price',
          order.triggerValue
        );

        if (!conditionMet) {
          console.log(`⏳ Order ${order.id}: Condition not met yet`);
          continue;
        }

        console.log(`✅ Order ${order.id}: Condition met! Executing...`);

        // Execute the order
        const executionResult = await executeLimitOrder(order);
        
        if (executionResult.success) {
          results.executed++;
          
          // Update order status
          const updatedOrder = await prisma.limitOrder.update({
            where: { id: order.id },
            data: {
              status: 'executed',
              executedAt: new Date(),
              txHash: executionResult.txHash || null,
            },
          });

          console.log(`✅ Order ${order.id} executed successfully: ${executionResult.txHash}`);
          
          // Send success notification
          await sendLimitOrderNotification({
            ...updatedOrder,
            txHash: executionResult.txHash || null,
          }, true);
        } else {
          results.failed++;
          results.errors.push(`Order ${order.id}: ${executionResult.error}`);
          
          // Update order with error
          const updatedOrder = await prisma.limitOrder.update({
            where: { id: order.id },
            data: {
              errorMessage: executionResult.error || 'Execution failed',
            },
          });

          console.error(`❌ Order ${order.id} execution failed: ${executionResult.error}`);
          
          // Send failure notification
          await sendLimitOrderNotification({
            ...updatedOrder,
            errorMessage: executionResult.error || 'Execution failed',
          }, false);
        }
      } catch (error) {
        results.failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Order ${order.id}: ${errorMsg}`);
        console.error(`❌ Error processing order ${order.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Checked ${results.checked} orders, executed ${results.executed}, failed ${results.failed}`
    });
  } catch (error) {
    console.error('Error in limit order cron job:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check limit orders'
    }, { status: 500 });
  }
}

async function executeLimitOrder(order: any): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // Get user's wallet (either from TelegramUser or Wallet model)
    let keypair: Keypair | null = null;
    
    if (order.telegramId) {
      // Get from Telegram user
      keypair = await getTelegramWallet(order.telegramId);
    }

    // For web users, we can't execute automatically without their wallet connected
    // This would require the user to have their wallet connected via wallet adapter
    // For now, we'll return an error for non-telegram users
    if (!keypair) {
      return { success: false, error: 'Could not retrieve wallet keypair. Limit orders currently work for Telegram users only.' };
    }

    // Execute the order based on type
    if (order.orderType === 'buy') {
      // Buy token with SOL
      const amount = order.amount || '0.1'; // Default amount
      const percentage = order.amountType === 'percentage' ? parseFloat(order.amount || '0') : null;
      
      const swapResult = await executeSwap(
        keypair,
        'SOL',
        order.tokenAddress,
        amount,
        percentage
      );
      
      if (swapResult.success && swapResult.signature) {
        return { success: true, txHash: swapResult.signature };
      } else {
        return { success: false, error: swapResult.error || 'Swap failed' };
      }
    } else if (order.orderType === 'sell') {
      // Sell token for SOL
      const amount = order.amount || 'all';
      const percentage = order.amountType === 'percentage' ? parseFloat(order.amount || '0') : null;
      
      const swapResult = await executeSwap(
        keypair,
        order.tokenAddress,
        'SOL',
        amount,
        percentage
      );
      
      if (swapResult.success && swapResult.signature) {
        return { success: true, txHash: swapResult.signature };
      } else {
        return { success: false, error: swapResult.error || 'Swap failed' };
      }
    }

    return { success: false, error: 'Unknown order type' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Execution error'
    };
  }
}

