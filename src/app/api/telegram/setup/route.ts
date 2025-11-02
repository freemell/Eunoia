import { NextResponse } from 'next/server';

/**
 * This endpoint helps set up the Telegram webhook
 * Call this after deploying to set the webhook URL
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const webhookUrl = searchParams.get('webhook_url') || process.env.TELEGRAM_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.vercel.app'}/api/telegram/webhook`;
    
    if (!token) {
      return NextResponse.json({
        error: 'TELEGRAM_BOT_TOKEN is not set in environment variables',
        success: false
      }, { status: 400 });
    }

    // Set webhook using Telegram Bot API
    const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
      }),
    });

    const data = await response.json();

    if (data.ok) {
      return NextResponse.json({
        success: true,
        message: 'Webhook set successfully',
        webhookUrl,
        info: data.description || 'Webhook is active'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: data.description || 'Failed to set webhook',
        data
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Webhook setup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Remove webhook (for debugging)
 */
export async function DELETE() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!token) {
      return NextResponse.json({
        error: 'TELEGRAM_BOT_TOKEN is not set',
        success: false
      }, { status: 400 });
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        drop_pending_updates: true,
      }),
    });

    const data = await response.json();

    return NextResponse.json({
      success: data.ok,
      message: data.description || 'Webhook removed',
      data
    });
  } catch (error) {
    console.error('Webhook removal error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

