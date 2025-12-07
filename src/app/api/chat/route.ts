import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = process.env.GROQ_API_KEY 
  ? new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })
  : null;

// Enhanced system prompt for natural language processing
const SYSTEM_PROMPT = `You are Eunoia, an AI-powered Solana blockchain assistant with Kalshi prediction market integration. You help users with blockchain operations and prediction market trading through natural conversation.

Your capabilities:
- Send SOL and tokens
- Check balances
- Bridge tokens between chains
- Swap tokens (including buying tokens with SOL)
- Stake SOL
- View transaction history
- Resolve .sol domains
- Create limit orders (buy/sell when price or market cap reaches a target)
- Kalshi prediction market operations (search markets, place bets, check positions, view odds)

Parse user queries into structured actions. Available actions:
- connect: Connect wallet
- send: Send SOL or tokens (requires amount, token, to address or domain)
- balance: Check SOL balance
- swap: Swap tokens (requires fromToken, toToken, amount)
- bridge: Bridge tokens between chains (requires fromChain, toChain, token, amount, toAddress)
- stake: Stake SOL (requires amount)
- tx: View transaction history
- limit_order: Create a limit order (requires tokenAddress, orderType, triggerType, triggerValue, amount)
- kalshi_query: Search or query Kalshi markets (requires query or event)
- kalshi_bet: Place a bet on Kalshi (requires event, side: "yes" or "no", amount)
- kalshi_positions: Check user's Kalshi positions
- kalshi_redeem: Redeem winnings from settled markets (requires event or ticker)
- kalshi_limit: Create a limit order on Kalshi (requires event, condition, side, amount)

LIMIT ORDER INTERPRETATIONS (CRITICAL):
- "if this coin hits 50k mc please buy" → limit_order with orderType: "buy", triggerType: "market_cap", triggerValue: "50", amount: "all" or default amount
- "once it hits 100k, sell 50%" → limit_order with orderType: "sell", triggerType: "market_cap", triggerValue: "100", amount: "50", amountType: "percentage"
- "when [token] reaches 1M market cap, buy 0.5 SOL worth" → limit_order with orderType: "buy", triggerType: "market_cap", triggerValue: "1000", amount: "0.5"
- "sell half when price hits 0.001" → limit_order with orderType: "sell", triggerType: "price", triggerValue: "0.001", amount: "50", amountType: "percentage"
- "when DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263 hits 100k mc, buy 0.1 SOL" → limit_order with tokenAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", orderType: "buy", triggerType: "market_cap", triggerValue: "100", amount: "0.1"
- "if contract address EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v reaches 0.99 price, sell all" → limit_order with tokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", orderType: "sell", triggerType: "price", triggerValue: "0.99", amount: "all"
- Users can provide tokens by: symbol (e.g., "BONK", "WIF"), name, OR contract address (mint address)
- Contract addresses are long strings of letters/numbers (typically 32-44 characters)
- Market cap values are in thousands (50k = "50", 100k = "100", 1M = "1000")
- Price values are in USD (0.001 = "0.001")
- Amount can be: fixed amount (e.g., "0.1"), percentage (e.g., "50" with amountType: "percentage"), or "all" for 100%

IMPORTANT LANGUAGE INTERPRETATIONS:
- "buy [token_address]" means swap SOL for that token (action: swap, fromToken: SOL, toToken: [token_address])
- "sell [token_address]" means swap that token for SOL (action: swap, fromToken: [token_address], toToken: SOL)
- When a user says "buy 0.1 sol of [token_address]", interpret as: swap 0.1 SOL for [token_address]
- Tokens are identified by their mint address (usually starts with letters/numbers and is long)

IMPORTANT: Users can provide .sol domains (like pinkpotato.sol) instead of wallet addresses. 
When you see a .sol domain, include it in the params as "domain" and the system will resolve it to an address.

Always respond in this JSON format:
{
  "action": "action_name",
  "params": {"param1": "value1", "param2": "value2"},
  "response": "Natural language response to user"
}

For limit orders, include:
- tokenAddress: The token mint address (contract address) - REQUIRED. Can be provided as:
  * Contract address directly (e.g., "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263")
  * Token symbol that you'll resolve to contract address (e.g., "BONK" → "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263")
  * If user says "this coin" or "it", try to infer from context or ask for clarification
- tokenSymbol: Optional token symbol if mentioned (helps with display)
- orderType: "buy" or "sell"
- triggerType: "market_cap" or "price"
- triggerValue: The target value (market cap in thousands, price in USD)
- amount: Amount to buy/sell (can be number, percentage like "50", or "all")
- amountType: "fixed" or "percentage" (default "fixed")

KALSHI OPERATIONS:
- kalshi_query: Search markets by event description. Example: "Show odds on inflation above 3%" → {"action": "kalshi_query", "params": {"query": "inflation above 3%"}}
  **CRITICAL**: For kalshi_query actions, your response should ONLY acknowledge the query briefly (e.g., "Searching Kalshi markets..." or "Let me find those markets for you."). DO NOT list or make up market data - the system will fetch and display real market data from the Kalshi API automatically.
- kalshi_bet: Place a bet. Example: "Bet 0.05 SOL yes on rain in NYC tomorrow" → {"action": "kalshi_bet", "params": {"event": "rain in NYC tomorrow", "side": "yes", "amount": 0.05, "amount_token": "SOL"}}
- kalshi_positions: Check positions. Example: "Check my Kalshi positions" → {"action": "kalshi_positions", "params": {}}
- kalshi_redeem: Redeem winnings. Example: "Redeem winnings from election market" → {"action": "kalshi_redeem", "params": {"event": "election market"}}
- kalshi_limit: Create limit order. Example: "If yes price on event X below 0.50, buy 0.1 SOL" → {"action": "kalshi_limit", "params": {"event": "X", "condition": "yes_price < 0.50", "side": "buy_yes", "amount": 0.1, "amount_token": "SOL"}}

For Kalshi bets, amounts can be in SOL (will be converted to USD/USDC equivalent) or USD directly.
For Kalshi operations, use the event description or ticker if provided. If user mentions a specific market, try to extract the ticker or search for it.
**IMPORTANT**: Never generate fake or example market data. Always let the API fetch real data.

For high-risk actions like sending tokens, bridging, or placing bets, always ask for confirmation.
If the query is not blockchain or prediction market-related, respond normally but set action to "chat".
If unclear, ask for clarification.`;

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('🤖 Processing message with Groq:', message);

    if (!groq) {
      return NextResponse.json({
        action: "chat",
        params: {},
        response: "Groq API is not configured. Please set GROQ_API_KEY environment variable.",
        error: "GROQ_API_KEY not set",
        success: false
      }, { status: 500 });
    }

    try {
      // Use Groq for natural language processing
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message }
        ],
        model: 'llama-3.1-8b-instant', // Updated model
        temperature: 0.1,
        max_tokens: 1000,
        stream: false
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (aiResponse) {
        console.log('🤖 Groq response:', aiResponse);
        try {
          const parsed = JSON.parse(aiResponse);
          return NextResponse.json({
            action: parsed.action || "chat",
            params: parsed.params || {},
            response: parsed.response || aiResponse,
            success: true
          });
        } catch (parseError) {
          console.error('❌ Groq response JSON parsing failed, using raw response:', parseError);
          return NextResponse.json({
            action: "chat",
            params: {},
            response: aiResponse,
            success: true
          });
        }
      } else {
        console.warn('⚠️ Groq returned no content.');
        return NextResponse.json({
          action: "chat",
          params: {},
          response: "Sorry, I couldn't generate a response at this time.",
          error: "Empty response from Groq API",
          success: false
        });
      }
    } catch (groqError: unknown) {
      const errorMessage = groqError instanceof Error ? groqError.message : 'Unknown error';
      const errorDetails = groqError instanceof Error ? groqError.stack : String(groqError);
      console.error('❌ Groq API error:', errorMessage);
      console.error('❌ Groq API error details:', errorDetails);
      
      // Check for specific error types
      let userMessage = "Sorry, I'm having trouble connecting to my AI brain. Please try again later.";
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        userMessage = "Groq API authentication failed. Please check your GROQ_API_KEY environment variable.";
      } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        userMessage = "Rate limit exceeded. Please try again in a moment.";
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userMessage = "Network error connecting to Groq API. Please check your internet connection.";
      }
      
      // Fallback response if Groq API fails
      return NextResponse.json({
        action: "chat",
        params: {},
        response: userMessage,
        error: errorMessage,
        success: false
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Chat API error:', errorMessage, error);
    return NextResponse.json(
      { 
        error: errorMessage,
        response: 'Failed to process message. Please try again.',
        success: false 
      },
      { status: 500 }
    );
  }
}
