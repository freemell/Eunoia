"use client";

import { useEffect, useRef, useCallback, useTransition, useMemo } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    Wallet,
    Coins,
    TrendingUp,
    Shield,
    SendIcon,
    Zap,
    Database,
    FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Waves } from "@/components/ui/waves-background";
import * as React from "react"
import Image from "next/image";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletError } from '@/app/wallet-provider';
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey, VersionedTransaction } from '@solana/web3.js';
import dynamic from 'next/dynamic';

const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);


interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            const newHeight = Math.min(
                Math.max(textarea.scrollHeight, minHeight),
                maxHeight || Infinity
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        adjustHeight();
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

interface CommandSuggestion {
    icon: React.ReactNode;
    label: string;
    description: string;
    prefix: string;
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  showRing?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = false, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className={cn(
        "relative",
        containerClassName
      )}>
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showRing ? "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0" : "",
            className
          )}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {showRing && isFocused && (
          <motion.span 
            className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-offset-0 ring-violet-500/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}

        {props.onChange && (
          <div 
            className="absolute bottom-2 right-2 opacity-0 w-2 h-2 bg-violet-500 rounded-full"
            style={{
              animation: 'none',
            }}
            id="textarea-ripple"
          />
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

function TypingDots() {
    return (
        <div className="flex items-center ml-1">
            {[1, 2, 3].map((dot) => (
                <motion.div
                    key={dot}
                    className="w-1.5 h-1.5 bg-white/90 rounded-full mx-0.5"
                    initial={{ opacity: 0.3 }}
                    animate={{ 
                        opacity: [0.3, 0.9, 0.3],
                        scale: [0.85, 1.1, 0.85]
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: dot * 0.2,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    );
}

export function AnimatedAIChat() {
    const [value, setValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [, ] = useTransition();
    const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
    const [chatStarted, setChatStarted] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
    const [balance, setBalance] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pendingAction, setPendingAction] = useState<{type: string, params: {amount: string | number, to?: string, domain?: string, fromChain?: string, toChain?: string, token?: string, toAddress?: string, fromToken?: string, toToken?: string}} | null>(null);
    const [showApproval, setShowApproval] = useState(false);
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });

    // Auto-scroll chat container
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const [, setInputFocused] = useState(false);
    const commandPaletteRef = useRef<HTMLDivElement>(null);
    
    // Wallet integration with enhanced error handling
    const { publicKey, connected, connect, sendTransaction, wallet, connecting } = useWallet();
    const { connection } = useConnection();
    const { clearError } = useWalletError();
    
    // Add wallet connection error state
    const [walletError, setWalletError] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    
    // Detect mobile device and wallet availability
    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || (window as {opera?: string}).opera;
            return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent || '');
        };
        setIsMobile(checkMobile());
        
        // Check for mobile wallet availability
        const checkMobileWallets = () => {
            const hasPhantom = !!(window as {solana?: {isPhantom?: boolean}}).solana?.isPhantom;
            const hasSolflare = !!(window as {solflare?: {isSolflare?: boolean}}).solflare?.isSolflare;
            const hasBackpack = !!(window as {backpack?: {isBackpack?: boolean}}).backpack?.isBackpack;
            
            // Only log if mobile and no wallets detected (reduce console noise)
            if (isMobile && !hasPhantom && !hasSolflare && !hasBackpack) {
                console.log('📱 No mobile wallets detected, may need deep linking');
            }
        };
        
        // Check after a short delay to allow wallets to load
        const timeoutId = setTimeout(checkMobileWallets, 1000);
        return () => clearTimeout(timeoutId);
    }, [isMobile]);
    
    // Mobile deep linking support
    const handleMobileWalletConnect = useCallback((walletName: string) => {
        const deepLinks: { [key: string]: string } = {
            'phantom': 'phantom://browse/',
            'solflare': 'solflare://browse/',
            'backpack': 'backpack://browse/',
        };
        
        const deepLink = deepLinks[walletName.toLowerCase()];
        if (deepLink) {
            // Try to open the wallet app
            window.location.href = deepLink;
            
            // Fallback to app store if deep link fails
            setTimeout(() => {
                const appStoreLinks: { [key: string]: string } = {
                    'phantom': 'https://apps.apple.com/app/phantom-solana-wallet/id1598432977',
                    'solflare': 'https://apps.apple.com/app/solflare/id1580902717',
                    'backpack': 'https://apps.apple.com/app/backpack-crypto/id1668960002',
                };
                
                const appStoreLink = appStoreLinks[walletName.toLowerCase()];
                if (appStoreLink) {
                    window.open(appStoreLink, '_blank');
                }
            }, 2000);
        }
    }, []);
    
    // Enhanced wallet connection with comprehensive error handling and troubleshooting
    const handleConnect = useCallback(async () => {
        console.log('🔗 ATTEMPTING WALLET CONNECTION...', {
            wallet: wallet?.adapter?.name,
            walletReadyState: wallet?.adapter?.readyState,
            isMobile,
            hasWallet: !!(window as {solana?: {isPhantom?: boolean}}).solana?.isPhantom || !!(window as {solflare?: {isSolflare?: boolean}}).solflare?.isSolflare,
            connecting: connecting
        });

        if (!wallet) {
            const errorMsg = 'No wallet selected. Please select a wallet first.';
            console.warn('⚠️', errorMsg);
            setWalletError(errorMsg);
            return;
        }

        // Check wallet readiness before attempting connection
        const readyState = wallet.adapter.readyState;
        console.log(`🔍 Wallet readiness check: ${wallet.adapter.name} is ${readyState}`);
        
        if (readyState === 'Unsupported') {
            const errorMsg = 'This wallet is not supported. Please try a different wallet.';
            console.error('❌', errorMsg);
            setWalletError(errorMsg);
            return;
        }
        
        if (readyState === 'NotDetected') {
            const errorMsg = 'Wallet not detected. Please ensure the wallet is installed and unlocked.';
            console.error('❌', errorMsg);
            setWalletError(errorMsg);
            return;
        }
        
        // On mobile, try deep linking first if no wallet is detected
        if (isMobile) {
            const walletName = wallet.adapter.name.toLowerCase();
            const hasWallet = !!(window as {solana?: {isPhantom?: boolean}}).solana?.isPhantom || 
                             !!(window as {solflare?: {isSolflare?: boolean}}).solflare?.isSolflare || 
                             !!(window as {backpack?: {isBackpack?: boolean}}).backpack?.isBackpack;
            
            if (!hasWallet) {
                console.log('📱 No mobile wallet detected, attempting deep link for:', walletName);
                handleMobileWalletConnect(walletName);
                setWalletError('Opening wallet app... If it doesn\'t open, please install the wallet first.');
                setTimeout(() => setWalletError(null), 5000);
                return;
            }
        }
        
        try {
            console.log('🔄 Starting connection process...');
            setWalletError(null);
            clearError(); // Clear any previous error state
            
            // Add a small delay to ensure wallet is ready
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Double-check wallet is still ready
            if (wallet.adapter.readyState === 'Unsupported') {
                throw new Error('Wallet became unsupported during connection');
            }
            
            await connect();
            console.log('✅ Wallet connected successfully!');
        } catch (error: unknown) {
            console.error('❌ DEEP CONNECTION ERROR ANALYSIS:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                name: error instanceof Error ? error.name : 'Unknown',
                code: (error as { code?: string }).code,
                stack: error instanceof Error ? error.stack : undefined,
                wallet: wallet?.adapter?.name,
                readyState: wallet?.adapter?.readyState,
                cause: (error as { cause?: unknown }).cause,
                reason: (error as { reason?: string }).reason
            });
            
            // Enhanced error handling with specific troubleshooting steps
            let errorMessage = 'Connection failed. Please try again.';
            let troubleshootingSteps = '';
            
            if (error instanceof Error) {
                if (error.message?.includes('User rejected') || error.message?.includes('User cancelled')) {
                    errorMessage = 'Connection cancelled by user.';
                } else if (error.message?.includes('Wallet not found') || error.message?.includes('not installed')) {
                    if (isMobile) {
                        errorMessage = 'Wallet not installed. Please install the wallet app and try again.';
                    } else {
                        errorMessage = 'Wallet not installed. Please install Phantom, Solflare, or Backpack wallet.';
                    }
                } else if (error.message?.includes('Wallet not ready') || error.message?.includes('locked')) {
                    errorMessage = 'Wallet not ready. Please unlock your wallet and try again.';
                } else if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
                    errorMessage = 'Connection timeout. Please try again.';
                } else if (error.message?.includes('blocked') || error.message?.includes('popup')) {
                    errorMessage = 'Connection blocked. Please allow popups and try again.';
                } else if (error.message?.includes('Unexpected error') || !error.message) {
                    errorMessage = 'Unexpected connection error. This is likely due to stale permissions.';
                    troubleshootingSteps = 'Please go to your wallet settings (Phantom > Settings > Trusted Apps), revoke access for this site, refresh the page, and try connecting again.';
                } else {
                    errorMessage = `Connection failed: ${error.message || 'Unknown error'}`;
                }
            } else {
                errorMessage = 'Connection failed: Unknown error';
            }
            
            console.error('🔧 COMPREHENSIVE TROUBLESHOOTING STEPS:', {
                error: errorMessage,
                steps: troubleshootingSteps || 'Try a different wallet or refresh the page.',
                wallet: wallet?.adapter?.name,
                readyState: wallet?.adapter?.readyState,
                additionalSteps: [
                    '1. Try disconnecting and reconnecting',
                    '2. Try a different wallet',
                    '3. Refresh the page',
                    '4. Check browser console for more details'
                ]
            });
            
            setWalletError(errorMessage + (troubleshootingSteps ? ` ${troubleshootingSteps}` : ''));
            
            // Clear error after 12 seconds to give user time to read
            setTimeout(() => setWalletError(null), 12000);
        }
    }, [wallet, connect, isMobile, handleMobileWalletConnect, connecting, clearError]);
    
    // Handle wallet connection errors from the provider
    useEffect(() => {
        const handleWalletError = (error: unknown) => {
            console.error('Wallet provider error:', error);
            
            // Map error codes to user-friendly messages
            const errorMessages: { [key: string]: string } = {
                'WalletNotFound': 'No wallet detected. Please install Phantom, Solflare, or Backpack wallet.',
                'WalletNotReady': 'Wallet not ready. Please unlock your wallet.',
                'WalletNotConnected': 'Wallet not connected. Please try connecting again.',
                'WalletConnectionError': 'Connection failed. Please try again.',
                'WalletWindowBlocked': 'Connection blocked. Please allow popups and try again.',
                'WalletTimeoutError': 'Connection timeout. Please try again.',
                'WalletNotSelected': 'No wallet selected. Please select a wallet first.',
            };
            
            const errorCode = (error as { code?: string }).code || (error instanceof Error ? error.name : 'Unknown');
            const message = errorMessages[errorCode] || 'Wallet connection failed. Please try again.';
            
            setWalletError(message);
            
            // Clear error after 8 seconds
            setTimeout(() => setWalletError(null), 8000);
        };

        // Listen for wallet errors from the provider
        window.addEventListener('wallet-error', handleWalletError);
        return () => window.removeEventListener('wallet-error', handleWalletError);
    }, []);
    

    useEffect(() => {
        if (connected && publicKey) {
            // Fetch balance on connection
            const fetchBalance = async () => {
                try {
                    // Try main balance endpoint first
                    const balanceResponse = await fetch(`/api/solana/balance?address=${publicKey.toString()}`);
                    
                    if (!balanceResponse.ok) {
                        throw new Error(`HTTP ${balanceResponse.status}: ${balanceResponse.statusText}`);
                    }
                    
                    // Check if response is JSON
                    const contentType = balanceResponse.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                        throw new Error('Response is not JSON');
                    }
                    
                    const balanceData = await balanceResponse.json();
                    if (balanceData.success) {
                        setBalance(balanceData.balance);
                    } else {
                        throw new Error(balanceData.error || 'Failed to fetch balance');
                    }
                } catch (error) {
                    console.error("Main balance endpoint failed:", error);
                    
                    // Try fallback endpoint
                    try {
                        console.log("Trying fallback balance endpoint...");
                        const fallbackResponse = await fetch(`/api/solana/balance-fallback?address=${publicKey.toString()}`);
                        const fallbackData = await fallbackResponse.json();
                        
                        if (fallbackData.success) {
                            setBalance(fallbackData.balance);
                            console.log("Using fallback balance:", fallbackData.balance);
                        } else {
                            throw new Error('Fallback also failed');
                        }
                    } catch (fallbackError) {
                        console.error("Fallback balance endpoint also failed:", fallbackError);
                        setBalance(null);
                    }
                }
            };
            fetchBalance();
        } else {
            setBalance(null);
        }
    }, [connected, publicKey]);

    const commandSuggestions: CommandSuggestion[] = useMemo(() => [
        {
            icon: <Wallet className="w-4 h-4" />,
            label: "Connect Wallet",
            description: "Connect your Solana wallet",
            prefix: "/connect"
        },
        {
            icon: <Coins className="w-4 h-4" />,
            label: "Send SOL",
            description: "Send SOL to another address",
            prefix: "/send"
        },
        {
            icon: <TrendingUp className="w-4 h-4" />,
            label: "Check Balance",
            description: "Check your SOL balance",
            prefix: "/balance"
        },
        {
            icon: <Shield className="w-4 h-4" />,
            label: "Bridge Tokens",
            description: "Bridge tokens between chains (requires bridge wallet)",
            prefix: "/bridge"
        },
        {
            icon: <FileText className="w-4 h-4" />,
            label: "Transaction History",
            description: "View your transaction history",
            prefix: "/history"
        },
        {
            icon: <Zap className="w-4 h-4" />,
            label: "Swap Tokens",
            description: "Swap tokens on Solana",
            prefix: "/swap"
        },
        {
            icon: <Database className="w-4 h-4" />,
            label: "View Transactions",
            description: "View transaction history",
            prefix: "/tx"
        },
    ], []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showCommandPalette) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestion(prev => 
                    prev < commandSuggestions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestion(prev => 
                    prev > 0 ? prev - 1 : commandSuggestions.length - 1
                );
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (activeSuggestion >= 0) {
                    const suggestion = commandSuggestions[activeSuggestion];
                    setValue(prev => prev + suggestion.prefix + " ");
                    setShowCommandPalette(false);
                    setActiveSuggestion(-1);
                }
            } else if (e.key === 'Escape') {
                setShowCommandPalette(false);
                setActiveSuggestion(-1);
            }
        } else if (e.key === '/' && !value.trim()) {
            e.preventDefault();
            setShowCommandPalette(true);
            setActiveSuggestion(0);
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
                handleSendMessage();
            }
        }
    };

    // Bridge execution function
    const executeBridgeTransaction = useCallback(async (transactionData: {fromChain: string, toChain: string, amount: string | number, token: string, toAddress: string}) => {
        try {
            setIsTyping(true);
            
            const response = await fetch('/api/solana/bridge/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bridgeData: transactionData,
                    userWallet: publicKey?.toString(),
                    signature: 'user-signed-transaction' // This would be the actual signature
                })
            });

            const result = await response.json();
            
            if (result.success) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `✅ ${result.message}\n\nBridge Transaction ID: ${result.bridgeTxId}`
                }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `❌ Bridge failed: ${result.error || result.message}`
                }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ Bridge execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            }]);
        } finally {
            setIsTyping(false);
        }
    }, [publicKey]);

    const executeSwapTransaction = useCallback(async (transactionData: {amount: string | number, fromToken: string, toToken: string}) => {
        try {
            setIsTyping(true);
            
            const response = await fetch('/api/solana/swap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromToken: transactionData.fromToken,
                    toToken: transactionData.toToken,
                    amount: transactionData.amount,
                    userWallet: publicKey?.toString()
                })
            });

            const result = await response.json();
            
            if (result.success && result.transaction) {
                // Deserialize the transaction
                const transaction = VersionedTransaction.deserialize(
                    Buffer.from(result.transaction, 'base64')
                );

                // Sign and send the transaction
                const signature = await sendTransaction(transaction, connection);
                
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `✅ Swap transaction sent! Waiting for confirmation...\n\nSignature: ${signature}`
                }]);

                // Wait for confirmation
                await connection.confirmTransaction(signature, 'confirmed');
                
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `✅ Successfully swapped ${transactionData.amount} ${transactionData.fromToken} to ${transactionData.toToken}!\n\nTransaction: ${signature}`
                }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `❌ Swap failed: ${result.error || result.message}`
                }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ Swap execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            }]);
        } finally {
            setIsTyping(false);
        }
    }, [publicKey, sendTransaction, connection]);

    // Make executeBridgeTransaction available globally for onclick
    useEffect(() => {
        (window as {executeBridgeTransaction?: (data: {fromChain: string, toChain: string, amount: string | number, token: string, toAddress: string}) => Promise<void>}).executeBridgeTransaction = executeBridgeTransaction;
        return () => {
            delete (window as {executeBridgeTransaction?: (data: {fromChain: string, toChain: string, amount: string | number, token: string, toAddress: string}) => Promise<void>}).executeBridgeTransaction;
        };
    }, [publicKey, executeBridgeTransaction]);

    // Processing functions with approval phase
    const handleSendSOLWithProcessing = async (params: {amount: string | number, to: string, domain?: string}) => {
        setIsProcessing(true);
        setPendingAction({ type: 'send', params });
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setIsProcessing(false);
        setShowApproval(true);
    };

    const handleBridgeTransactionWithProcessing = async (params: {amount: string | number, fromChain: string, toChain: string, token: string, toAddress: string}) => {
        setIsProcessing(true);
        setPendingAction({ type: 'bridge', params });
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setIsProcessing(false);
        setShowApproval(true);
    };

    const handleSwapWithProcessing = async (params: {amount: string | number, fromToken: string, toToken: string}) => {
        setIsProcessing(true);
        setPendingAction({ type: 'swap', params });
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setIsProcessing(false);
        setShowApproval(true);
    };

    const handleApproval = async () => {
        if (!pendingAction) return;
        
        setShowApproval(false);
        
        if (pendingAction.type === 'send') {
            if (pendingAction.params.to) {
                await handleSendSOL(pendingAction.params as {amount: string | number, to: string, domain?: string});
            } else {
                console.error('Missing required parameter: to');
                return;
            }
        } else if (pendingAction.type === 'bridge') {
            if (pendingAction.params.fromChain && pendingAction.params.toChain && pendingAction.params.token && pendingAction.params.toAddress) {
                await executeBridgeTransaction(pendingAction.params as {fromChain: string, toChain: string, amount: string | number, token: string, toAddress: string});
            } else {
                console.error('Missing required bridge parameters');
                return;
            }
        } else if (pendingAction.type === 'swap') {
            if (pendingAction.params.fromToken && pendingAction.params.toToken) {
                await executeSwapTransaction(pendingAction.params as {amount: string | number, fromToken: string, toToken: string});
            } else {
                console.error('Missing required swap parameters');
                return;
            }
        }
        
        setPendingAction(null);
    };

    const handleCancelApproval = () => {
        setShowApproval(false);
        setPendingAction(null);
    };

    // Handle SOL sending
    const handleSendSOL = async (params: {amount: string | number, to: string, domain?: string}) => {
        if (!publicKey || !connected) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Please connect your wallet first to send SOL.'
            }]);
            return;
        }

        try {
            setIsTyping(true);
            
            // Resolve domain if needed
            let recipientAddress = params.to;
            if (params.domain) {
                const domainResponse = await fetch(`/api/solana/resolve-domain?domain=${params.domain}`);
                const domainData = await domainResponse.json();
                if (domainData.success) {
                    recipientAddress = domainData.address;
                } else {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: `❌ Failed to resolve domain ${params.domain}. Please check the domain and try again.`
                    }]);
                    return;
                }
            }

            // Check if sending to own wallet
            if (recipientAddress === publicKey.toString()) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: '❌ Cannot send SOL to your own wallet. Please provide a different recipient address.'
                }]);
                return;
            }

            // Get current balance
            const balanceResponse = await fetch(`/api/solana/balance?address=${publicKey.toString()}`);
            const balanceData = await balanceResponse.json();
            
            if (!balanceData.success) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: '❌ Failed to fetch your balance. Please try again.'
                }]);
                return;
            }

            const currentBalance = balanceData.balance;
            let amount = params.amount;

            // Handle special amount cases
            if (amount === 'all') {
                amount = Math.max(0, currentBalance - 0.01); // Leave 0.01 SOL for fees
            } else if (amount === 'half') {
                amount = currentBalance / 2;
            } else if (amount === 'quarter') {
                amount = currentBalance / 4;
            } else if (amount === 'third') {
                amount = currentBalance / 3;
            }

            // Check if user has enough balance
            if (amount > currentBalance) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `❌ Insufficient balance. You have ${currentBalance.toFixed(4)} SOL but trying to send ${amount} SOL.`
                }]);
                return;
            }

            // Get recent blockhash
            const blockhashResponse = await fetch('/api/solana/blockhash');
            const blockhashData = await blockhashResponse.json();
            
            if (!blockhashData.success) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: '❌ Failed to get recent blockhash. Please try again.'
                }]);
                return;
            }

            const blockhash = blockhashData.blockhash;
            const lamports = Math.floor(Number(amount) * LAMPORTS_PER_SOL);

            // Create transaction
            const transaction = new Transaction({
                recentBlockhash: blockhash,
                feePayer: publicKey,
            });

            transaction.add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: new PublicKey(recipientAddress),
                    lamports: lamports,
                })
            );

            // Send transaction
            const signature = await sendTransaction(transaction, connection);
            
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `✅ Transaction sent! <a href="https://solscan.io/tx/${signature}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">Check tx</a>`
            }]);

            // Update balance
            const newBalanceResponse = await fetch(`/api/solana/balance?address=${publicKey.toString()}`);
            const newBalanceData = await newBalanceResponse.json();
            if (newBalanceData.success) {
                setBalance(newBalanceData.balance);
            }

        } catch (error: unknown) {
            console.error('Send transaction error:', error);
            let errorMessage = 'Transaction failed';

            if (error instanceof Error) {
                if (error.message.includes('User rejected')) {
                    errorMessage = '❌ Transaction cancelled by user';
                } else if (error.message.includes('Insufficient funds')) {
                    errorMessage = '❌ Insufficient funds for transaction';
                } else if (error.message.includes('Invalid address')) {
                    errorMessage = '❌ Invalid recipient address';
                } else {
                    errorMessage = `❌ Transaction failed: ${error.message}`;
                }
            } else {
                errorMessage = '❌ Transaction failed: Unknown error';
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: errorMessage
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSendMessage = async () => {
        if (value.trim()) {
            const userMessage = value.trim();
            setValue("");
            adjustHeight(true);
            
            // Add user message to chat
            setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
            setChatStarted(true);
            
            setIsTyping(true);
            
            try {
                // Send to AI API
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        message: userMessage, 
                        userId: 'default' 
                    }),
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Add AI response to chat
                    setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
                    
                    // Handle specific actions
                    if (data.action === 'connect' && !connected) {
                        handleConnect();
                    } else if (data.action === 'balance' && publicKey) {
                        const balanceResponse = await fetch(`/api/solana/balance?address=${publicKey.toString()}`);
                        const balanceData = await balanceResponse.json();
                        if (balanceData.success) {
                            setBalance(balanceData.balance);
                        }
                     } else if (data.action === 'send' && data.params) {
                         await handleSendSOLWithProcessing(data.params);
                     } else if (data.action === 'bridge' && data.params) {
                         await handleBridgeTransactionWithProcessing(data.params);
                     } else if (data.action === 'swap' && data.params) {
                         await handleSwapWithProcessing(data.params);
                     } else if (data.action === 'history' && publicKey) {
                         try {
                             const historyResponse = await fetch(`/api/transactions/simple-history?walletAddress=${publicKey.toString()}&limit=20`);
                             const historyData = await historyResponse.json();
                             
                             if (historyData.success && historyData.transactions.length > 0) {
                                 const transactions = historyData.transactions;
                                 const historyHtml = `
<div style="margin: 16px 0; padding: 16px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1);">
<h3 style="color: #3b82f6; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">📋 Transaction History</h3>
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 8px 12px; background: rgba(59, 130, 246, 0.1); border-radius: 6px;">
<span style="color: #e5e7eb; font-size: 14px;">Total Transactions: <span style="color: #10b981; font-weight: 600;">${historyData.pagination.total}</span></span>
<span style="color: #e5e7eb; font-size: 14px;">Wallet: <span style="color: #06b6d4; font-weight: 600;">${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-8)}</span></span>
</div>
                ${transactions.map((tx: { type: string; status: string; amount: string; timestamp: string; signature?: string; to?: string; fromChain?: string; toChain?: string; token?: string; toAddress?: string; txHash?: string; createdAt: string }) => `
<div style="margin: 12px 0; padding: 12px; background: rgba(255, 255, 255, 0.03); border-radius: 6px; border-left: 3px solid ${tx.status === 'completed' ? '#10b981' : tx.status === 'failed' ? '#ef4444' : '#f59e0b'};">
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
<span style="color: #e5e7eb; font-weight: 600; text-transform: capitalize;">${tx.type}</span>
<span style="color: ${tx.status === 'completed' ? '#10b981' : tx.status === 'failed' ? '#ef4444' : '#f59e0b'}; font-size: 12px; font-weight: 500; text-transform: uppercase;">${tx.status}</span>
</div>
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px;">
<div><span style="color: #9ca3af;">Amount:</span> <span style="color: #f59e0b; font-weight: 500;">${tx.amount} ${tx.token}</span></div>
<div><span style="color: #9ca3af;">Chain:</span> <span style="color: #8b5cf6; font-weight: 500;">${tx.fromChain || 'N/A'}</span></div>
${tx.toAddress ? `<div><span style="color: #9ca3af;">To:</span> <span style="color: #06b6d4; font-weight: 500;">${tx.toAddress.slice(0, 8)}...${tx.toAddress.slice(-8)}</span></div>` : ''}
${tx.txHash ? `<div><span style="color: #9ca3af;">Hash:</span> <span style="color: #10b981; font-weight: 500;">${tx.txHash.slice(0, 8)}...${tx.txHash.slice(-8)}</span></div>` : ''}
</div>
<div style="margin-top: 8px; font-size: 12px; color: #9ca3af;">
${new Date(tx.createdAt).toLocaleString()}
</div>
</div>
`).join('')}
</div>`;
                                 
                                 setMessages(prev => [...prev, {
                                     role: 'assistant',
                                     content: historyHtml
                                 }]);
                             } else {
                                 setMessages(prev => [...prev, {
                                     role: 'assistant',
                                     content: `📋 **Transaction History**\n\nNo transactions found for this wallet. Start by sending or receiving tokens to see your transaction history here.`
                                 }]);
                             }
                         } catch (historyError) {
                             console.error('History error:', historyError);
                             setMessages(prev => [...prev, {
                                 role: 'assistant',
                                 content: '❌ Failed to fetch transaction history. Please try again later.'
                             }]);
                         }
                     } else if (data.action === 'send' && publicKey && data.params) {
                         try {
                             // Use the API route instead of direct RPC calls
                             const balanceResponse = await fetch(`/api/solana/balance?address=${publicKey.toString()}`);
                             const balanceData = await balanceResponse.json();
                             
                             if (!balanceData.success) {
                                 throw new Error(balanceData.error || 'Failed to get balance');
                             }
                             
                             const balance = Math.floor(balanceData.balance * LAMPORTS_PER_SOL);
                             console.log('Got balance from API:', balanceData.balance, 'SOL');


                             // Calculate amount to send
                             let lamports;
                             if (data.params.amount === 'all') {
                                 // Leave more for fees - typically 5000 lamports for simple transfers
                                 lamports = balance - 10000; // Leave 10k lamports for fees to be safe
                                 if (lamports <= 0) {
                                     throw new Error('Insufficient funds to cover transaction fees.');
                                 }
                             } else {
                                 lamports = Math.floor(parseFloat(data.params.amount) * LAMPORTS_PER_SOL);
                             }

                             if (balance < lamports) {
                                 throw new Error(`Insufficient funds. You have ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL but trying to send ${(lamports / LAMPORTS_PER_SOL).toFixed(6)} SOL.`);
                             }

                            // Resolve domain if provided
                            let recipientAddress = data.params.to || data.params.toAddress;
                            if (data.params.domain) {
                                const domainResponse = await fetch('/api/solana/resolve-domain', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ domain: data.params.domain })
                                });
                                
                                const domainData = await domainResponse.json();
                                if (!domainData.success) {
                                    throw new Error(`Failed to resolve domain ${data.params.domain}: ${domainData.error}`);
                                }
                                recipientAddress = domainData.address;
                            }
                            
                            // Ensure we have a valid recipient address
                            if (!recipientAddress) {
                                throw new Error('No recipient address provided. Please provide a valid Solana address or .sol domain.');
                            }
                            
                            // Check if trying to send to own wallet
                            if (recipientAddress === publicKey.toString()) {
                                throw new Error('Cannot send SOL to your own wallet. Please provide a different recipient address.');
                            }

                            const transaction = new Transaction().add(
                                SystemProgram.transfer({
                                    fromPubkey: publicKey,
                                    toPubkey: new PublicKey(recipientAddress),
                                    lamports: lamports,
                                })
                            );

                            // Get latest blockhash via API route (more reliable)
                            let blockhash;
                            try {
                                const blockhashResponse = await fetch('/api/solana/blockhash');
                                const blockhashData = await blockhashResponse.json();
                                
                                if (blockhashData.success) {
                                    blockhash = blockhashData.blockhash;
                                    console.log('Successfully got blockhash via API:', blockhash);
                                } else {
                                    throw new Error(blockhashData.error || 'Failed to get blockhash');
                                }
                            } catch (blockhashError) {
                                console.error('Failed to get blockhash via API:', blockhashError);
                                
                                // Final fallback - use a mock blockhash (this might cause transaction to fail, but worth trying)
                                console.log('Using fallback blockhash due to RPC issues');
                                blockhash = '11111111111111111111111111111111'; // Mock blockhash
                            }
                            
                            if (blockhash) {
                                transaction.recentBlockhash = blockhash;
                            }
                            transaction.feePayer = publicKey;

                            // Sign and send transaction
                            setMessages(prev => [...prev, {
                                role: 'assistant',
                                content: `Preparing to send ${(lamports / LAMPORTS_PER_SOL).toFixed(4)} SOL to ${recipientAddress.slice(0, 8)}...${recipientAddress.slice(-8)}. Please confirm in your wallet.`
                            }]);

                             const signature = await sendTransaction(transaction, connection);

                             // Wait a moment for transaction to be processed
                             await new Promise(resolve => setTimeout(resolve, 2000));

                             // Check transaction status
                             try {
                                 const txStatus = await connection.getSignatureStatus(signature);
                                 if (txStatus.value?.err) {
                                     setMessages(prev => [...prev, {
                                         role: 'assistant',
                                         content: `❌ Transaction failed: ${txStatus.value?.err || 'Unknown error'}. <a href="https://solscan.io/tx/${signature}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">Check tx</a>`
                                     }]);
                                 } else {
                                     setMessages(prev => [...prev, {
                                         role: 'assistant',
                                         content: `✅ Transaction successful! <a href="https://solscan.io/tx/${signature}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">Check tx</a>`
                                     }]);
                                 }
                             } catch {
                                 // If we can't check status, just show the link
                                 setMessages(prev => [...prev, {
                                     role: 'assistant',
                                     content: `Transaction sent! <a href="https://solscan.io/tx/${signature}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">Check tx</a>`
                                 }]);
                             }

                         } catch (error) {
                             console.error('Send transaction error:', error);
                             let errorMessage = 'Transaction failed';

                            if (error instanceof Error && error.message.includes('User rejected')) {
                                errorMessage = '❌ Transaction cancelled by user';
                            } else if (error instanceof Error && error.message.includes('Insufficient funds')) {
                                errorMessage = `❌ ${error.message}`;
                             } else if (error instanceof Error && error.message.includes('Failed to get balance')) {
                                 errorMessage = `❌ Unable to check your balance. Please try again later. Error: ${error.message}`;
                             } else {
                                 errorMessage = `❌ Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
                             }

                             setMessages(prev => [...prev, {
                                 role: 'assistant',
                                 content: errorMessage
                             }]);
                         }
                    }
                } else {
                    // Fallback response if API fails
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: `Sorry, I received an error from the AI: ${data.error}. Please try again.`
                    }]);
                }
            } catch (error) {
                console.error('Error sending message:', error);
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: 'Sorry, I encountered an error. Please check your connection and try again.'
                }]);
            }
            
            setIsTyping(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col w-full items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black text-white p-6 relative overflow-hidden">
            {/* Processing Overlay */}
            {isProcessing && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-gray-800/90 border border-gray-700 rounded-xl p-8 max-w-md mx-4 text-center">
                        <div className="w-16 h-16 mx-auto mb-4">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Processing Transaction</h3>
                        <p className="text-gray-300 mb-4">Calculating amounts and preparing transaction...</p>
                        <div className="flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-100"></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-200"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Approval Modal */}
            {showApproval && pendingAction && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-gray-800/90 border border-gray-700 rounded-xl p-6 max-w-md mx-4">
                        <h3 className="text-xl font-semibold text-white mb-4">Transaction Approval</h3>
                        
                        {pendingAction.type === 'send' && (
                            <div className="space-y-4">
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-300">Amount</span>
                                        <span className="text-white font-semibold">{pendingAction.params.amount} SOL</span>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-300">To</span>
                                        <span className="text-blue-400 font-mono text-sm">
                                            {pendingAction.params.to?.slice(0, 8)}...{pendingAction.params.to?.slice(-8)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-300">Network</span>
                                        <span className="text-green-400">Solana</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {pendingAction.type === 'bridge' && (
                            <div className="space-y-4">
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-300">Amount</span>
                                        <span className="text-white font-semibold">{pendingAction.params.amount} {pendingAction.params.token}</span>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-300">From</span>
                                        <span className="text-green-400">{pendingAction.params.fromChain}</span>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-300">To</span>
                                        <span className="text-blue-400">{pendingAction.params.toChain}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-300">Recipient</span>
                                        <span className="text-purple-400 font-mono text-sm">
                                            {pendingAction.params.toAddress?.slice(0, 8)}...{pendingAction.params.toAddress?.slice(-8)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {pendingAction.type === 'swap' && (
                            <div className="space-y-4">
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-300">Amount</span>
                                        <span className="text-white font-semibold">{pendingAction.params.amount} {pendingAction.params.fromToken}</span>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-300">From</span>
                                        <span className="text-green-400">{pendingAction.params.fromToken}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-300">To</span>
                                        <span className="text-blue-400">{pendingAction.params.toToken}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={handleCancelApproval}
                                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApproval}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-colors"
                            >
                                Approve
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Waves background for visual depth - positioned to cover entire screen */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                <Waves
                    lineColor="rgba(147, 51, 234, 0.3)"
                    backgroundColor="transparent"
                    waveSpeedX={0.015}
                    waveSpeedY={0.008}
                    waveAmpX={25}
                    waveAmpY={15}
                    friction={0.95}
                    tension={0.008}
                    maxCursorMove={80}
                    xGap={15}
                    yGap={40}
                />
            </div>

            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
                <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-cyan-500/15 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
                <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-violet-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-500" />
            </div>

            {/* Conditional rendering based on chatStarted */}
            {!chatStarted ? (
                // Initial state: Merlin logo, title, command suggestions
                <div className="w-full max-w-2xl mx-auto relative">
                    <motion.div
                        className="relative z-10 space-y-12"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        <div className="text-center space-y-6">
                            {/* Merlin Logo */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
                                className="flex flex-col items-center space-y-4"
                            >
                                <div className="relative">
                                    <Image
                                        src="/merlin-logo.png"
                                        alt="Merlin Logo"
                                        width={120}
                                        height={120}
                                        className="object-contain"
                                        priority
                                    />
                                </div>
                                <motion.h1
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.5 }}
                                    className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80"
                                >
                                    MERLIN
                                </motion.h1>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                                className="inline-block"
                            >
                                <h2 className="text-2xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/40 pb-1">
                                    Your Solana Blockchain Assistant
                                </h2>
                                <motion.div
                                    className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: "100%", opacity: 1 }}
                                    transition={{ delay: 0.7, duration: 0.8 }}
                                />
                            </motion.div>

                             {/* Wallet Connection */}
                             <motion.div
                                 className="flex flex-col items-center space-y-4"
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: 1 }}
                                 transition={{ delay: 0.8 }}
                             >
                                 <WalletMultiButton className="!bg-purple-600/20 !text-white hover:!bg-purple-600/30 !border-purple-500/30 !backdrop-blur-sm" />
                                 {walletError && (
                                     <div className="text-sm text-red-400 bg-red-500/20 px-3 py-2 rounded-lg backdrop-blur-sm max-w-md text-center">
                                         <div className="font-medium mb-1">⚠️ Connection Issue</div>
                                         <div className="text-xs text-red-300">{walletError}</div>
                                         {walletError.includes('stale permissions') && (
                                             <div className="text-xs text-red-200 mt-2 p-2 bg-red-600/20 rounded">
                                                 💡 Quick Fix: Go to your wallet settings → Connected Apps → Revoke access for this site → Try connecting again
                                             </div>
                                         )}
                                     </div>
                                 )}
                                 {connected && publicKey && (
                                     <div className="text-sm text-white/60">
                                         Connected: {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
                                     </div>
                                 )}
                                 {balance !== null && (
                                     <div className="px-4 py-2 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-lg text-green-300 font-medium backdrop-blur-sm border border-green-400/20 shadow-lg shadow-green-500/10">
                                         <div className="flex items-center space-x-2">
                                             <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                             <span className="text-green-200">{balance.toFixed(4)}</span>
                                             <span className="text-green-300 font-bold">SOL</span>
                                         </div>
                                     </div>
                                 )}
                                 
                                 {/* Telegram Bot Link */}
                                 <motion.a
                                     href={(() => {
                                       const url = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || "https://t.me/askmerlin_bot";
                                       // Handle different URL formats
                                       if (url.startsWith('http://') || url.startsWith('https://')) {
                                         return url;
                                       } else if (url.startsWith('t.me/')) {
                                         return `https://${url}`;
                                       } else if (url.startsWith('@')) {
                                         return `https://t.me/${url.slice(1)}`;
                                       } else {
                                         // If it's just the bot username, add t.me/
                                         return `https://t.me/${url}`;
                                       }
                                     })()}
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     initial={{ opacity: 0, y: 10 }}
                                     animate={{ opacity: 1, y: 0 }}
                                     transition={{ delay: 0.9 }}
                                     whileHover={{ scale: 1.05 }}
                                     whileTap={{ scale: 0.95 }}
                                     className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 hover:from-blue-500/40 hover:to-cyan-500/40 rounded-lg text-white font-medium backdrop-blur-sm border border-blue-400/30 shadow-lg transition-all duration-200"
                                 >
                                     <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                         <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                                     </svg>
                                     <span>Try Telegram Bot</span>
                                 </motion.a>
                             </motion.div>
                        </div>


                        {/* Input Area for Initial State */}
                        <motion.div
                            className="relative backdrop-blur-2xl bg-black/40 rounded-2xl border border-purple-500/20 shadow-2xl"
                            initial={{ scale: 0.98 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="p-6">
                                <div className="flex items-end space-x-3">
                                    <div className="flex-1 relative">
                                        <Textarea
                                            ref={textareaRef}
                                            value={value}
                                            onChange={(e) => {
                                                setValue(e.target.value);
                                                adjustHeight();
                                            }}
                                            onKeyDown={handleKeyDown}
                                            onFocus={() => setInputFocused(true)}
                                            onBlur={() => setInputFocused(false)}
                                            placeholder="Send SOL, check balance, or ask about Solana..."
                                            className="min-h-[60px] max-h-[200px] resize-none pr-12 bg-white/[0.05] border-white/10 text-white placeholder-white/50 focus:border-white/20 focus:ring-0"
                                            containerClassName="relative"
                                            showRing={true}
                                        />
                                        
                                        <motion.button
                                            type="button"
                                            onClick={() => setShowCommandPalette(!showCommandPalette)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            data-command-button
                                        >
                                            <Image 
                                                src="/merlin-logo.png" 
                                                alt="Merlin" 
                                                width={24}
                                                height={24}
                                                className="w-6 h-6 opacity-80 hover:opacity-100 transition-opacity"
                                            />
                                        </motion.button>
                                    </div>

                                    <motion.button
                                        type="button"
                                        onClick={handleSendMessage}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={isTyping || !value.trim()}
                                        className={cn(
                                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                            isTyping || !value.trim()
                                                ? "bg-white/10 text-white/50 cursor-not-allowed"
                                                : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg"
                                        )}
                                    >
                                        {isTyping ? (
                                            <div className="flex items-center space-x-2">
                                                <TypingDots />
                                                <span>Merlin</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                <SendIcon className="w-4 h-4" />
                                                <span>Send</span>
                                            </div>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            ) : (
                // Chat started: new layout
                <motion.div
                    initial={{ y: '100vh', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="relative z-10 w-full max-w-4xl h-[85vh] flex flex-col rounded-2xl border border-purple-500/20 shadow-2xl bg-black/40 backdrop-blur-2xl"
                >
                    {/* Top Bar for Wallet */}
                     <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
                         <div className="flex items-center space-x-4">
                             <WalletMultiButton className="!bg-purple-600/20 !text-white hover:!bg-purple-600/30 !border-purple-500/30 !h-9 !px-4 !text-sm !backdrop-blur-sm" />
                             {walletError && (
                                 <div className="text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded backdrop-blur-sm max-w-[300px] text-center">
                                     <div className="font-medium">⚠️ {walletError.split('.')[0]}</div>
                                     {walletError.includes('stale permissions') && (
                                         <div className="text-xs text-red-200 mt-1">
                                             💡 Revoke site access in wallet settings
                                         </div>
                                     )}
                                 </div>
                             )}
                             {connected && publicKey && (
                                 <div className="flex items-center space-x-3 text-sm">
                                     <div className="px-3 py-1.5 bg-purple-500/20 rounded-lg text-white/80 backdrop-blur-sm">
                                         {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
                                     </div>
                                     {balance !== null && (
                                         <div className="px-3 py-1.5 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-lg text-green-300 font-medium backdrop-blur-sm border border-green-400/20 shadow-lg shadow-green-500/10">
                                             <div className="flex items-center space-x-1">
                                                 <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                                 <span className="text-green-200">{balance.toFixed(4)}</span>
                                                 <span className="text-green-300 font-bold">SOL</span>
                                             </div>
                                         </div>
                                     )}
                                 </div>
                             )}
                         </div>
                        <div className="flex items-center space-x-3">
                            <div className="text-lg font-semibold text-white/80">MERLIN</div>
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <div className="text-xs text-white/60">
                                {connected ? "Bridge Ready" : "Connect for Bridge"}
                            </div>
                        </div>
                    </div>

                    {/* Chat History */}
                    <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center text-white/70 text-xl font-medium mb-6 py-4"
                            >
                                Merlin is thinking...
                            </motion.div>
                        )}
                        {messages.map((msg, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className={cn(
                                    "flex",
                                    msg.role === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "max-w-[75%] p-4 rounded-2xl",
                                        msg.role === 'user'
                                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                                            : "bg-black/40 text-white/90 border border-purple-500/30 backdrop-blur-sm"
                                    )}
                                >
                                    <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Input Area */}
                    <div className="p-6 border-t border-purple-500/20 bg-black/20">
                        <div className="flex items-end space-x-4">
                            <div className="flex-1 relative">
                                <Textarea
                                    ref={textareaRef}
                                    value={value}
                                    onChange={(e) => {
                                        setValue(e.target.value);
                                        adjustHeight();
                                    }}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => setInputFocused(true)}
                                    onBlur={() => setInputFocused(false)}
                                    placeholder="Ask Merlin anything..."
                                    className="min-h-[60px] max-h-[200px] resize-none pr-12 bg-black/40 border-purple-500/30 text-white placeholder-white/50 focus:border-purple-500/50 focus:ring-0 backdrop-blur-sm"
                                    containerClassName="relative"
                                    showRing={true}
                                />
                                
                                <motion.button
                                    type="button"
                                    onClick={() => setShowCommandPalette(!showCommandPalette)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    data-command-button
                                >
                                    <Image 
                                        src="/merlin-logo.png" 
                                        alt="Merlin" 
                                        width={24}
                                        height={24}
                                        className="w-6 h-6 opacity-80 hover:opacity-100 transition-opacity"
                                    />
                                </motion.button>
                            </div>

                            <motion.button
                                type="button"
                                onClick={handleSendMessage}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={isTyping || !value.trim()}
                                className={cn(
                                    "px-6 py-3 rounded-xl text-sm font-medium transition-all",
                                    isTyping || !value.trim()
                                        ? "bg-purple-500/20 text-white/50 cursor-not-allowed"
                                        : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg backdrop-blur-sm"
                                )}
                            >
                                {isTyping ? (
                                    <div className="flex items-center space-x-2">
                                        <TypingDots />
                                        <span>Thinking...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <SendIcon className="w-5 h-5" />
                                        <span>Send</span>
                                    </div>
                                )}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Command Palette */}
            <AnimatePresence>
                {showCommandPalette && (
                    <motion.div 
                        ref={commandPaletteRef}
                        className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-black/90 rounded-lg z-50 shadow-lg border border-purple-500/30 overflow-hidden"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="p-2">
                            {commandSuggestions.map((suggestion, index) => (
                                <motion.button
                                    key={index}
                                    className={cn(
                                        "w-full flex items-center space-x-3 p-2 rounded-md text-left transition-colors",
                                        activeSuggestion === index 
                                            ? "bg-white/20 text-white" 
                                            : "text-white/70 hover:bg-white/10"
                                    )}
                                    onClick={() => {
                                        setValue(prev => prev + suggestion.prefix + " ");
                                        setShowCommandPalette(false);
                                        setActiveSuggestion(-1);
                                        textareaRef.current?.focus();
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="text-white/70">{suggestion.icon}</div>
                                    <div>
                                        <div className="font-medium">{suggestion.label}</div>
                                        <div className="text-xs text-white/50">{suggestion.description}</div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
