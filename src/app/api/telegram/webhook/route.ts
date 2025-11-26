import { NextRequest, NextResponse } from 'next/server';
import { Bot } from 'grammy';
import { handleTelegramMessage } from '@/lib/telegram-bot-handler';

// Lazy initialization - only create bot when needed
let bot: Bot | null = null;

function getBot(): Bot {
  if (!bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set');
    }
    bot = new Bot(token);
    
    // Set up bot handlers
    bot.on('message', handleTelegramMessage);
    bot.on('callback_query', handleTelegramMessage);
    
    // Error handling
    bot.catch((err) => {
      console.error('Telegram bot error:', err);
    });
  }
  return bot;
}

export async function POST(req: NextRequest) {
  try {
    // Get the update from Telegram
    const update = await req.json();
    
    // Get bot instance (lazy initialization)
    const botInstance = getBot();
    
    // Handle the update
    await botInstance.handleUpdate(update);
    
    // Return OK to Telegram
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Internal server error' },
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

