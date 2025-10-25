import { PublicKey } from '@solana/web3.js';

export interface DomainResolutionResult {
  success: boolean;
  address?: string;
  domain?: string;
  error?: string;
}

/**
 * Resolves Solana Name Service (SNS) domains to wallet addresses
 */
export class SolanaDomainResolver {
  private static readonly SNS_PROGRAM_ID = 'namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8Maw59';
  private static readonly SNS_REGISTRY = 'namesB9iWJz5BRfZ71pPf4Jme4mJb43iz7oWufma9';
  
  /**
   * Resolves a .sol domain to a wallet address
   */
  static async resolveDomain(domain: string): Promise<DomainResolutionResult> {
    try {
      // Clean the domain input
      const cleanDomain = domain.toLowerCase().replace(/\.sol$/, '');
      
      if (!cleanDomain || cleanDomain.length === 0) {
        return {
          success: false,
          error: 'Invalid domain format'
        };
      }

      // For now, we'll use a mock resolution since we need to implement
      // the actual SNS resolution logic. In a real implementation,
      // this would query the SNS program on-chain.
      
      // Mock some common domains for demonstration
      const mockDomains: Record<string, string> = {
        'pinkpotato': 'ABugPfgDgdfESWiZBmFxZVb7yZ5jXCiKTTdVE7kcPnK1',
        'merlin': '625zkJbTYhMarRJJZdNRFMjoyfz6Bc58yEfDAdjRLtG7',
        'solana': 'So11111111111111111111111111111111111111112',
        'test': '11111111111111111111111111111111',
        'demo': 'Demo1111111111111111111111111111111111111111',
        'milladevnet': '625zkJbTYhMarRJJZdNRFMjoyfz6Bc58yEfDAdjRLtG7' // Different address for milladevnet
      };

      const address = mockDomains[cleanDomain];
      
      if (address) {
        return {
          success: true,
          address,
          domain: `${cleanDomain}.sol`
        };
      }

      // If not in mock data, return a generic response
      return {
        success: false,
        error: `Domain ${cleanDomain}.sol not found or not registered`
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to resolve domain: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Checks if a string looks like a .sol domain
   */
  static isSolDomain(input: string): boolean {
    const solDomainRegex = /^[a-zA-Z0-9-]+\.sol$/i;
    return solDomainRegex.test(input);
  }

  /**
   * Checks if a string looks like a Solana address
   */
  static isSolanaAddress(input: string): boolean {
    try {
      new PublicKey(input);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Resolves either a domain or address to a final address
   */
  static async resolveToAddress(input: string): Promise<DomainResolutionResult> {
    const trimmedInput = input.trim();
    
    if (this.isSolDomain(trimmedInput)) {
      return await this.resolveDomain(trimmedInput);
    } else if (this.isSolanaAddress(trimmedInput)) {
      return {
        success: true,
        address: trimmedInput,
        domain: undefined
      };
    } else {
      return {
        success: false,
        error: 'Invalid format. Please provide a .sol domain or Solana address'
      };
    }
  }
}

/**
 * Enhanced domain resolution with real SNS integration
 * This would be used in production with actual SNS program calls
 */
export class EnhancedDomainResolver extends SolanaDomainResolver {
  /**
   * Resolves domain using actual SNS program (placeholder for real implementation)
   */
  static async resolveDomainReal(domain: string): Promise<DomainResolutionResult> {
    // This would implement the actual SNS resolution logic:
    // 1. Query the SNS program for the domain
    // 2. Get the associated account
    // 3. Return the resolved address
    
    // For now, fall back to the mock implementation
    return super.resolveDomain(domain);
  }
}
