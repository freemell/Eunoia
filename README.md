# Eunoia - AI-Powered Solana Assistant

Eunoia is a rebranded, modern AI-powered Solana blockchain assistant with a cyber-matrix aesthetic. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🤖 **AI Chat Interface** - Natural language commands for Solana operations
- 💰 **Wallet Integration** - Connect with Phantom, Solflare, and other Solana wallets
- 💸 **Send SOL** - Send SOL to any address or .sol domain
- 🔄 **Token Swaps** - Swap tokens using Jupiter aggregator
- 📊 **Balance Checking** - Real-time SOL balance display
- 🎯 **Limit Orders** - Set buy/sell orders based on market cap or price
- 🎨 **Modern UI** - Cyber-matrix animated background with Eunoia branding

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Solana Web3.js
- **Wallets**: Solana Wallet Adapter
- **AI**: Groq API (Llama 3.1)
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Solana wallet (Phantom, Solflare, etc.)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/freemell/Eunoia.git
cd Eunoia
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
GROQ_API_KEY=your_groq_api_key
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
DATABASE_URL=file:./dev.db
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── chat/         # AI chat endpoint
│   │   └── solana/       # Solana operations
│   ├── docs/             # Documentation page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── wallet-provider.tsx # Wallet context
├── components/
│   ├── ui/               # UI components
│   │   ├── animated-input.tsx    # Orb input component
│   │   └── cyber-matrix-hero.tsx # Matrix background
│   └── eunoia-chat.tsx   # Main chat component
└── lib/
    └── utils.ts          # Utility functions
```

## Usage

1. **Connect Wallet**: Click the wallet button in the header to connect your Solana wallet
2. **Chat Commands**: Use natural language to interact:
   - "Send 0.1 SOL to [address]"
   - "What's my balance?"
   - "Swap 1 SOL for USDC"
   - "If BONK hits 50k mc, buy 0.1 SOL worth"

## Branding

Eunoia uses a cyber-matrix aesthetic with:
- **Primary Color**: Matrix Green (#00ff41)
- **Secondary Color**: Cyber Blue (#00d4ff)
- **Accent Color**: Neon Magenta (#ff00ff)
- **Background**: Animated matrix grid

## License

MIT
