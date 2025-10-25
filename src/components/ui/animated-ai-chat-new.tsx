"use client";

import { useEffect, useRef, useCallback, useTransition, useMemo } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    Wallet,
    Coins,
    TrendingUp,
    Shield,
    Paperclip,
    SendIcon,
    XIcon,
    LoaderIcon,
    Command,
    Zap,
    Database,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react"
import Image from "next/image";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
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
    const [, startTransition] = useTransition();
    const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
    const [chatStarted, setChatStarted] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
    const [balance, setBalance] = useState<number | null>(null);
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

    const [inputFocused, setInputFocused] = useState(false);
    const commandPaletteRef = useRef<HTMLDivElement>(null);
    
    // Wallet integration
    const { publicKey, connected, connect, disconnect, sendTransaction } = useWallet();
    const { connection } = useConnection();

    useEffect(() => {
        if (connected && publicKey) {
            // Fetch balance on connection
            const fetchBalance = async () => {
                try {
                    const balanceResponse = await fetch(`/api/solana/balance?address=${publicKey.toString()}`);
                    const balanceData = await balanceResponse.json();
                    if (balanceData.success) {
                        setBalance(balanceData.balance);
                    } else {
                        console.error("Failed to fetch balance:", balanceData.error);
                    }
                } catch (error) {
                    console.error("Error fetching balance:", error);
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
            label: "Swap Tokens",
            description: "Swap tokens on Solana",
            prefix: "/swap"
        },
        {
            icon: <Zap className="w-4 h-4" />,
            label: "Stake SOL",
            description: "Stake your SOL tokens",
            prefix: "/stake"
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
                        connect();
                    } else if (data.action === 'balance' && publicKey) {
                        const balanceResponse = await fetch(`/api/solana/balance?address=${publicKey.toString()}`);
                        const balanceData = await balanceResponse.json();
                        if (balanceData.success) {
                            setBalance(balanceData.balance);
                        }
                    } else if (data.action === 'send' && publicKey && data.params) {
                        try {
                            // Get current balance with error handling
                            let balance;
                            const rpcEndpoints = [
                                'https://api.mainnet-beta.solana.com',
                                'https://solana-api.projectserum.com',
                                'https://rpc.ankr.com/solana'
                            ];

                            let rpcError;
                            for (const endpoint of rpcEndpoints) {
                                try {
                                    const { Connection } = await import('@solana/web3.js');
                                    const fallbackConnection = new Connection(endpoint);
                                    balance = await fallbackConnection.getBalance(publicKey);
                                    console.log('Successfully connected to:', endpoint);
                                    break;
                                } catch (error) {
                                    rpcError = error;
                                    console.warn(`Failed to connect to ${endpoint}:`, error.message);
                                }
                            }

                            if (balance === undefined) {
                                throw new Error(`All RPC connections failed. Last error: ${rpcError?.message || 'Unknown RPC error'}`);
                            }

                            const solBalance = balance / LAMPORTS_PER_SOL;

                            // Calculate amount to send
                            let lamports;
                            if (data.params.amount === 'all') {
                                lamports = balance - 5000; // Leave some for fees
                                if (lamports <= 0) {
                                    throw new Error('Insufficient funds to cover transaction fees.');
                                }
                            } else {
                                lamports = Math.floor(parseFloat(data.params.amount) * LAMPORTS_PER_SOL);
                            }

                            if (solBalance * LAMPORTS_PER_SOL < lamports) {
                                throw new Error('Insufficient funds for transaction.');
                            }

                            const transaction = new Transaction().add(
                                SystemProgram.transfer({
                                    fromPubkey: publicKey,
                                    toPubkey: new PublicKey(data.params.to),
                                    lamports: lamports,
                                })
                            );

                            // Get latest blockhash
                            const { blockhash } = await connection.getLatestBlockhash();
                            transaction.recentBlockhash = blockhash;
                            transaction.feePayer = publicKey;

                            // Sign and send transaction
                            setMessages(prev => [...prev, {
                                role: 'assistant',
                                content: `Preparing to send ${(lamports / LAMPORTS_PER_SOL).toFixed(4)} SOL to ${data.params.to.slice(0, 8)}...${data.params.to.slice(-8)}. Please confirm in your wallet.`
                            }]);

                            const signature = await sendTransaction(transaction, connection);

                            setMessages(prev => [...prev, {
                                role: 'assistant',
                                content: `Transaction sent! Signature: ${signature}. You can view it on Solscan: https://solscan.io/tx/${signature}`
                            }]);

                        } catch (error) {
                            console.error('Send transaction error:', error);
                            let errorMessage = 'Transaction failed';

                            if (error.message.includes('User rejected')) {
                                errorMessage = 'Transaction cancelled by user';
                            } else if (error.message.includes('Insufficient funds')) {
                                errorMessage = 'Insufficient funds for transaction';
                            } else if (error.message.includes('RPC connection failed')) {
                                errorMessage = `RPC connection failed. Please try again in a moment. Error: ${error.message}`;
                            } else {
                                errorMessage = `Transaction failed: ${error.message}`;
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
        <div className="min-h-screen flex flex-col w-full items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white p-6 relative overflow-hidden">
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
                <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-cyan-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
                <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-violet-500/5 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-500" />
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
                                <WalletMultiButton className="!bg-white/10 !text-white hover:!bg-white/20 !border-white/20" />
                                {connected && publicKey && (
                                    <div className="text-sm text-white/60">
                                        Connected: {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
                                    </div>
                                )}
                                {balance !== null && (
                                    <div className="text-sm text-white/60">
                                        Balance: {balance.toFixed(4)} SOL
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        {/* Command Suggestions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9, duration: 0.5 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/[0.02] rounded-xl border border-white/[0.05] shadow-lg"
                        >
                            {commandSuggestions.map((command, index) => (
                                <motion.button
                                    key={index}
                                    className="flex items-center space-x-3 p-3 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg transition-colors duration-200"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        setValue(command.prefix + " ");
                                        handleSendMessage();
                                    }}
                                >
                                    <div className="text-white/70">{command.icon}</div>
                                    <div>
                                        <div className="font-medium text-white">{command.label}</div>
                                        <div className="text-sm text-white/50">{command.description}</div>
                                    </div>
                                </motion.button>
                            ))}
                        </motion.div>

                        {/* Input Area for Initial State */}
                        <motion.div
                            className="relative backdrop-blur-2xl bg-white/[0.02] rounded-2xl border border-white/[0.05] shadow-2xl"
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
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            data-command-button
                                        >
                                            <Command className="w-4 h-4 text-white/70" />
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
                    className="relative z-10 w-full max-w-4xl h-[85vh] flex flex-col rounded-2xl border border-white/[0.05] shadow-2xl bg-white/[0.02] backdrop-blur-2xl"
                >
                    {/* Top Bar for Wallet */}
                    <div className="flex items-center justify-between p-4 border-b border-white/[0.05]">
                        <div className="flex items-center space-x-4">
                            <WalletMultiButton className="!bg-white/10 !text-white hover:!bg-white/20 !border-white/20 !h-9 !px-4 !text-sm" />
                            {connected && publicKey && (
                                <div className="flex items-center space-x-3 text-sm">
                                    <div className="px-3 py-1.5 bg-white/10 rounded-lg text-white/80">
                                        {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
                                    </div>
                                    {balance !== null && (
                                        <div className="px-3 py-1.5 bg-green-500/20 rounded-lg text-green-300 font-medium">
                                            {balance.toFixed(4)} SOL
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="text-lg font-semibold text-white/80">MERLIN</div>
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
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
                                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                            : "bg-white/10 text-white/90 border border-white/20"
                                    )}
                                >
                                    {msg.content}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Input Area */}
                    <div className="p-6 border-t border-white/[0.05] bg-white/[0.02]">
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
                                    className="min-h-[60px] max-h-[200px] resize-none pr-12 bg-white/[0.05] border-white/10 text-white placeholder-white/50 focus:border-white/20 focus:ring-0"
                                    containerClassName="relative"
                                    showRing={true}
                                />
                                
                                <motion.button
                                    type="button"
                                    onClick={() => setShowCommandPalette(!showCommandPalette)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    data-command-button
                                >
                                    <Command className="w-4 h-4 text-white/70" />
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
                                        ? "bg-white/10 text-white/50 cursor-not-allowed"
                                        : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg"
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
                        className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-black/90 rounded-lg z-50 shadow-lg border border-white/10 overflow-hidden"
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

