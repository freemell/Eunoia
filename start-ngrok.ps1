# Start ngrok for Telegram bot local testing
# This script will start ngrok and show you the URL

Write-Host "Starting ngrok..." -ForegroundColor Cyan
Write-Host "Make sure your dev server is running on port 3000!" -ForegroundColor Yellow
Write-Host ""

# Try npx first (most reliable)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx ngrok http 3000"

Write-Host "✅ ngrok is starting in a new window..." -ForegroundColor Green
Write-Host ""
Write-Host "Look for the 'Forwarding' line in the ngrok window:" -ForegroundColor Yellow
Write-Host "  Forwarding    https://abc123.ngrok.io -> http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Copy the HTTPS URL and run set-webhook.ps1 with that URL" -ForegroundColor Yellow

