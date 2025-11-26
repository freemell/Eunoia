# Quick Setup - Standalone Telegram Bot

## 🚀 Easiest: Deploy to Railway (5 minutes)

### Step 1: Push to GitHub
```bash
git add telegram-bot
git commit -m "Add standalone Telegram bot"
git push
```

### Step 2: Deploy on Railway
1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repo
4. Railway will detect it - **set Root Directory to: `telegram-bot`**

### Step 3: Add Environment Variables
In Railway dashboard, add:
```
TELEGRAM_BOT_TOKEN=8068396024:AAEz8Ykj4XrO9FHy4qz-GTfOD5PwqAULlaI
ENCRYPTION_SECRET=590a64fc3c8f6b4f57c0fde30dcac4374ade7e370a171ee212d52e07cd7ea033
DATABASE_URL=file:./bot.db
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
USE_WEBHOOK=false
```

### Step 4: Deploy!
Railway will automatically:
- Install dependencies
- Run database migrations
- Start the bot

**That's it!** Your bot will be running in polling mode.

## 🧪 Test Locally First (Optional)

```bash
cd telegram-bot
npm install

# Create .env file
echo 'TELEGRAM_BOT_TOKEN=8068396024:AAEz8Ykj4XrO9FHy4qz-GTfOD5PwqAULlaI' > .env
echo 'ENCRYPTION_SECRET=590a64fc3c8f6b4f57c0fde30dcac4374ade7e370a171ee212d52e07cd7ea033' >> .env
echo 'DATABASE_URL="file:./bot.db"' >> .env
echo 'SOLANA_RPC_URL=https://api.mainnet-beta.solana.com' >> .env

# Setup database
npx prisma migrate dev
npx prisma generate

# Start bot
npm start
```

## 📱 Test Your Bot
1. Open Telegram
2. Search for `@askmerlin_bot`
3. Send `/start`

## ✨ Advantages of Standalone Bot

- ✅ No webhook setup needed (uses polling)
- ✅ Works on any server
- ✅ Easier to debug
- ✅ Can run 24/7 on Railway/Render
- ✅ Separate from main website
- ✅ Own database

## 🔄 If You Want to Use Vercel

You can still deploy to Vercel, but use webhook mode:
1. Deploy the `telegram-bot` folder to Vercel
2. Set `USE_WEBHOOK=true`
3. Set webhook: `https://your-app.vercel.app/api/webhook`

But Railway is easier for a standalone bot!



