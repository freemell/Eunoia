# Railway Deployment Guide

## Important: Database Persistence

**Your existing wallets will be preserved!** The database file is included in the repository, so Railway will use the same database with all your wallets.

## Step 1: Make Repository Private

1. Go to https://github.com/freemell/merlintg
2. Click **Settings** → **General** → scroll to **Danger Zone**
3. Click **Change repository visibility** → **Make private**
4. Confirm the change

## Step 2: Push to GitHub

```bash
cd "C:\Users\1\Documents\milla projects\merlin\telegram-bot"

# Initialize git if needed (if this is a new repo)
git init
git remote add origin https://github.com/freemell/merlintg.git

# Add all files (including database)
git add .
git commit -m "Initial commit: Merlin Telegram Bot with database"

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository: `freemell/merlintg`
4. **Important:** Set **Root Directory** to: `telegram-bot`

## Step 4: Add Environment Variables

In Railway dashboard, go to your service → **Variables** tab → Add:

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

## Step 5: Add Persistent Volume (Important!)

Railway will automatically persist the database, but to ensure it:

1. In Railway dashboard, go to your service
2. Click **+ New** → **Volume**
3. Mount point: `/app/dev.db`
4. This ensures the database persists across deployments

## Step 6: Deploy

Railway will automatically:
- Install dependencies (`npm install`)
- Generate Prisma client (`npx prisma generate`)
- Start the bot (`npm start`)

## Database Persistence

✅ **Your existing wallets will be preserved because:**
- The `dev.db` file is included in the repository
- Railway will use this database on first deploy
- Railway's persistent volumes ensure the database survives deployments
- All wallet data, user IDs, and encrypted keys remain intact

## Updating the Database

If you need to add new migrations:
1. Make changes to `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name migration_name` locally
3. Commit the new migration files
4. Push to GitHub
5. Railway will automatically apply migrations on next deploy

## Troubleshooting

**If wallets are lost:**
- Check that `DATABASE_URL=file:./dev.db` matches your database filename
- Verify the database file is in the repository
- Check Railway logs for database errors

**If bot doesn't start:**
- Check Railway logs for errors
- Verify all environment variables are set
- Ensure `USE_WEBHOOK=false` for polling mode



