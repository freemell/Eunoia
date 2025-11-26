# Telegram Bot Deployment Guide

## Best Option: Railway (Easiest)

### Step 1: Setup Railway
1. Go to [Railway](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repo and the `telegram-bot` folder

### Step 2: Environment Variables
Add these in Railway dashboard:
```
TELEGRAM_BOT_TOKEN=8068396024:AAEz8Ykj4XrO9FHy4qz-GTfOD5PwqAULlaI
ENCRYPTION_SECRET=590a64fc3c8f6b4f57c0fde30dcac4374ade7e370a171ee212d52e07cd7ea033
DATABASE_URL=file:./bot.db
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
USE_WEBHOOK=false
```

### Step 3: Deploy
Railway will auto-deploy. The bot will start in polling mode!

## Alternative: Render

1. Go to [Render](https://render.com)
2. Create new "Web Service"
3. Connect GitHub repo
4. Set:
   - **Root Directory**: `telegram-bot`
   - **Build Command**: `npm install && npx prisma migrate deploy && npx prisma generate`
   - **Start Command**: `npm start`
5. Add environment variables
6. Deploy!

## Alternative: Simple VPS

1. Get a VPS (DigitalOcean, AWS EC2, etc.)
2. SSH into server
3. Install Node.js
4. Clone repo
5. Run:
   ```bash
   cd telegram-bot
   npm install
   npx prisma migrate deploy
   npx prisma generate
   npm start
   ```
6. Use PM2 to keep it running:
   ```bash
   npm install -g pm2
   pm2 start index.js --name merlin-bot
   pm2 save
   pm2 startup
   ```

## Polling vs Webhook

**Polling Mode (Recommended for standalone):**
- Set `USE_WEBHOOK=false` or don't set it
- Bot continuously checks for updates
- Works on any server
- No webhook URL needed

**Webhook Mode (For Vercel):**
- Set `USE_WEBHOOK=true`
- Set webhook URL: `bot.api.setWebhook('https://your-url.com/webhook')`
- Better for serverless

## Quick Start (Local Testing)

```bash
cd telegram-bot
npm install
cp .env.example .env
# Edit .env with your token
npx prisma migrate dev
npx prisma generate
npm start
```

The bot will start and respond to messages!



