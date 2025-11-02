# Next Steps - Telegram Bot Setup

## ✅ What You Have Now
- Database schema with `TelegramUser` model
- Prisma migrations applied
- Encryption secret configured
- All dependencies installed

## 📝 Step-by-Step Guide

### Step 1: Create Your Telegram Bot
1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` to BotFather
3. Follow the prompts:
   - Choose a name for your bot (e.g., "Merlin Solana Assistant")
   - Choose a username (e.g., "merlin_solana_bot") - must end in "bot"
4. BotFather will give you a token like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
5. **Copy this token and add it to your `.env` file:**
   ```
   TELEGRAM_BOT_TOKEN=your_actual_token_here
   ```

### Step 2: Update Your .env File
Make sure you have these variables set:
```env
DATABASE_URL="file:./dev.db"

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/your_bot_username

# Encryption
ENCRYPTION_SECRET=590a64fc3c8f6b4f57c0fde30dcac4374ade7e370a171ee212d52e07cd7ea033

# For local testing
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Step 3: Test Locally (Optional)
1. Start your development server:
   ```bash
   npm run dev
   ```

2. For Telegram webhooks to work locally, you need a tunneling service:
   - Install [ngrok](https://ngrok.com/): `npm install -g ngrok`
   - In a new terminal, run: `ngrok http 3000`
   - Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

3. Set the webhook for local testing:
   - Visit: `http://localhost:3000/api/telegram/setup?webhook_url=https://your-ngrok-url.ngrok.io/api/telegram/webhook`

### Step 4: Deploy to Vercel (Recommended)
1. Push your code to GitHub
2. Import your project in [Vercel](https://vercel.com)
3. Add all environment variables in Vercel dashboard:
   - `DATABASE_URL` (for production, use a proper database like Postgres)
   - `TELEGRAM_BOT_TOKEN`
   - `ENCRYPTION_SECRET`
   - `NEXT_PUBLIC_TELEGRAM_BOT_URL`
   - `NEXT_PUBLIC_BASE_URL` (your Vercel deployment URL)

4. After deployment, set the webhook:
   - Visit: `https://your-app.vercel.app/api/telegram/setup`
   - This will automatically configure Telegram to send updates to your Vercel endpoint

### Step 5: Test Your Bot
1. Open Telegram and search for your bot username
2. Send `/start` to your bot
3. You should see the welcome message with buttons
4. Try creating a wallet or checking balance

## 🎯 Quick Commands

### Check if webhook is set:
Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo`

### Test locally with ngrok:
```bash
# Terminal 1
npm run dev

# Terminal 2  
ngrok http 3000

# Then set webhook
curl "http://localhost:3000/api/telegram/setup?webhook_url=https://YOUR-NGROK-URL/api/telegram/webhook"
```

## 📱 Bot Features Ready
- ✅ Create Solana wallets
- ✅ Import wallets (encrypted)
- ✅ Check balance
- ✅ Send SOL
- ✅ Transaction history
- 🔄 Swap (coming soon)
- 🔄 Bridge (coming soon)

## 🐛 Troubleshooting

**Bot not responding?**
- Check webhook is set: Visit `/api/telegram/setup`
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check Vercel function logs

**Database errors?**
- Make sure `DATABASE_URL` is set
- For production, use a proper database (Postgres, MySQL, etc.)

## 📚 Documentation
- `TELEGRAM_BOT_SETUP.md` - Detailed setup guide
- `TELEGRAM_BOT_SUMMARY.md` - Implementation summary

