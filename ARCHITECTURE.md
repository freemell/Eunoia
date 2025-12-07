# Eunoia Architecture

This document provides an overview of Eunoia's technical architecture and design decisions.

## System Overview

Eunoia is a Next.js 15 application that provides an AI-powered interface for Solana blockchain operations and Kalshi prediction markets. It combines natural language processing with blockchain interactions and prediction market trading through a modern web interface.

## Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animation library
- **Solana Wallet Adapter** - Wallet integration

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Database ORM
- **PostgreSQL** - Database (via Neon or similar)
- **Groq API** - AI/LLM service (Llama 3.1)

### Blockchain
- **Solana Web3.js** - Solana blockchain interaction
- **Jupiter Aggregator** - Token swap service
- **Solana Name Service** - Domain resolution

### Prediction Markets
- **Kalshi API** - Prediction market platform integration

## Architecture Patterns

### Client-Server Architecture

```
┌─────────────┐
│   Browser   │
│  (React)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Next.js    │
│  (SSR/API)  │
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
   ▼       ▼
┌─────┐ ┌────────┐
│ DB  │ │  APIs  │
│(PG) │ │(Groq)  │
└─────┘ └────────┘
```

### Component Structure

```
src/
├── app/
│   ├── api/              # API routes (server-side)
│   │   ├── chat/         # AI chat endpoint
│   │   ├── solana/       # Solana operations
│   │   └── telegram/     # Telegram bot webhook
│   ├── page.tsx          # Home page (client)
│   └── layout.tsx        # Root layout
├── components/
│   ├── ui/               # Reusable UI components
│   │   ├── animated-input.tsx
│   │   ├── cyber-matrix-hero.tsx
│   │   └── animated-ai-chat.tsx
│   └── ...
└── lib/
    ├── solana.ts         # Solana utilities
    ├── swap-service.ts   # Token swap logic
    ├── bridge.ts         # Bridge operations
    └── utils.ts          # General utilities
```

## Key Components

### 1. AI Chat System

**Flow:**
1. User sends message → `animated-ai-chat.tsx`
2. Message sent to `/api/chat`
3. Groq API processes with system prompt
4. Response parsed for Solana commands
5. Commands executed via Solana Web3.js
6. Results formatted and returned to user

**System Prompt:**
- Defines AI as "Eunoia"
- Provides Solana operation context
- Includes command examples

### 2. Wallet Integration

**Implementation:**
- Uses `@solana/wallet-adapter-react`
- Supports Phantom, Solflare, and other wallets
- Wallet state managed via React Context
- Transactions require explicit user approval

**Security:**
- Private keys never leave wallet
- All operations require wallet signature
- Connection state persisted in session

### 3. Solana Operations

**Available Operations:**
- **Send SOL**: Direct transfer to address/domain
- **Swap Tokens**: Via Jupiter aggregator
- **Check Balance**: Real-time SOL balance
- **Limit Orders**: Conditional buy/sell orders
- **Bridge**: Cross-chain operations

**Error Handling:**
- Network errors caught and displayed
- Transaction failures logged
- User-friendly error messages

### 4. Database Schema

**Models:**
- `TelegramUser`: Telegram bot users
- `LimitOrder`: Pending limit orders
- Encrypted private keys for Telegram wallet

**Migrations:**
- Prisma manages schema changes
- PostgreSQL for production
- Migrations version controlled

## Data Flow

### Chat Message Flow

```
User Input
    ↓
OrbInput Component
    ↓
animated-ai-chat.tsx
    ↓
POST /api/chat
    ↓
Groq API (AI Processing)
    ↓
Command Parser
    ↓
Solana Operations
    ↓
Response Formatter
    ↓
UI Update
```

### Transaction Flow

```
User Command
    ↓
AI Parses Intent
    ↓
Transaction Builder
    ↓
Wallet Approval
    ↓
Transaction Signing
    ↓
Network Submission
    ↓
Confirmation
    ↓
UI Update
```

## Security Considerations

### Client-Side
- No sensitive data in client code
- API keys never exposed
- Wallet operations isolated

### Server-Side
- Environment variables for secrets
- Input validation on all endpoints
- Rate limiting on API routes
- Error messages don't leak sensitive info

### Database
- Encryption for sensitive fields
- SSL/TLS connections
- Parameterized queries (Prisma)

## Performance Optimizations

1. **Static Generation**: Pages pre-rendered where possible
2. **Code Splitting**: Automatic via Next.js
3. **Image Optimization**: Next.js Image component
4. **API Caching**: Response caching for balance checks
5. **Lazy Loading**: Components loaded on demand

## Deployment

### Vercel
- Automatic deployments from main branch
- Environment variables configured
- Serverless functions for API routes
- Cron jobs for limit order checks

### Database
- Neon PostgreSQL (serverless)
- Connection pooling
- Automatic backups

## Future Enhancements

- [ ] Multi-chain support
- [ ] Advanced trading features
- [ ] Portfolio tracking
- [ ] NFT support
- [ ] Mobile app
- [ ] Enhanced AI capabilities

## Development Guidelines

1. **Type Safety**: Use TypeScript strictly
2. **Component Structure**: Keep components focused
3. **Error Handling**: Always handle errors gracefully
4. **Testing**: Test wallet operations on devnet
5. **Documentation**: Update docs with changes

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Groq API](https://console.groq.com/docs)

