# Eunoia API Documentation

This document describes the API endpoints available in Eunoia, including Solana blockchain operations and Kalshi prediction market integration.

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://your-app.vercel.app`

## Authentication

Most endpoints require a connected Solana wallet. Wallet connection is handled client-side via Solana Wallet Adapter.

## Endpoints

### Chat

#### `POST /api/chat`

Send a message to the AI assistant.

**Request Body:**
```json
{
  "message": "Send 0.1 SOL to example.sol",
  "publicKey": "string (optional, wallet address)"
}
```

**Response:**
```json
{
  "response": "I'll send 0.1 SOL to example.sol...",
  "action": "send_sol",
  "data": {
    "to": "address",
    "amount": 0.1
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad request
- `500` - Server error

---

### Solana Operations

#### `GET /api/solana/balance`

Get SOL balance for a wallet address.

**Query Parameters:**
- `address` (required) - Solana wallet address

**Response:**
```json
{
  "balance": 1.5,
  "address": "string"
}
```

#### `POST /api/solana/send`

Send SOL to an address.

**Request Body:**
```json
{
  "to": "address or .sol domain",
  "amount": 0.1,
  "publicKey": "sender address"
}
```

**Response:**
```json
{
  "signature": "transaction signature",
  "status": "success"
}
```

#### `POST /api/solana/swap`

Swap tokens using Jupiter aggregator.

**Request Body:**
```json
{
  "inputMint": "So11111111111111111111111111111111111111112",
  "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "amount": 1000000000,
  "slippageBps": 50
}
```

**Response:**
```json
{
  "swapTransaction": "base64 encoded transaction",
  "quote": {
    "inputAmount": 1000000000,
    "outputAmount": 1500000000
  }
}
```

#### `GET /api/solana/resolve-domain`

Resolve a .sol domain to a wallet address.

**Query Parameters:**
- `domain` (required) - Domain name (e.g., "example.sol")

**Response:**
```json
{
  "address": "resolved wallet address",
  "domain": "example.sol"
}
```

#### `POST /api/solana/bridge`

Get bridge quote and transaction.

**Request Body:**
```json
{
  "fromChain": "solana",
  "toChain": "ethereum",
  "token": "SOL",
  "amount": 1.0,
  "recipient": "address"
}
```

**Response:**
```json
{
  "quote": {
    "estimatedTime": 300,
    "fee": 0.01
  },
  "transaction": "base64 encoded transaction"
}
```

---

### Limit Orders

#### `POST /api/limit-orders/create`

Create a new limit order.

**Request Body:**
```json
{
  "tokenAddress": "string",
  "orderType": "buy" | "sell",
  "triggerType": "market_cap" | "price",
  "triggerValue": 50000,
  "amount": 0.1,
  "publicKey": "wallet address"
}
```

**Response:**
```json
{
  "id": "order_id",
  "status": "pending"
}
```

#### `GET /api/limit-orders/list`

Get all limit orders for a wallet.

**Query Parameters:**
- `publicKey` (required) - Wallet address

**Response:**
```json
{
  "orders": [
    {
      "id": "string",
      "tokenAddress": "string",
      "orderType": "buy",
      "status": "pending",
      "createdAt": "timestamp"
    }
  ]
}
```

#### `POST /api/limit-orders/cancel`

Cancel a limit order.

**Request Body:**
```json
{
  "orderId": "string",
  "publicKey": "wallet address"
}
```

**Response:**
```json
{
  "status": "cancelled"
}
```

---

### Transactions

#### `GET /api/transactions/history`

Get transaction history for a wallet.

**Query Parameters:**
- `address` (required) - Wallet address
- `limit` (optional) - Number of transactions (default: 10)

**Response:**
```json
{
  "transactions": [
    {
      "signature": "string",
      "type": "send" | "swap" | "receive",
      "amount": 0.1,
      "timestamp": "ISO string"
    }
  ]
}
```

---

### Telegram Bot

#### `POST /api/telegram/webhook`

Webhook endpoint for Telegram bot.

**Request Body:**
Telegram webhook payload (see [Telegram Bot API](https://core.telegram.org/bots/api))

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Common Error Codes:**
- `WALLET_NOT_CONNECTED` - Wallet not connected
- `INSUFFICIENT_BALANCE` - Not enough SOL
- `INVALID_ADDRESS` - Invalid wallet address
- `NETWORK_ERROR` - Solana network error
- `RATE_LIMIT_EXCEEDED` - Too many requests

## Rate Limiting

- Chat endpoint: 10 requests per minute
- Solana operations: 20 requests per minute
- Other endpoints: 30 requests per minute

## WebSocket (Future)

Real-time updates for:
- Balance changes
- Transaction confirmations
- Limit order triggers

## Examples

### JavaScript/TypeScript

```typescript
// Send SOL
const response = await fetch('/api/solana/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'example.sol',
    amount: 0.1,
    publicKey: walletAddress
  })
});

const data = await response.json();
```

### cURL

```bash
# Get balance
curl "http://localhost:3000/api/solana/balance?address=YOUR_ADDRESS"

# Send message to AI
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is my balance?"}'
```

## Versioning

Current API version: `v1`

API versioning will be implemented in future updates.

