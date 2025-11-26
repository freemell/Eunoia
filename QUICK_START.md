# Quick Start - Test Your Telegram Bot Locally

## Steps:

### 1. Make sure your dev server is running
```powershell
npm run dev
```
Keep this terminal open!

### 2. Start ngrok (in a NEW terminal)
```powershell
npx ngrok http 3000
```

You'll see output like:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

**Copy the HTTPS URL** (the one starting with `https://`)

### 3. Set the webhook
```powershell
.\set-webhook.ps1 https://your-ngrok-url.ngrok.io
```

Replace `https://your-ngrok-url.ngrok.io` with your actual ngrok URL!

### 4. Test your bot
1. Open Telegram
2. Search for `@askmerlin_bot`
3. Send `/start`

You should see the welcome message!

## Or use the helper script:
```powershell
.\start-ngrok.ps1
```

This will open ngrok in a new window, then use `set-webhook.ps1` with the URL.

## Troubleshooting

**"ngrok not found"?**
- Use `npx ngrok` instead of just `ngrok`
- Or download from https://ngrok.com/download

**Bot still not responding?**
- Make sure dev server is running (`npm run dev`)
- Make sure ngrok is running (should show HTTPS URL)
- Verify webhook is set:
  ```powershell
  $token = "8068396024:AAEz8Ykj4XrO9FHy4qz-GTfOD5PwqAULlaI"
  Invoke-RestMethod "https://api.telegram.org/bot$token/getWebhookInfo"
  ```

**Important:** Keep both terminals running:
- Terminal 1: `npm run dev` (your server)
- Terminal 2: `npx ngrok http 3000` (the tunnel)

