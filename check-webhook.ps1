# Check Telegram webhook status
$TELEGRAM_BOT_TOKEN = "8068396024:AAEz8Ykj4XrO9FHy4qz-GTfOD5PwqAULlaI"

Write-Host "Checking webhook status..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
    
    Write-Host ""
    Write-Host "Webhook Status:" -ForegroundColor Yellow
    Write-Host "  URL: $($response.result.url)" -ForegroundColor $(if ($response.result.url) { "Green" } else { "Red" })
    Write-Host "  Pending Updates: $($response.result.pending_update_count)" -ForegroundColor Yellow
    Write-Host "  Has Custom Certificate: $($response.result.has_custom_certificate)" -ForegroundColor Yellow
    
    if ($response.result.last_error_date) {
        Write-Host ""
        Write-Host "⚠️  Last Error:" -ForegroundColor Red
        Write-Host "  Date: $([DateTimeOffset]::FromUnixTimeSeconds($response.result.last_error_date).DateTime)" -ForegroundColor Red
        Write-Host "  Message: $($response.result.last_error_message)" -ForegroundColor Red
    }
    
    if ($response.result.last_error_date -and $response.result.last_error_message) {
        Write-Host ""
        Write-Host "❌ Webhook has errors! Fix the URL and try again." -ForegroundColor Red
    } elseif ($response.result.url) {
        Write-Host ""
        Write-Host "✅ Webhook is set!" -ForegroundColor Green
        Write-Host "If bot still doesn't respond, check Vercel function logs." -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "❌ No webhook URL set!" -ForegroundColor Red
        Write-Host "Visit: https://your-app.vercel.app/api/telegram/setup" -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error checking webhook: $($_.Exception.Message)" -ForegroundColor Red
}

