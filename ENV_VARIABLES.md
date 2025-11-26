# Environment Variables

This document lists all the environment variables required for the Merlin AI project.

## Required Environment Variables

### Telegram Bot Configuration
- `TELEGRAM_BOT_TOKEN` - Token for the Telegram bot
- `NEXT_PUBLIC_TELEGRAM_BOT_URL` - Public URL for the Telegram bot

### Database
- `DATABASE_URL` - Database connection string

### Security
- `ENCRYPTION_SECRET` - Secret key for encryption

### AI Services
- `OPENAI_API_KEY` - OpenAI API key
- `GROQ_API_KEY` - Groq API key

### Solana Configuration
- `SOLANA_RPC_URL` - Solana RPC endpoint URL
- `NEXT_PUBLIC_SOLANA_RPC_URL` - Public Solana RPC endpoint URL

## Setup Instructions

1. Create a `.env` file in the root directory
2. Copy the variables above and add your actual values
3. For production, set these in your Vercel project settings under Environment Variables

## Notes

- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Keep sensitive keys (like `ENCRYPTION_SECRET`, `TELEGRAM_BOT_TOKEN`, API keys) secure and never commit them to version control

