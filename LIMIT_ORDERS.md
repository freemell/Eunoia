# Limit Orders Feature

Merlin AI now supports limit orders with natural language! Set buy/sell orders that execute automatically when market conditions are met.

## Features

- **Natural Language Support**: Use plain English to create limit orders
- **Market Cap Triggers**: Set orders based on market cap (e.g., "when it hits 50k mc")
- **Price Triggers**: Set orders based on token price
- **Percentage-Based Orders**: Sell percentages of holdings (e.g., "sell 50%")
- **Automatic Execution**: Orders execute automatically when conditions are met
- **Instant Alerts**: Receive Telegram notifications when orders execute (success or failure)
- **Transaction Links**: Get direct links to view transactions on Solscan and Explorer

## Usage Examples

### Natural Language Commands

**Using Token Symbols:**
```
"if this coin hits 50k mc please buy"
"once it hits 100k, sell 50%"
"when BONK reaches 1M market cap, buy 0.5 SOL worth"
"sell half when price hits 0.001"
```

**Using Contract Addresses:**
```
"when DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263 hits 100k mc, buy 0.1 SOL"
"if contract address EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v reaches 0.99 price, sell all"
"once EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm hits 200k market cap, sell 50%"
```

You can use either:
- **Token symbols** (e.g., "BONK", "WIF", "USDC")
- **Contract addresses** (the full mint address, e.g., "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263")

### How It Works

1. **Create Order**: User creates a limit order via natural language
2. **Monitor**: Cron job checks orders every 5 minutes
3. **Execute**: When conditions are met, order executes automatically
4. **Alert**: User receives instant notification via Telegram with:
   - Order execution status (success/failure)
   - Transaction hash and explorer links
   - Token details and amount
   - Trigger information

## API Endpoints

### Create Limit Order
```
POST /api/limit-orders/create
{
  "walletAddress": "user_wallet_address",
  "tokenAddress": "token_mint_address_or_symbol", // Can be contract address or token symbol (e.g., "BONK")
  "tokenSymbol": "optional_token_symbol", // Optional, for display purposes
  "orderType": "buy" | "sell",
  "triggerType": "market_cap" | "price",
  "triggerValue": "50", // 50k for market cap, or "0.001" for price
  "amount": "0.1" | "50" | "all",
  "amountType": "fixed" | "percentage"
}
```

**Note:** The `tokenAddress` field accepts:
- Contract addresses (e.g., `"DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"`)
- Token symbols (e.g., `"BONK"`, `"WIF"`, `"USDC"`)
- The system automatically resolves symbols to their contract addresses

### List Limit Orders
```
GET /api/limit-orders/list?walletAddress=xxx&status=active
```

### Cancel Limit Order
```
POST /api/limit-orders/cancel
{
  "orderId": "order_id",
  "walletAddress": "user_wallet_address"
}
```

## Database Schema

The `LimitOrder` model stores:
- Order details (token, type, trigger conditions)
- Execution status
- Transaction hash when executed
- Error messages if execution fails

## Cron Job

The cron job runs every 5 minutes (configured in `vercel.json`):
- Checks all active limit orders
- Fetches current market data (price/market cap)
- Executes orders when conditions are met
- Updates order status

## Market Data

Uses Birdeye API (free tier) for market data:
- Token prices
- Market cap
- Falls back to CoinGecko if needed

## Setup

1. **Run Migration**:
```bash
npx prisma migrate dev
npx prisma generate
```

2. **Configure Vercel Cron** (if deploying to Vercel):
   - The `vercel.json` file is already configured
   - Cron job will run automatically

3. **Environment Variables**:
   - `CRON_SECRET` (optional): Secret token to protect cron endpoint
   - `SOLANA_RPC_URL`: Solana RPC endpoint
   - `DATABASE_URL`: Database connection string

## Notifications

When a limit order executes, you'll receive an instant alert via Telegram (if you're a Telegram user) with:

✅ **Success Notifications Include:**
- Order type (BUY/SELL)
- Token symbol/address
- Amount executed
- Trigger that was met
- Transaction hash
- Direct links to Solscan and Explorer

❌ **Failure Notifications Include:**
- Order details
- Error message
- Instructions to check and retry

**Note:** Notifications are currently available for Telegram users only. Web push notifications coming soon!

## Limitations

- Currently works for Telegram users only (web users need wallet adapter integration)
- Market data depends on token being listed on Birdeye/CoinGecko
- Orders check every 5 minutes (not real-time)
- Notifications require `TELEGRAM_BOT_TOKEN` to be set

## Future Enhancements

- Real-time price monitoring
- Web wallet support
- Order expiration dates
- Multiple trigger conditions
- Stop-loss orders

