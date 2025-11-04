# Fix Telegram webhook with your actual Vercel URL
param(
    [Parameter(Mandatory=$true)]
    [string]$VercelUrl
)

$TELEGRAM_BOT_TOKEN = "8068396024:AAEz8Ykj4XrO9FHy4qz-GTfOD5PwqAULlaI"

# Remove trailing slash if present
$VercelUrl = $VercelUrl.TrimEnd('/')

$webhookUrl = "$VercelUrl/api/telegram/webhook"

Write-Host "Setting webhook to: $webhookUrl" -ForegroundColor Cyan

$body = @{
    url = $webhookUrl
    allowed_updates = @("message", "callback_query")
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body

    if ($response.ok) {
        Write-Host ""
        Write-Host "✅ Webhook set successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Now test your bot:" -ForegroundColor Yellow
        Write-Host "1. Open Telegram" -ForegroundColor White
        Write-Host "2. Search for: @askmerlin_bot" -ForegroundColor White
        Write-Host "3. Send: /start" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "❌ Failed to set webhook: $($response.description)" -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

