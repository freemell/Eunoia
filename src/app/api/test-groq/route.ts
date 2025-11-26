import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function GET() {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'GROQ_API_KEY is not set in environment variables',
        details: 'Please add GROQ_API_KEY to your .env file'
      }, { status: 500 });
    }

    console.log('🔍 Testing Groq API connection...');
    console.log('🔑 API Key present:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');

    const groq = new Groq({
      apiKey: apiKey,
    });

    // Test with a simple completion
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello, Groq API is working!" in JSON format: {"message": "your response"}' }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      max_tokens: 100,
      stream: false
    });

    const response = completion.choices[0]?.message?.content;
    
    if (response) {
      console.log('✅ Groq API test successful!');
      console.log('📝 Response:', response);
      
      return NextResponse.json({
        success: true,
        message: 'Groq API is working correctly!',
        response: response,
        model: 'llama-3.1-8b-instant',
        usage: completion.usage
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Groq API returned empty response',
        details: 'The API call succeeded but no content was returned'
      }, { status: 500 });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : String(error);
    
    console.error('❌ Groq API test failed:', errorMessage);
    console.error('❌ Error details:', errorStack);
    
    // Check for specific error types
    let errorType = 'Unknown error';
    let details = errorMessage;
    
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      errorType = 'Authentication Error';
      details = 'Invalid API key. Please check your GROQ_API_KEY.';
    } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      errorType = 'Rate Limit Error';
      details = 'Rate limit exceeded. Please try again later.';
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      errorType = 'Network Error';
      details = 'Failed to connect to Groq API. Check your internet connection.';
    } else if (errorMessage.includes('model')) {
      errorType = 'Model Error';
      details = 'Invalid model specified or model not available.';
    }
    
    return NextResponse.json({
      success: false,
      error: errorType,
      details: details,
      fullError: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    }, { status: 500 });
  }
}

