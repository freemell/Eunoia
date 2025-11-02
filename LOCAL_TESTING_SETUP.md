# Local Testing Setup for Telegram Bot

## The Problem
Telegram webhooks need a **public HTTPS URL** to send updates to your bot. Your localhost:3000 isn't accessible from the internet.

## Solution: Use ngrok

### Step 1: Install ngrok
```bash
npm install -g ngrok
# OR download from https://ngrok.com/download
```

### Step 2: Start Your Dev Server
```bash
npm run dev
```
Keep this running in Terminal 1.

### Step 3: Start ngrok (in a NEW terminal)
```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

**Copy the HTTPS URL** (the one starting with `https://`)

### Step 4: Set the Webhook
Open a new PowerShell terminal and run:

```powershell
$token = "8068396024:AAEz8Ykj4XrO9FHy4qz-GTfOD5PwqAULlaI"
$ngrokUrl = Read-Host "Enter your ngrok HTTPS URL"
$webhookUrl = "$ngrokUrl/api/telegram/webhook"

$body = @{
    url = $webhookUrl
    allowed_updates = @("message", "callback_query")
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/setWebhook" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

OR use the provided script:
```powershell
.\test-webhook.ps1
```

### Step 5: Test Your Bot
1. Open Telegram
2. Search for your bot: `@askmerlin_bot`
3. Send `/start`
4. You should now see the welcome message!

## Verify Webhook is Set
Run this to check:
```powershell
$token = "8068396024:AAEz8Ykj4XrO9FHy4qz-GTfOD5PwqAULlaI"
Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/getWebhookInfo"
```

## Troubleshooting

**Bot still not responding?**
1. Make sure `npm run dev` is running
2. Make sure ngrok is running and showing HTTPS URL
3. Verify webhook is set (check with getWebhookInfo)
4. Check your dev server console for errors
5. Try sending `/start` again

**ngrok URL changed?**
- Free ngrok gives a new URL each time
- You need to update the webhook each time you restart ngrok
- Or get a free ngrok account for a stable URL

## Alternative: Deploy to Vercel
For production testing, deploy to Vercel:
1. Push code to GitHub
2. Deploy on Vercel
3. Set webhook to: `https://your-app.vercel.app/api/telegram/webhook`

