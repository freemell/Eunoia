# Troubleshooting Telegram Bot

## Issue 1: Bot Not Responding to /start

### Step 1: Check Webhook Status
Run this PowerShell script:
```powershell
.\check-webhook.ps1
```

Or manually check:
```powershell
$token = "8068396024:AAEz8Ykj4XrO9FHy4qz-GTfOD5PwqAULlaI"
Invoke-RestMethod "https://api.telegram.org/bot$token/getWebhookInfo"
```

### Step 2: Set Webhook (if not set)
1. Get your Vercel deployment URL (e.g., `https://merlin-ai.vercel.app`)
2. Visit: `https://your-app.vercel.app/api/telegram/setup`
   
   OR manually set it:
   ```powershell
   $token = "8068396024:AAEz8Ykj4XrO9FHy4qz-GTfOD5PwqAULlaI"
   $webhookUrl = "https://your-app.vercel.app/api/telegram/webhook"
   
   $body = @{
       url = $webhookUrl
       allowed_updates = @("message", "callback_query")
   } | ConvertTo-Json
   
   Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/setWebhook" `
       -Method Post `
       -ContentType "application/json" `
       -Body $body
   ```

### Step 3: Check Vercel Function Logs
1. Go to Vercel dashboard
2. Click on your project
3. Go to "Functions" tab
4. Check logs for `/api/telegram/webhook`
5. Look for errors when you send `/start` to the bot

### Step 4: Verify Environment Variables in Vercel
Make sure these are set in Vercel dashboard:
- `TELEGRAM_BOT_TOKEN` = `8068396024:AAEz8Ykj4XrO9FHy4qz-GTfOD5PwqAULlaI`
- `ENCRYPTION_SECRET` = `590a64fc3c8f6b4f57c0fde30dcac4374ade7e370a171ee212d52e07cd7ea033`
- `DATABASE_URL` = (your database URL)
- `NEXT_PUBLIC_BASE_URL` = (your Vercel URL)
- `NEXT_PUBLIC_TELEGRAM_BOT_URL` = `https://t.me/askmerlin_bot`

### Step 5: Test Webhook Manually
```powershell
$token = "8068396024:AAEz8Ykj4XrO9FHy4qz-GTfOD5PwqAULlaI"
$webhookUrl = "https://your-app.vercel.app/api/telegram/webhook"

# Test by sending a sample update
$testUpdate = @{
    update_id = 123456789
    message = @{
        message_id = 1
        from = @{
            id = 123456789
            is_bot = $false
            first_name = "Test"
            username = "testuser"
        }
        chat = @{
            id = 123456789
            type = "private"
        }
        date = [int](Get-Date -UFormat %s)
        text = "/start"
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri $webhookUrl `
    -Method Post `
    -ContentType "application/json" `
    -Body $testUpdate
```

## Issue 2: Telegram Link Not Working

### Fix: Update Environment Variable
In Vercel dashboard, set:
```
NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/askmerlin_bot
```

**Important:** Must include `https://` at the beginning!

The code will now automatically add `https://` if missing, but best to set it correctly.

## Common Issues

### Webhook returns 404
- Check that the route exists: `/api/telegram/webhook`
- Verify Vercel deployment is successful
- Check that the URL is correct (no trailing slash)

### Webhook returns 500
- Check Vercel function logs
- Verify `TELEGRAM_BOT_TOKEN` is set correctly
- Check database connection if wallet operations fail

### Bot responds but commands don't work
- Check Vercel function logs for errors
- Verify all environment variables are set
- Check Prisma database connection

