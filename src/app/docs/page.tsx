/* eslint-disable react/no-unescaped-entities */
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Eunoia Documentation - Limit Orders & Features',
  description: 'Complete documentation for Eunoia - Limit orders, natural language commands, and Solana blockchain operations',
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <Link 
            href="/" 
            className="inline-flex items-center text-eunoia-primary hover:text-eunoia-secondary mb-6 transition-colors"
          >
            ← Back to Eunoia
          </Link>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-eunoia-primary to-eunoia-secondary bg-clip-text text-transparent">
            Eunoia Documentation
          </h1>
          <p className="text-gray-400 text-lg">
            Complete guide to using Merlin AI for Solana blockchain operations
          </p>
        </div>

        {/* Table of Contents */}
        <div className="mb-12 p-6 bg-black/40 border border-purple-500/30 rounded-xl backdrop-blur-sm">
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">Table of Contents</h2>
          <ul className="space-y-2 text-gray-300">
            <li><a href="#limit-orders" className="hover:text-purple-400 transition-colors">1. Limit Orders</a></li>
            <li><a href="#natural-language" className="hover:text-purple-400 transition-colors">2. Natural Language Commands</a></li>
            <li><a href="#features" className="hover:text-purple-400 transition-colors">3. Features</a></li>
            <li><a href="#notifications" className="hover:text-purple-400 transition-colors">4. Notifications</a></li>
            <li><a href="#api" className="hover:text-purple-400 transition-colors">5. API Reference</a></li>
            <li><a href="#examples" className="hover:text-purple-400 transition-colors">6. Examples</a></li>
          </ul>
        </div>

        {/* Limit Orders Section */}
        <section id="limit-orders" className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-purple-300">1. Limit Orders</h2>
          
          <div className="space-y-6">
            <div className="p-6 bg-black/40 border border-purple-500/30 rounded-xl backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4 text-blue-300">What are Limit Orders?</h3>
              <p className="text-gray-300 mb-4">
                Limit orders allow you to automatically buy or sell tokens when specific market conditions are met. 
                You can set orders based on market cap or price, and Merlin will execute them automatically.
              </p>
              <div className="bg-black/60 p-4 rounded-lg border border-purple-500/20">
                <p className="text-sm text-gray-400 mb-2">Example:</p>
                <code className="text-purple-300">"if BONK hits 100k mc please buy 0.1 SOL worth"</code>
              </div>
            </div>

            <div className="p-6 bg-black/40 border border-purple-500/30 rounded-xl backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4 text-blue-300">How It Works</h3>
              <ol className="list-decimal list-inside space-y-3 text-gray-300">
                <li>Create a limit order using natural language</li>
                <li>Merlin monitors market conditions daily (or more frequently on Pro plan)</li>
                <li>When conditions are met, the order executes automatically</li>
                <li>You receive an instant notification with transaction details</li>
              </ol>
            </div>

            <div className="p-6 bg-black/40 border border-purple-500/30 rounded-xl backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4 text-blue-300">Trigger Types</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-purple-300 mb-2">Market Cap Triggers</h4>
                  <p className="text-gray-300 mb-2">Execute when token reaches a specific market cap:</p>
                  <ul className="list-disc list-inside text-gray-400 space-y-1 ml-4">
                    <li>"when it hits 50k mc" = 50,000 market cap</li>
                    <li>"once it reaches 1M market cap" = 1,000,000 market cap</li>
                    <li>Values are in thousands (50k = "50", 1M = "1000")</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-300 mb-2">Price Triggers</h4>
                  <p className="text-gray-300 mb-2">Execute when token reaches a specific price:</p>
                  <ul className="list-disc list-inside text-gray-400 space-y-1 ml-4">
                    <li>"when price hits $0.001"</li>
                    <li>"sell when it reaches 0.99"</li>
                    <li>Price values are in USD</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Natural Language Section */}
        <section id="natural-language" className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-purple-300">2. Natural Language Commands</h2>
          
          <div className="space-y-6">
            <div className="p-6 bg-black/40 border border-purple-500/30 rounded-xl backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4 text-blue-300">Creating Limit Orders</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-300 mb-2 font-medium">Buy Orders:</p>
                  <div className="bg-black/60 p-3 rounded-lg border border-purple-500/20 space-y-2">
                    <code className="block text-purple-300">"if this coin hits 50k mc please buy"</code>
                    <code className="block text-purple-300">"when BONK reaches 100k market cap, buy 0.5 SOL worth"</code>
                    <code className="block text-purple-300">"buy 0.1 SOL when DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263 hits 200k mc"</code>
                  </div>
                </div>
                <div>
                  <p className="text-gray-300 mb-2 font-medium">Sell Orders:</p>
                  <div className="bg-black/60 p-3 rounded-lg border border-purple-500/20 space-y-2">
                    <code className="block text-purple-300">"once it hits 100k, sell 50%"</code>
                    <code className="block text-purple-300">"sell half when price hits 0.001"</code>
                    <code className="block text-purple-300">"when WIF reaches 1M market cap, sell all"</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-black/40 border border-purple-500/30 rounded-xl backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4 text-blue-300">Token Identification</h3>
              <p className="text-gray-300 mb-4">
                You can specify tokens in multiple ways:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li><strong>Token Symbols:</strong> "BONK", "WIF", "USDC"</li>
                <li><strong>Contract Addresses:</strong> Full mint address (e.g., "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263")</li>
                <li><strong>Context:</strong> "this coin", "it" (when referring to a previously mentioned token)</li>
              </ul>
            </div>

            <div className="p-6 bg-black/40 border border-purple-500/30 rounded-xl backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4 text-blue-300">Amount Types</h3>
              <div className="space-y-3 text-gray-300">
                <div>
                  <strong className="text-purple-300">Fixed Amount:</strong> Specify exact amount
                  <code className="block mt-1 text-purple-300 bg-black/60 p-2 rounded">"buy 0.1 SOL worth"</code>
                </div>
                <div>
                  <strong className="text-purple-300">Percentage:</strong> Sell a percentage of holdings
                  <code className="block mt-1 text-purple-300 bg-black/60 p-2 rounded">"sell 50%" or "sell half"</code>
                </div>
                <div>
                  <strong className="text-purple-300">All:</strong> Sell entire balance
                  <code className="block mt-1 text-purple-300 bg-black/60 p-2 rounded">"sell all"</code>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-purple-300">3. Features</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-black/40 border border-purple-500/30 rounded-xl backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-3 text-blue-300">✨ Natural Language</h3>
              <p className="text-gray-300">
                Use plain English to create orders. No complex commands or syntax needed.
              </p>
            </div>

            <div className="p-6 bg-black/40 border border-purple-500/30 rounded-xl backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-3 text-blue-300">📊 Market Cap & Price</h3>
              <p className="text-gray-300">
                Set triggers based on market cap (in thousands) or token price (in USD).
              </p>
            </div>

            <div className="p-6 bg-black/40 border border-purple-500/30 rounded-xl backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-3 text-blue-300">🔄 Auto Execution</h3>
              <p className="text-gray-300">
                Orders execute automatically when conditions are met. No manual intervention needed.
              </p>
            </div>

            <div className="p-6 bg-black/40 border border-purple-500/30 rounded-xl backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-3 text-blue-300">📱 Instant Alerts</h3>
              <p className="text-gray-300">
                Receive Telegram notifications when orders execute with transaction links.
              </p>
            </div>

            <div className="p-6 bg-black/40 border border-purple-500/30 rounded-xl backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-3 text-blue-300">💯 Percentage Orders</h3>
              <p className="text-gray-300">
                Sell percentages of your holdings (e.g., "sell 50%", "sell half", "sell all").
              </p>
            </div>

            <div className="p-6 bg-black/40 border border-purple-500/30 rounded-xl backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-3 text-blue-300">🔗 Contract Support</h3>
              <p className="text-gray-300">
                Use token symbols or contract addresses directly. Works with any Solana token.
              </p>
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section id="notifications" className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-purple-300">4. Notifications</h2>
          
          <div className="p-6 bg-black/40 border border-purple-500/30 rounded-xl backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-4 text-blue-300">Telegram Alerts</h3>
            <p className="text-gray-300 mb-4">
              When a limit order executes, you'll receive an instant notification via Telegram with:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Order type (BUY/SELL) and amount</li>
              <li>Token information</li>
              <li>Trigger that was met</li>
              <li>Transaction hash</li>
              <li>Direct links to Solscan and Explorer</li>
            </ul>
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-300 text-sm">
                ✅ Success notifications include transaction links for easy verification
              </p>
            </div>
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-300 text-sm">
                ❌ Failure notifications include error details to help you fix the issue
              </p>
            </div>
          </div>
        </section>

        {/* API Section */}
        <section id="api" className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-purple-300">5. API Reference</h2>
          
          <div className="space-y-6">
            <div className="p-6 bg-black/40 border border-purple-500/30 rounded-xl backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4 text-blue-300">Create Limit Order</h3>
              <div className="bg-black/60 p-4 rounded-lg border border-purple-500/20">
                <code className="text-purple-300 text-sm">
                  POST /api/limit-orders/create
                </code>
                <pre className="mt-3 text-gray-300 text-xs overflow-x-auto">
{`{
  "walletAddress": "user_wallet",
  "tokenAddress": "token_mint_or_symbol",
  "orderType": "buy" | "sell",
  "triggerType": "market_cap" | "price",
  "triggerValue": "50",
  "amount": "0.1" | "50" | "all",
  "amountType": "fixed" | "percentage"
}`}
                </pre>
              </div>
            </div>

            <div className="p-6 bg-black/40 border border-purple-500/30 rounded-xl backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4 text-blue-300">List Orders</h3>
              <div className="bg-black/60 p-4 rounded-lg border border-purple-500/20">
                <code className="text-purple-300 text-sm">
                  GET /api/limit-orders/list?walletAddress=xxx&status=active
                </code>
              </div>
            </div>

            <div className="p-6 bg-black/40 border border-purple-500/30 rounded-xl backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4 text-blue-300">Cancel Order</h3>
              <div className="bg-black/60 p-4 rounded-lg border border-purple-500/20">
                <code className="text-purple-300 text-sm">
                  POST /api/limit-orders/cancel
                </code>
                <pre className="mt-3 text-gray-300 text-xs overflow-x-auto">
{`{
  "orderId": "order_id",
  "walletAddress": "user_wallet"
}`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Examples Section */}
        <section id="examples" className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-purple-300">6. Examples</h2>
          
          <div className="space-y-6">
            <div className="p-6 bg-black/40 border border-purple-500/30 rounded-xl backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4 text-blue-300">Example 1: Buy on Market Cap</h3>
              <div className="bg-black/60 p-4 rounded-lg border border-purple-500/20">
                <p className="text-gray-400 text-sm mb-2">Command:</p>
                <code className="text-purple-300 block mb-4">
                  "if BONK hits 100k mc please buy 0.1 SOL worth"
                </code>
                <p className="text-gray-400 text-sm mb-2">What happens:</p>
                <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside ml-4">
                  <li>Order created: Buy 0.1 SOL worth of BONK</li>
                  <li>Trigger: When BONK market cap reaches 100k</li>
                  <li>Execution: Automatic when condition is met</li>
                  <li>Notification: Sent via Telegram with transaction link</li>
                </ul>
              </div>
            </div>

            <div className="p-6 bg-black/40 border border-purple-500/30 rounded-xl backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4 text-blue-300">Example 2: Sell Percentage</h3>
              <div className="bg-black/60 p-4 rounded-lg border border-purple-500/20">
                <p className="text-gray-400 text-sm mb-2">Command:</p>
                <code className="text-purple-300 block mb-4">
                  "once WIF hits 200k, sell 50%"
                </code>
                <p className="text-gray-400 text-sm mb-2">What happens:</p>
                <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside ml-4">
                  <li>Order created: Sell 50% of WIF holdings</li>
                  <li>Trigger: When WIF market cap reaches 200k</li>
                  <li>Execution: Calculates 50% of current balance and sells</li>
                  <li>Notification: Sent when order executes</li>
                </ul>
              </div>
            </div>

            <div className="p-6 bg-black/40 border border-purple-500/30 rounded-xl backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4 text-blue-300">Example 3: Price-Based Order</h3>
              <div className="bg-black/60 p-4 rounded-lg border border-purple-500/20">
                <p className="text-gray-400 text-sm mb-2">Command:</p>
                <code className="text-purple-300 block mb-4">
                  "sell all when price hits 0.001"
                </code>
                <p className="text-gray-400 text-sm mb-2">What happens:</p>
                <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside ml-4">
                  <li>Order created: Sell 100% of token holdings</li>
                  <li>Trigger: When token price reaches $0.001</li>
                  <li>Execution: Sells entire balance when price target is met</li>
                  <li>Notification: Sent with transaction details</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-purple-500/20 text-center">
          <p className="text-gray-400 mb-4">
            Need help? Check out our <Link href="https://github.com/freemell/Eunoia" className="text-purple-400 hover:text-purple-300 transition-colors">GitHub repository</Link>
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center text-eunoia-primary hover:text-eunoia-secondary transition-colors"
          >
            ← Back to Eunoia
          </Link>
        </div>
      </div>
    </div>
  );
}

