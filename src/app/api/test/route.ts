import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'API is working!',
    openaiKey: process.env.OPENAI_API_KEY ? 'Present' : 'Missing',
    timestamp: new Date().toISOString()
  });
}

