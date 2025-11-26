# Quick webhook setup script for local testing with ngrok
# Usage: After starting ngrok, run this script

$TELEGRAM_BOT_TOKEN = "8068396024:AAEz8Ykj4XrO9FHy4qz-GTfOD5PwqAULlaI"
$NGROK_URL = Read-Host "Enter your ngrok HTTPS URL (e.g., https://abc123.ngrok.io)"

if (-not $NGROK_URL) {
    Write-Host "No ngrok URL provided. Exiting."
    exit
}

$webhookUrl = "$NGROK_URL/api/telegram/webhook"

Write-Host "Setting webhook to: $webhookUrl"

$response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" `
    -Method Post `
    -ContentType "application/json" `
    -Body (@{
        url = $webhookUrl
        allowed_updates = @("message", "callback_query")
    } | ConvertTo-Json)

if ($response.ok) {
    Write-Host "✅ Webhook set successfully!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)"
} else {
    Write-Host "❌ Failed to set webhook: $($response.description)" -ForegroundColor Red
}

