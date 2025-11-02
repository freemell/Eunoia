import { NextRequest, NextResponse } from 'next/server';
import { Bot } from 'grammy';
import { handleTelegramMessage } from '@/lib/telegram-bot-handler';

// Initialize bot
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || '');

// Set up bot handlers
bot.on('message', handleTelegramMessage);
bot.on('callback_query', handleTelegramMessage);

// Error handling
bot.catch((err) => {
  console.error('Telegram bot error:', err);
});

export async function POST(req: NextRequest) {
  try {
    // Get the update from Telegram
    const update = await req.json();
    
    // Handle the update
    await bot.handleUpdate(update);
    
    // Return OK to Telegram
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook verification (Telegram requires this)
export async function GET() {
  return NextResponse.json({ 
    message: 'Telegram webhook is active',
    botToken: process.env.TELEGRAM_BOT_TOKEN ? 'Token is set' : 'Token is missing'
  });
}

