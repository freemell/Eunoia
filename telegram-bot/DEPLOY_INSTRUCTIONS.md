# Deployment Instructions

## ✅ Repository Setup Complete!

Your code is ready to push to GitHub. Follow these steps:

## Step 1: Make Repository Private

1. Go to https://github.com/freemell/merlintg
2. If the repo doesn't exist yet, create it:
   - Go to https://github.com/new
   - Repository name: `merlintg`
   - Make it **Private** ✅
   - Don't initialize with README (we already have one)
   - Click "Create repository"

3. If repo exists, make it private:
   - Settings → General → Danger Zone
   - "Change repository visibility" → "Make private"

## Step 2: Push to GitHub

Run these commands in the telegram-bot folder:

```bash
cd "C:\Users\1\Documents\milla projects\merlin\telegram-bot"
git push -u origin main
```

If you get authentication errors, you may need to:
- Use GitHub CLI: `gh auth login`
- Or use a personal access token

## Step 3: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select `freemell/merlintg`
5. **IMPORTANT:** Set **Root Directory** to: `telegram-bot`

## Step 4: Add Environment Variables

In Railway dashboard → Variables tab → Add these:

```
TELEGRAM_BOT_TOKEN=8068396024:AAEz8Ykj4XrO9FHy4qz-GTfOD5PwqAULlaI
ENCRYPTION_SECRET=590a64fc3c8f6b4f57c0fde30dcac4374ade7e370a171ee212d52e07cd7ea033
DATABASE_URL=file:./dev.db
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
GROQ_API_KEY=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
OPENAI_API_KEY=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
USE_WEBHOOK=false
```

## Step 5: Deploy!

Railway will automatically:
- ✅ Install dependencies
- ✅ Generate Prisma client
- ✅ Use your existing database (dev.db) from the repo
- ✅ Start the bot

## ✅ Database Persistence

**Your wallets will be preserved because:**
- ✅ `dev.db` is included in the repository
- ✅ Railway will use this database on first deploy
- ✅ Railway's persistent volumes keep the database alive
- ✅ All wallet data, user IDs, and encrypted keys remain intact

## After Deployment

1. Check Railway logs to see if the bot started
2. Test the bot: `/start` in Telegram
3. Your existing wallets should work immediately!

## Updating

To update the code:
```bash
git add .
git commit -m "Update message"
git push
```

Railway will automatically redeploy!



