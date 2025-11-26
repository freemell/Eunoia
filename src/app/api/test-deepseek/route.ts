import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY || 'sk-30f4eefa997c40d6906c004174b17b2f';
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'user', content: 'Hello, test message' },
        ],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        status: response.status,
        error: errorText,
        apiKey: apiKey.substring(0, 10) + '...'
      });
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      response: data.choices[0].message.content,
      apiKey: apiKey.substring(0, 10) + '...'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

