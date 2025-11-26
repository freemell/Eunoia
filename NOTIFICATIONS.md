# Limit Order Notifications

Merlin AI sends instant alerts when your limit orders execute!

## How It Works

When a limit order is executed (or fails), the system automatically sends a notification to the user.

### Telegram Notifications

If you created the limit order via Telegram, you'll receive a message directly in Telegram with:

**Success Notification:**
```
🟢 Limit Order Executed!

📊 Order: BOUGHT 0.1 SOL of BONK
🎯 Trigger: 100k market cap
✅ Status: Success

🔗 View on Solscan
🌐 View on Explorer
```

**Failure Notification:**
```
❌ Limit Order Failed

📊 Order: SELL 50% of WIF
🎯 Trigger: $0.001 price
❌ Status: Failed
⚠️ Error: Insufficient balance

Please check your order and try again.
```

## Notification Details

Each notification includes:
- ✅ Order type (BUY/SELL)
- 📊 Token information (symbol or address)
- 💰 Amount executed
- 🎯 Trigger that was met
- 🔗 Transaction links (on success)
- ⚠️ Error details (on failure)

## Setup

Notifications work automatically if:
1. `TELEGRAM_BOT_TOKEN` is set in environment variables
2. User has a `telegramId` associated with their limit order

## Future Enhancements

- 📧 Email notifications
- 🔔 Web push notifications
- 📱 SMS notifications
- ⚠️ Pre-execution alerts (when approaching trigger)
- 📊 Order status dashboard

