// Vercel serverless function for webhook
import { Bot } from 'grammy';
import { handleMessage, handleCallbackQuery } from '../index.js';

let bot = null;

function getBot() {
  if (!bot) {
    bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
    bot.on('message', handleMessage);
    bot.on('callback_query', handleCallbackQuery);
    bot.catch((err) => {
      console.error('Bot error:', err);
    });
  }
  return bot;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const botInstance = getBot();
    await botInstance.handleUpdate(req.body);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

