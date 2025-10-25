import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    deepseekKey: process.env.DEEPSEEK_API_KEY ? 'Present' : 'Missing',
    deepseekKeyLength: process.env.DEEPSEEK_API_KEY?.length || 0,
    solanaRpc: process.env.SOLANA_RPC_URL || 'Missing',
    nodeEnv: process.env.NODE_ENV,
    allEnvVars: Object.keys(process.env).filter(key => key.includes('DEEPSEEK') || key.includes('SOLANA'))
  });
}
