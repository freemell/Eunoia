/* eslint-disable react/no-unescaped-entities */
"use client";
import Link from 'next/link';
import { motion } from 'framer-motion';
import CyberMatrixHero from '@/components/ui/cyber-matrix-hero';
import { FileText, ArrowLeft, Book, Zap, Shield, Bell, Code, TrendingUp, Wallet } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Cyber Matrix Background */}
      <CyberMatrixHero />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <Link 
            href="/" 
            className="inline-flex items-center space-x-2 text-purple-400 hover:text-purple-300 mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Eunoia</span>
          </Link>
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/30">
              <FileText className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                Eunoia Documentation
              </h1>
              <p className="text-gray-400 text-lg">
                Complete guide to using Eunoia for Solana blockchain operations and Kalshi prediction markets
              </p>
            </div>
          </div>
        </motion.div>

        {/* Table of Contents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12 p-6 bg-black/60 border border-purple-500/30 rounded-xl backdrop-blur-md shadow-xl"
        >
          <h2 className="text-2xl font-semibold mb-4 text-purple-300 flex items-center space-x-2">
            <Book className="w-5 h-5" />
            <span>Table of Contents</span>
          </h2>
          <ul className="space-y-2 text-gray-300">
            <li><a href="#limit-orders" className="hover:text-purple-400 transition-colors flex items-center space-x-2"><Zap className="w-4 h-4" /><span>1. Limit Orders</span></a></li>
            <li><a href="#kalshi" className="hover:text-purple-400 transition-colors flex items-center space-x-2"><TrendingUp className="w-4 h-4" /><span>2. Kalshi Prediction Markets</span></a></li>
            <li><a href="#natural-language" className="hover:text-purple-400 transition-colors flex items-center space-x-2"><Code className="w-4 h-4" /><span>3. Natural Language Commands</span></a></li>
            <li><a href="#features" className="hover:text-purple-400 transition-colors flex items-center space-x-2"><TrendingUp className="w-4 h-4" /><span>4. Features</span></a></li>
            <li><a href="#notifications" className="hover:text-purple-400 transition-colors flex items-center space-x-2"><Bell className="w-4 h-4" /><span>5. Notifications</span></a></li>
            <li><a href="#api" className="hover:text-purple-400 transition-colors flex items-center space-x-2"><Code className="w-4 h-4" /><span>6. API Reference</span></a></li>
            <li><a href="#examples" className="hover:text-purple-400 transition-colors flex items-center space-x-2"><FileText className="w-4 h-4" /><span>7. Examples</span></a></li>
          </ul>
        </motion.div>

        {/* Limit Orders Section */}
        <section id="limit-orders" className="mb-16">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold mb-6 text-purple-300 flex items-center space-x-3"
          >
            <Zap className="w-8 h-8" />
            <span>1. Limit Orders</span>
          </motion.h2>
          
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="p-6 bg-black/60 border border-purple-500/30 rounded-xl backdrop-blur-md shadow-xl"
            >
              <h3 className="text-xl font-semibold mb-4 text-blue-300">What are Limit Orders?</h3>
              <p className="text-gray-300 mb-4">
                Limit orders allow you to automatically buy or sell tokens when specific market conditions are met. 
                You can set orders based on market cap or price, and Eunoia will execute them automatically.
              </p>
              <div className="bg-black/80 p-4 rounded-lg border border-purple-500/20">
                <p className="text-sm text-gray-400 mb-2">Example:</p>
                <code className="text-purple-300 text-sm">"if BONK hits 100k mc please buy 0.1 SOL worth"</code>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-6 bg-black/60 border border-purple-500/30 rounded-xl backdrop-blur-md shadow-xl"
            >
              <h3 className="text-xl font-semibold mb-4 text-blue-300">How It Works</h3>
              <ol className="list-decimal list-inside space-y-3 text-gray-300">
                <li>Create a limit order using natural language</li>
                <li>Eunoia monitors market conditions daily (or more frequently on Pro plan)</li>
                <li>When conditions are met, the order executes automatically</li>
                <li>You receive an instant notification with transaction details</li>
              </ol>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-6 bg-black/60 border border-purple-500/30 rounded-xl backdrop-blur-md shadow-xl"
            >
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
            </motion.div>
          </div>
        </section>

        {/* Kalshi Prediction Markets Section */}
        <section id="kalshi" className="mb-16">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold mb-6 text-purple-300 flex items-center space-x-3"
          >
            <TrendingUp className="w-8 h-8" />
            <span>2. Kalshi Prediction Markets</span>
          </motion.h2>
          
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="p-6 bg-black/60 border border-purple-500/30 rounded-xl backdrop-blur-md shadow-xl"
            >
              <h3 className="text-xl font-semibold mb-4 text-blue-300">What is Kalshi?</h3>
              <p className="text-gray-300 mb-4">
                Eunoia is powered by Kalshi, a prediction market platform where you can bet on real-world events. 
                Through Eunoia's natural language interface, you can search markets, place bets, and track your positions on Kalshi.
              </p>
              <div className="bg-black/80 p-4 rounded-lg border border-purple-500/20">
                <p className="text-sm text-gray-400 mb-2">Example:</p>
                <code className="text-purple-300 text-sm">"Show odds on inflation above 3%"</code>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-6 bg-black/60 border border-purple-500/30 rounded-xl backdrop-blur-md shadow-xl"
            >
              <h3 className="text-xl font-semibold mb-4 text-blue-300">Kalshi Commands</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-purple-300 mb-2">Search Markets</h4>
                  <p className="text-gray-300 mb-2">Find prediction markets by topic:</p>
                  <ul className="list-disc list-inside text-gray-400 space-y-1 ml-4">
                    <li>"Show odds on inflation above 3%"</li>
                    <li>"What markets are available for elections?"</li>
                    <li>"Search for weather markets"</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-300 mb-2">Place Bets</h4>
                  <p className="text-gray-300 mb-2">Bet on market outcomes:</p>
                  <ul className="list-disc list-inside text-gray-400 space-y-1 ml-4">
                    <li>"Bet 0.05 SOL yes on rain in NYC tomorrow"</li>
                    <li>"Place a bet on inflation being above 3%"</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-300 mb-2">Check Positions</h4>
                  <p className="text-gray-300 mb-2">View your active bets:</p>
                  <ul className="list-disc list-inside text-gray-400 space-y-1 ml-4">
                    <li>"Check my Kalshi positions"</li>
                    <li>"Show my active bets"</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Natural Language Section */}
        <section id="natural-language" className="mb-16">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold mb-6 text-purple-300 flex items-center space-x-3"
          >
            <Code className="w-8 h-8" />
            <span>3. Natural Language Commands</span>
          </motion.h2>
          
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="p-6 bg-black/60 border border-purple-500/30 rounded-xl backdrop-blur-md shadow-xl"
            >
              <h3 className="text-xl font-semibold mb-4 text-blue-300">Creating Limit Orders</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-300 mb-2 font-medium">Buy Orders:</p>
                  <div className="bg-black/80 p-3 rounded-lg border border-purple-500/20 space-y-2">
                    <code className="block text-purple-300 text-sm">"if this coin hits 50k mc please buy"</code>
                    <code className="block text-purple-300 text-sm">"when BONK reaches 100k market cap, buy 0.5 SOL worth"</code>
                    <code className="block text-purple-300 text-sm">"buy 0.1 SOL when DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263 hits 200k mc"</code>
                  </div>
                </div>
                <div>
                  <p className="text-gray-300 mb-2 font-medium">Sell Orders:</p>
                  <div className="bg-black/80 p-3 rounded-lg border border-purple-500/20 space-y-2">
                    <code className="block text-purple-300 text-sm">"once it hits 100k, sell 50%"</code>
                    <code className="block text-purple-300 text-sm">"sell half when price hits 0.001"</code>
                    <code className="block text-purple-300 text-sm">"when WIF reaches 1M market cap, sell all"</code>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-6 bg-black/60 border border-purple-500/30 rounded-xl backdrop-blur-md shadow-xl"
            >
              <h3 className="text-xl font-semibold mb-4 text-blue-300">Token Identification</h3>
              <p className="text-gray-300 mb-4">
                You can specify tokens in multiple ways:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li><strong>Token Symbols:</strong> "BONK", "WIF", "USDC"</li>
                <li><strong>Contract Addresses:</strong> Full mint address (e.g., "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263")</li>
                <li><strong>Context:</strong> "this coin", "it" (when referring to a previously mentioned token)</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-6 bg-black/60 border border-purple-500/30 rounded-xl backdrop-blur-md shadow-xl"
            >
              <h3 className="text-xl font-semibold mb-4 text-blue-300">Amount Types</h3>
              <div className="space-y-3 text-gray-300">
                <div>
                  <strong className="text-purple-300">Fixed Amount:</strong> Specify exact amount
                  <code className="block mt-1 text-purple-300 bg-black/80 p-2 rounded text-sm">"buy 0.1 SOL worth"</code>
                </div>
                <div>
                  <strong className="text-purple-300">Percentage:</strong> Sell a percentage of holdings
                  <code className="block mt-1 text-purple-300 bg-black/80 p-2 rounded text-sm">"sell 50%" or "sell half"</code>
                </div>
                <div>
                  <strong className="text-purple-300">All:</strong> Sell entire balance
                  <code className="block mt-1 text-purple-300 bg-black/80 p-2 rounded text-sm">"sell all"</code>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="mb-16">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold mb-6 text-purple-300 flex items-center space-x-3"
          >
            <TrendingUp className="w-8 h-8" />
            <span>3. Features</span>
          </motion.h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Code, title: "✨ Natural Language", desc: "Use plain English to create orders. No complex commands or syntax needed." },
              { icon: TrendingUp, title: "📊 Market Cap & Price", desc: "Set triggers based on market cap (in thousands) or token price (in USD)." },
              { icon: Zap, title: "🔄 Auto Execution", desc: "Orders execute automatically when conditions are met. No manual intervention needed." },
              { icon: Bell, title: "📱 Instant Alerts", desc: "Receive Telegram notifications when orders execute with transaction links." },
              { icon: Wallet, title: "💯 Percentage Orders", desc: "Sell percentages of your holdings (e.g., \"sell 50%\", \"sell half\", \"sell all\")." },
              { icon: Shield, title: "🔗 Contract Support", desc: "Use token symbols or contract addresses directly. Works with any Solana token." },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 bg-black/60 border border-purple-500/30 rounded-xl backdrop-blur-md shadow-xl hover:border-purple-400/50 transition-colors"
              >
                <h3 className="text-xl font-semibold mb-3 text-blue-300">{feature.title}</h3>
                <p className="text-gray-300">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Notifications Section */}
        <section id="notifications" className="mb-16">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold mb-6 text-purple-300 flex items-center space-x-3"
          >
            <Bell className="w-8 h-8" />
            <span>4. Notifications</span>
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-6 bg-black/60 border border-purple-500/30 rounded-xl backdrop-blur-md shadow-xl"
          >
            <h3 className="text-xl font-semibold mb-4 text-blue-300">Telegram Alerts</h3>
            <p className="text-gray-300 mb-4">
              When a limit order executes, you'll receive an instant notification via Telegram with:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
              <li>Order type (BUY/SELL) and amount</li>
              <li>Token information</li>
              <li>Trigger that was met</li>
              <li>Transaction hash</li>
              <li>Direct links to Solscan and Explorer</li>
            </ul>
            <div className="space-y-3">
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-300 text-sm">
                  ✅ Success notifications include transaction links for easy verification
                </p>
              </div>
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm">
                  ❌ Failure notifications include error details to help you fix the issue
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* API Section */}
        <section id="api" className="mb-16">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold mb-6 text-purple-300 flex items-center space-x-3"
          >
            <Code className="w-8 h-8" />
            <span>5. API Reference</span>
          </motion.h2>
          
          <div className="space-y-6">
            {[
              {
                title: "Create Limit Order",
                method: "POST",
                endpoint: "/api/limit-orders/create",
                body: `{
  "walletAddress": "user_wallet",
  "tokenAddress": "token_mint_or_symbol",
  "orderType": "buy" | "sell",
  "triggerType": "market_cap" | "price",
  "triggerValue": "50",
  "amount": "0.1" | "50" | "all",
  "amountType": "fixed" | "percentage"
}`
              },
              {
                title: "List Orders",
                method: "GET",
                endpoint: "/api/limit-orders/list?walletAddress=xxx&status=active",
                body: null
              },
              {
                title: "Cancel Order",
                method: "POST",
                endpoint: "/api/limit-orders/cancel",
                body: `{
  "orderId": "order_id",
  "walletAddress": "user_wallet"
}`
              },
            ].map((api, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 bg-black/60 border border-purple-500/30 rounded-xl backdrop-blur-md shadow-xl"
              >
                <h3 className="text-xl font-semibold mb-4 text-blue-300">{api.title}</h3>
                <div className="bg-black/80 p-4 rounded-lg border border-purple-500/20">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      api.method === 'POST' ? 'bg-purple-500/30 text-purple-300' : 'bg-blue-500/30 text-blue-300'
                    }`}>
                      {api.method}
                    </span>
                    <code className="text-purple-300 text-sm">{api.endpoint}</code>
                  </div>
                  {api.body && (
                    <pre className="mt-3 text-gray-300 text-xs overflow-x-auto">
                      {api.body}
                    </pre>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Examples Section */}
        <section id="examples" className="mb-16">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold mb-6 text-purple-300 flex items-center space-x-3"
          >
            <FileText className="w-8 h-8" />
            <span>6. Examples</span>
          </motion.h2>
          
          <div className="space-y-6">
            {[
              {
                title: "Example 1: Buy on Market Cap",
                command: '"if BONK hits 100k mc please buy 0.1 SOL worth"',
                steps: [
                  "Order created: Buy 0.1 SOL worth of BONK",
                  "Trigger: When BONK market cap reaches 100k",
                  "Execution: Automatic when condition is met",
                  "Notification: Sent via Telegram with transaction link"
                ]
              },
              {
                title: "Example 2: Sell Percentage",
                command: '"once WIF hits 200k, sell 50%"',
                steps: [
                  "Order created: Sell 50% of WIF holdings",
                  "Trigger: When WIF market cap reaches 200k",
                  "Execution: Calculates 50% of current balance and sells",
                  "Notification: Sent when order executes"
                ]
              },
              {
                title: "Example 3: Price-Based Order",
                command: '"sell all when price hits 0.001"',
                steps: [
                  "Order created: Sell 100% of token holdings",
                  "Trigger: When token price reaches $0.001",
                  "Execution: Sells entire balance when price target is met",
                  "Notification: Sent with transaction details"
                ]
              },
            ].map((example, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 bg-black/60 border border-purple-500/30 rounded-xl backdrop-blur-md shadow-xl"
              >
                <h3 className="text-xl font-semibold mb-4 text-blue-300">{example.title}</h3>
                <div className="bg-black/80 p-4 rounded-lg border border-purple-500/20">
                  <p className="text-gray-400 text-sm mb-2">Command:</p>
                  <code className="text-purple-300 block mb-4 text-sm">{example.command}</code>
                  <p className="text-gray-400 text-sm mb-2">What happens:</p>
                  <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside ml-4">
                    {example.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 pt-8 border-t border-purple-500/20 text-center"
        >
          <p className="text-gray-400 mb-4">
            Need help? Check out our <Link href="https://github.com/freemell/Eunoia" className="text-purple-400 hover:text-purple-300 transition-colors">GitHub repository</Link>
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Eunoia</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
