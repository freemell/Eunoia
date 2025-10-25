import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Enhanced system prompt for natural language processing
const SYSTEM_PROMPT = `You are Merlin, a Solana blockchain AI assistant. You help users with blockchain operations through natural conversation.

Your capabilities:
- Send SOL and tokens
- Check balances
- Bridge tokens between chains
- Swap tokens
- Stake SOL
- View transaction history
- Resolve .sol domains

Parse user queries into structured actions. Available actions:
- connect: Connect wallet
- send: Send SOL or tokens (requires amount, token, to address or domain)
- balance: Check SOL balance
- swap: Swap tokens (requires fromToken, toToken, amount)
- bridge: Bridge tokens between chains (requires fromChain, toChain, token, amount, toAddress)
- stake: Stake SOL (requires amount)
- tx: View transaction history

IMPORTANT: Users can provide .sol domains (like pinkpotato.sol) instead of wallet addresses. 
When you see a .sol domain, include it in the params as "domain" and the system will resolve it to an address.

Always respond in this JSON format:
{
  "action": "action_name",
  "params": {"param1": "value1", "param2": "value2"},
  "response": "Natural language response to user"
}

For high-risk actions like sending tokens or bridging, always ask for confirmation.
If the query is not blockchain-related, respond normally but set action to "chat".
If unclear, ask for clarification.`;

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('🤖 Processing message with Groq:', message);

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
          success: false
        });
      }
    } catch (groqError: unknown) {
      console.error('❌ Groq API error:', groqError instanceof Error ? groqError.message : 'Unknown error', groqError);
      // Fallback response if Groq API fails
      return NextResponse.json({
        action: "chat",
        params: {},
        response: "Sorry, I'm having trouble connecting to my AI brain. Please try again later.",
        success: false
      });
    }

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message', success: false },
      { status: 500 }
    );
  }
}
