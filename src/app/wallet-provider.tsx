'use client';

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { 
  SolflareWalletAdapter, 
  CoinbaseWalletAdapter,
  NightlyWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { useMemo, useCallback, useState, createContext, useContext } from 'react';
import { WalletError } from '@solana/wallet-adapter-base';

// Create context for wallet error state
interface WalletErrorContextType {
  errorMessage: string | null;
  setErrorMessage: (message: string | null) => void;
  clearError: () => void;
}

const WalletErrorContext = createContext<WalletErrorContextType | null>(null);

export const useWalletError = () => {
  const context = useContext(WalletErrorContext);
  if (!context) {
    throw new Error('useWalletError must be used within MerlinWalletProvider');
  }
  return context;
};

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

export function MerlinWalletProvider({ children }: { children: React.ReactNode }) {
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);
  
  const wallets = useMemo(
    () => {
      console.log('🔧 Initializing wallet adapters...');
      
      const walletAdapters = [
        // Only include wallets that don't auto-detect via Wallet Standard
        new SolflareWalletAdapter(),
        new CoinbaseWalletAdapter(),
        new NightlyWalletAdapter(),
      ];

      console.log('📱 Available wallet adapters:', walletAdapters.length);

      // Filter out wallets that aren't available and log their status
      const availableWallets = walletAdapters.filter(adapter => {
        try {
          const readyState = adapter.readyState;
          const isSupported = readyState !== 'Unsupported';
          
          // Only log if wallet is ready for connection (reduce console noise)
          if (readyState === 'Installed' || readyState === 'Loadable') {
            console.log(`✅ ${adapter.name}: Ready for connection`);
          }
          
          return isSupported;
        } catch {
          console.log(`⚠️ ${adapter.name}: Error checking status - including anyway`);
          return true; // Include if we can't determine availability
        }
      });

      console.log(`✅ Final wallet count: ${availableWallets.length} adapters`);
      return availableWallets;
    },
    []
  );

  // Deep debugging error handler with comprehensive error analysis
  const handleWalletError = useCallback((error: WalletError) => {
    // Deep error logging with all possible error properties
    console.error('🔴 DEEP WALLET ERROR ANALYSIS:', {
      // Primary error properties
      code: (error as { code?: string }).code,
      message: error.message,
      name: error.name,
      stack: error.stack,
      
      // Additional error properties that might exist
      cause: (error as { cause?: unknown }).cause,
      reason: (error as { reason?: string }).reason,
      details: (error as { details?: unknown }).details,
      
      // Nested error object
      error: (error as { error?: unknown }).error,
      
      // Timestamp for debugging
      timestamp: new Date().toISOString(),
      
      // Environment info
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    // Deep dive into nested error if it exists
    if (error.error) {
      console.error('🔍 NESTED ERROR ANALYSIS:', {
        message: error.error.message,
        name: error.error.name,
        stack: error.error.stack,
        cause: error.error.cause,
        reason: error.error.reason,
        details: error.error.details,
        code: error.error.code,
        type: typeof error.error,
        constructor: error.error.constructor?.name
      });
    }
    
    // Check for common error patterns and provide specific solutions
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = (error as { code?: string }).code || '';
    
    // Detect stale permissions (most common cause of "Unexpected error")
    const isStalePermissions = !errorMessage || 
                              errorMessage === 'unexpected error' || 
                              errorMessage === '' ||
                              (error as { code?: number }).code === -32603 ||
                              (error as {data?: {code?: number}})?.data?.code === -32603;
    
    if (isStalePermissions) {
      console.error('❌ STALE PERMISSIONS DETECTED - This is the most common cause of "Unexpected error"');
      console.error('   🔧 IMMEDIATE FIX REQUIRED:');
      console.error('   1. Open your wallet (Phantom/Solflare)');
      console.error('   2. Go to Settings > Trusted Apps/Connected Apps');
      console.error('   3. Find this site and revoke access');
      console.error('   4. Refresh this page');
      console.error('   5. Try connecting again');
      
      // Set UI error message for user guidance
      setErrorMessage('Connection failed due to stale permissions. Please revoke site access in your wallet settings and try again.');
    } else if (errorMessage.includes('user rejected') || errorMessage.includes('user cancelled')) {
      console.warn('⚠️ USER REJECTED: Connection was cancelled by user');
      setErrorMessage('Connection was cancelled. Please try again.');
    } else if (errorMessage.includes('wallet not found') || errorMessage.includes('not installed')) {
      console.error('❌ WALLET NOT INSTALLED: Please install a Solana wallet (Phantom, Solflare, or Backpack)');
      setErrorMessage('Wallet not installed. Please install Phantom, Solflare, or Backpack wallet.');
    } else if (errorMessage.includes('wallet not ready') || errorMessage.includes('locked')) {
      console.error('❌ WALLET LOCKED: Please unlock your wallet and try again');
      setErrorMessage('Wallet is locked. Please unlock your wallet and try again.');
    } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      console.error('❌ CONNECTION TIMEOUT: Please try again - network may be slow');
      setErrorMessage('Connection timeout. Please try again.');
    } else if (errorMessage.includes('blocked') || errorMessage.includes('popup')) {
      console.error('❌ POPUP BLOCKED: Please allow popups for this site in your browser settings');
      setErrorMessage('Connection blocked. Please allow popups for this site.');
    } else {
      console.error('❌ UNKNOWN ERROR PATTERN');
      setErrorMessage(`Connection failed: ${errorMessage || 'Unknown error'}`);
    }
    
    // Enhanced error handling with specific troubleshooting steps
    switch (errorCode) {
      case 'WalletNotFound':
        console.error('❌ WALLET NOT FOUND: Please install Phantom, Solflare, or Backpack wallet');
        break;
      case 'WalletNotReady':
        console.error('❌ WALLET NOT READY: Please unlock your wallet and try again');
        break;
      case 'WalletNotConnected':
        console.warn('⚠️ WALLET NOT CONNECTED: Connection was interrupted');
        break;
      case 'WalletConnectionError':
        console.error('❌ CONNECTION FAILED - STALE PERMISSIONS DETECTED:');
        console.error('   🔧 IMMEDIATE FIX:');
        console.error('   1. Open your wallet (Phantom/Solflare)');
        console.error('   2. Go to Settings > Trusted Apps/Connected Apps');
        console.error('   3. Find this site and revoke access');
        console.error('   4. Refresh this page and try connecting again');
        break;
      case 'WalletDisconnected':
        console.log('ℹ️ WALLET DISCONNECTED: User disconnected wallet');
        break;
      case 'WalletDisconnectedThisSession':
        console.log('ℹ️ WALLET DISCONNECTED THIS SESSION: Connection lost');
        break;
      case 'WalletAccountNotFound':
        console.error('❌ ACCOUNT NOT FOUND: Please check your wallet has accounts');
        break;
      case 'WalletAccountError':
        console.error('❌ ACCOUNT ERROR: Wallet account issue detected');
        break;
      case 'WalletNotSelected':
        console.warn('⚠️ NO WALLET SELECTED: Please select a wallet first');
        break;
      case 'WalletSignTransactionError':
        console.error('❌ SIGN TRANSACTION ERROR: Transaction signing failed');
        break;
      case 'WalletSignMessageError':
        console.error('❌ SIGN MESSAGE ERROR: Message signing failed');
        break;
      case 'WalletSignAndSendTransactionError':
        console.error('❌ SIGN AND SEND ERROR: Transaction failed');
        break;
      case 'WalletWindowClosed':
        console.warn('⚠️ WINDOW CLOSED: User closed wallet window');
        break;
      case 'WalletWindowBlocked':
        console.error('❌ WINDOW BLOCKED: Please allow popups for this site');
        break;
      case 'WalletWindowUnload':
        console.warn('⚠️ WINDOW UNLOAD: Wallet window was closed unexpectedly');
        break;
      case 'WalletSendTransactionError':
        console.error('❌ SEND TRANSACTION ERROR: Transaction failed to send');
        break;
      case 'WalletTimeoutError':
        console.error('❌ TIMEOUT ERROR: Connection timed out - please try again');
        break;
      default:
        console.error('❌ UNKNOWN ERROR PATTERN:', {
          code: errorCode,
          message: errorMessage,
          fullError: error,
          suggestion: 'This appears to be a new error pattern. Please try:',
          steps: [
            '1. Revoke site access in wallet settings',
            '2. Refresh the page',
            '3. Try a different wallet',
            '4. Check browser console for more details'
          ]
        });
    }
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={false} 
        onError={handleWalletError}
        localStorageKey="merlin-wallet"
      >
        <WalletModalProvider>
          <WalletErrorContext.Provider value={{ errorMessage, setErrorMessage, clearError }}>
            {children}
            {/* Wallet Error UI Component */}
            {errorMessage && (
              <div className="fixed top-4 right-4 z-50 max-w-md">
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 backdrop-blur-sm">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">⚠️</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-red-300 mb-2">
                        Wallet Connection Error
                      </h3>
                      <p className="text-xs text-red-200 mb-3">
                        {errorMessage}
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={clearError}
                          className="text-xs bg-red-500/30 hover:bg-red-500/40 text-red-200 px-3 py-1 rounded transition-colors"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => {
                            clearError();
                            window.location.reload();
                          }}
                          className="text-xs bg-blue-500/30 hover:bg-blue-500/40 text-blue-200 px-3 py-1 rounded transition-colors"
                        >
                          Refresh & Retry
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </WalletErrorContext.Provider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
