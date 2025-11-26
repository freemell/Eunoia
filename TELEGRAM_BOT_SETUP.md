# Telegram Bot Setup Guide

This guide will help you set up the Merlin Telegram bot on Vercel.

## Prerequisites

1. Create a Telegram bot using [@BotFather](https://t.me/BotFather)
   - Send `/newbot` to BotFather
   - Follow instructions to create your bot
   - Save the bot token (e.g., `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

2. Get your Vercel deployment URL
   - Deploy your app to Vercel
   - Your webhook URL will be: `https://your-app.vercel.app/api/telegram/webhook`

## Environment Variables

Add these to your Vercel project settings (or `.env.local` for local development):

```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_URL=https://your-app.vercel.app/api/telegram/webhook

# Encryption (IMPORTANT: Use a strong random key in production!)
ENCRYPTION_SECRET=your-strong-random-secret-key-change-this-in-production

# Database
DATABASE_URL=file:./dev.db  # For SQLite (local) or your production database URL

# Base URL (for API calls)
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app

# Telegram Bot URL (for the button on the website)
NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/your_bot_username

# Solana RPC (optional, has fallbacks)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

## Database Setup

1. Run Prisma migrations:
```bash
npx prisma migrate dev --name add_telegram_user
```

2. Generate Prisma Client:
```bash
npx prisma generate
```

## Setting Up the Webhook

After deploying to Vercel:

1. **Automatic setup** (recommended):
   Visit: `https://your-app.vercel.app/api/telegram/setup`
   
   This will automatically configure the webhook with Telegram.

2. **Manual setup**:
   You can also set the webhook manually by calling Telegram's API:
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-app.vercel.app/api/telegram/webhook"}'
   ```

3. **Verify webhook**:
   Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo`
   
   You should see your webhook URL and status.

## Testing the Bot

1. Start your bot on Telegram
2. Send `/start` to your bot
3. Create or import a wallet
4. Try commands like `/balance`, `/wallet`

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit your `TELEGRAM_BOT_TOKEN` or `ENCRYPTION_SECRET` to version control
- Use a strong, random `ENCRYPTION_SECRET` in production (at least 32 characters)
- Private keys are encrypted using AES-256-GCM before storage
- The encryption key should be stored securely in environment variables

## Bot Commands

- `/start` - Start the bot and show main menu
- `/help` - Show help message
- `/wallet` - Manage your wallet (create/import)
- `/balance` - Check your SOL balance

## Features

✅ Create Solana wallets
✅ Import existing wallets (with encrypted storage)
✅ Check balance
✅ Send SOL (with .sol domain support)
✅ Transaction history
✅ Swap tokens (coming soon)
✅ Bridge tokens (coming soon)

## Troubleshooting

### Bot not responding
1. Check webhook is set correctly
2. Verify `TELEGRAM_BOT_TOKEN` is correct
3. Check Vercel function logs
4. Ensure database is accessible

### Database errors
1. Run migrations: `npx prisma migrate dev`
2. Generate Prisma client: `npx prisma generate`
3. Check `DATABASE_URL` is correct

### Encryption errors
1. Verify `ENCRYPTION_SECRET` is set
2. Ensure it's the same across deployments (if using existing encrypted data)

## Local Development

For local development with Telegram webhooks, use a tunneling service like:
- [ngrok](https://ngrok.com/): `ngrok http 3000`
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [localtunnel](https://localtunnel.github.io/www/)

Then set your webhook URL to the tunnel URL:
```bash
https://your-tunnel-url.ngrok.io/api/telegram/webhook
```

