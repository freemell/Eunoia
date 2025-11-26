import { NextResponse } from 'next/server';
import { SolanaDomainResolver } from '@/lib/domain-resolver';

export async function POST(req: Request) {
  try {
    const { domain } = await req.json();

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    // Resolve the domain
    const result = await SolanaDomainResolver.resolveDomain(domain);

    if (result.success) {
      return NextResponse.json({
        success: true,
        address: result.address,
        domain: result.domain,
        message: `Successfully resolved ${domain} to ${result.address}`
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        message: `Failed to resolve domain ${domain}`
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Domain resolution error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error during domain resolution',
        message: 'Failed to resolve domain'
      },
      { status: 500 }
    );
  }
}
