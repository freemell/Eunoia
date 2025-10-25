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

            textarea.style.height = `${minHeight}px`;
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    useEffect(() => {
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
  ({ className, containerClassName, showRing = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    
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

export function AnimatedAIChat() {
    const [value, setValue] = useState("");
    const [attachments, setAttachments] = useState<string[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [, startTransition] = useTransition();
    const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
    const [chatStarted, setChatStarted] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
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

    useEffect(() => {
        if (value.startsWith('/') && !value.includes(' ')) {
            setShowCommandPalette(true);
            
            const matchingSuggestionIndex = commandSuggestions.findIndex(
                (cmd) => cmd.prefix.startsWith(value)
            );
            
            if (matchingSuggestionIndex >= 0) {
                setActiveSuggestion(matchingSuggestionIndex);
            } else {
                setActiveSuggestion(-1);
            }
        } else {
            setShowCommandPalette(false);
        }
    }, [value, commandSuggestions]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const commandButton = document.querySelector('[data-command-button]');
            
            if (commandPaletteRef.current && 
                !commandPaletteRef.current.contains(target) && 
                !commandButton?.contains(target)) {
                setShowCommandPalette(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault();
                if (activeSuggestion >= 0) {
                    const selectedCommand = commandSuggestions[activeSuggestion];
                    setValue(selectedCommand.prefix + ' ');
                    setShowCommandPalette(false);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowCommandPalette(false);
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
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
                            // Use a simple approach - get balance from the API instead of direct RPC
                            let balance;
                            try {
                                const balanceResponse = await fetch(`/api/solana/balance?address=${publicKey.toString()}`);
                                const balanceData = await balanceResponse.json();
                                if (balanceData.success) {
                                    balance = Math.floor(balanceData.balance * LAMPORTS_PER_SOL);
                                    console.log('Got balance from API:', balanceData.balance, 'SOL');
                                } else {
                                    throw new Error(balanceData.error || 'Failed to get balance');
                                }
                            } catch (apiError) {
                                console.error('API Error:', apiError);
                                setMessages(prev => [...prev, { 
                                    role: 'assistant', 
                                    content: `Unable to get your balance. Please try again later. Error: ${apiError.message}` 
                                }]);
                                return;
                            }
                            const solBalance = balance / LAMPORTS_PER_SOL;
                            
                            // Calculate amount to send
                            let lamports;
                            if (data.params.amount === 'all') {
                                lamports = balance - 5000; // Leave some for fees
                            } else {
                                lamports = Math.floor(parseFloat(data.params.amount) * LAMPORTS_PER_SOL);
                            }
                            
                            if (lamports > balance) {
                                setMessages(prev => [...prev, { 
                                    role: 'assistant', 
                                    content: `Insufficient balance. You have ${solBalance.toFixed(4)} SOL but trying to send ${(lamports / LAMPORTS_PER_SOL).toFixed(4)} SOL.` 
                                }]);
                                return;
                            }
                            
                            // Create transaction
                            const transaction = new Transaction().add(
                                SystemProgram.transfer({
                                    fromPubkey: publicKey,
                                    toPubkey: new PublicKey(data.params.to),
                                    lamports: lamports,
                                })
                            );
                            
                            // Get recent blockhash
                            const { blockhash } = await connection.getLatestBlockhash();
                            transaction.recentBlockhash = blockhash;
                            transaction.feePayer = publicKey;
                            
                            // Sign and send transaction using wallet
                            setMessages(prev => [...prev, { 
                                role: 'assistant', 
                                content: `Preparing to send ${(lamports / LAMPORTS_PER_SOL).toFixed(4)} SOL to ${data.params.to.slice(0, 8)}...${data.params.to.slice(-8)}. Please confirm in your wallet.` 
                            }]);
                            
                            // Use wallet's sendTransaction method which handles signing
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
                            } else if (error.message.includes('No signers')) {
                                errorMessage = 'Wallet signing failed. Please try again.';
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
                    // Handle specific commands even if AI fails
                    const lowerMessage = userMessage.toLowerCase();
                    if (lowerMessage.includes('balance') || lowerMessage.includes('/balance')) {
                        if (publicKey) {
                            try {
                                const walletAddress = publicKey.toString();
                                console.log('Wallet address:', walletAddress);
                                const balanceResponse = await fetch(`/api/solana/balance?address=${walletAddress}`);
                                console.log('Balance response status:', balanceResponse.status);
                                const balanceData = await balanceResponse.json();
                                console.log('Balance data:', balanceData);
                                if (balanceData.success) {
                                    setBalance(balanceData.balance);
                                    setMessages(prev => [...prev, { 
                                        role: 'assistant', 
                                        content: `Your balance is ${balanceData.balance.toFixed(4)} SOL` 
                                    }]);
                                } else {
                                    setMessages(prev => [...prev, { 
                                        role: 'assistant', 
                                        content: `Sorry, I couldn't fetch your balance. Error: ${balanceData.error}` 
                                    }]);
                                }
                            } catch (error) {
                                console.error('Balance fetch error:', error);
                                setMessages(prev => [...prev, { 
                                    role: 'assistant', 
                                    content: `Sorry, I couldn't fetch your balance. Error: ${error.message}` 
                                }]);
                            }
                        } else {
                            setMessages(prev => [...prev, { 
                                role: 'assistant', 
                                content: 'Please connect your wallet first to check your balance.' 
                            }]);
                        }
                    } else if (lowerMessage.includes('connect') || lowerMessage.includes('wallet')) {
                        if (!connected) {
                            connect();
                            setMessages(prev => [...prev, { 
                                role: 'assistant', 
                                content: 'Connecting your wallet...' 
                            }]);
                        } else {
                            setMessages(prev => [...prev, { 
                                role: 'assistant', 
                                content: 'Your wallet is already connected!' 
                            }]);
                        }
                    } else {
                        // Generic fallback response
                        setMessages(prev => [...prev, { 
                            role: 'assistant', 
                            content: `I received your message: "${userMessage}". I'm Merlin, your Solana assistant. I can help you connect your wallet, check balances, and send SOL. Try saying "connect wallet" or "check my balance".` 
                        }]);
                    }
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

    const handleAttachFile = () => {
        const mockFileName = `file-${Math.floor(Math.random() * 1000)}.pdf`;
        setAttachments(prev => [...prev, mockFileName]);
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };
    
    const selectCommandSuggestion = (index: number) => {
        const selectedCommand = commandSuggestions[index];
        setValue(selectedCommand.prefix + ' ');
        setShowCommandPalette(false);
    };

    return (
        <div className="min-h-screen flex flex-col w-full items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white p-6 relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
                <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-cyan-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
                <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-violet-500/5 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-500" />
            </div>
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

                    {/* Chat History */}
                    {messages.length > 0 && (
                        <motion.div 
                            className="relative backdrop-blur-2xl bg-white/[0.02] rounded-2xl border border-white/[0.05] shadow-2xl mb-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="p-4 max-h-64 overflow-y-auto">
                                {messages.map((msg, index) => (
                                    <div key={index} className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                        <div className={`inline-block p-3 rounded-lg ${
                                            msg.role === 'user' 
                                                ? 'bg-white/10 text-white' 
                                                : 'bg-white/5 text-white/80'
                                        }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    <motion.div 
                        className="relative backdrop-blur-2xl bg-white/[0.02] rounded-2xl border border-white/[0.05] shadow-2xl"
                        initial={{ scale: 0.98 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <AnimatePresence>
                            {showCommandPalette && (
                                <motion.div 
                                    ref={commandPaletteRef}
                                    className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-black/90 rounded-lg z-50 shadow-lg border border-white/10 overflow-hidden"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className="py-1 bg-black/95">
                                        {commandSuggestions.map((suggestion, index) => (
                                            <motion.div
                                                key={suggestion.prefix}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer",
                                                    activeSuggestion === index 
                                                        ? "bg-white/10 text-white" 
                                                        : "text-white/70 hover:bg-white/5"
                                                )}
                                                onClick={() => selectCommandSuggestion(index)}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: index * 0.03 }}
                                            >
                                                <div className="w-5 h-5 flex items-center justify-center text-white/60">
                                                    {suggestion.icon}
                                                </div>
                                                <div className="font-medium">{suggestion.label}</div>
                                                <div className="text-white/40 text-xs ml-1">
                                                    {suggestion.prefix}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="p-4">
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
                                containerClassName="w-full"
                                className={cn(
                                    "w-full px-4 py-3",
                                    "resize-none",
                                    "bg-transparent",
                                    "border-none",
                                    "text-white/90 text-sm",
                                    "focus:outline-none",
                                    "placeholder:text-white/20",
                                    "min-h-[60px]"
                                )}
                                style={{
                                    overflow: "hidden",
                                }}
                                showRing={false}
                            />
                        </div>

                        <AnimatePresence>
                            {attachments.length > 0 && (
                                <motion.div 
                                    className="px-4 pb-3 flex gap-2 flex-wrap"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    {attachments.map((file, index) => (
                                        <motion.div
                                            key={index}
                                            className="flex items-center gap-2 text-xs bg-white/[0.03] py-1.5 px-3 rounded-lg text-white/70"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                        >
                                            <span>{file}</span>
                                            <button 
                                                onClick={() => removeAttachment(index)}
                                                className="text-white/40 hover:text-white transition-colors"
                                            >
                                                <XIcon className="w-3 h-3" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="p-4 border-t border-white/[0.05] flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <motion.button
                                    type="button"
                                    onClick={handleAttachFile}
                                    whileTap={{ scale: 0.94 }}
                                    className="p-2 text-white/40 hover:text-white/90 rounded-lg transition-colors relative group"
                                >
                                    <Paperclip className="w-4 h-4" />
                                    <motion.span
                                        className="absolute inset-0 bg-white/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        layoutId="button-highlight"
                                    />
                                </motion.button>
                                <motion.button
                                    type="button"
                                    data-command-button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowCommandPalette(prev => !prev);
                                    }}
                                    whileTap={{ scale: 0.94 }}
                                    className={cn(
                                        "p-2 text-white/40 hover:text-white/90 rounded-lg transition-colors relative group",
                                        showCommandPalette && "bg-white/10 text-white/90"
                                    )}
                                >
                                    <Command className="w-4 h-4" />
                                    <motion.span
                                        className="absolute inset-0 bg-white/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        layoutId="button-highlight"
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
                                    "flex items-center gap-2",
                                    value.trim()
                                        ? "bg-white text-[#0A0A0B] shadow-lg shadow-white/10"
                                        : "bg-white/[0.05] text-white/40"
                                )}
                            >
                                {isTyping ? (
                                    <LoaderIcon className="w-4 h-4 animate-[spin_2s_linear_infinite]" />
                                ) : (
                                    <SendIcon className="w-4 h-4" />
                                )}
                                <span>Send</span>
                            </motion.button>
                        </div>
                    </motion.div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {commandSuggestions.map((suggestion, index) => (
                            <motion.button
                                key={suggestion.prefix}
                                onClick={() => selectCommandSuggestion(index)}
                                className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] hover:bg-white/[0.05] rounded-lg text-sm text-white/60 hover:text-white/90 transition-all relative group"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                {suggestion.icon}
                                <span>{suggestion.label}</span>
                                <motion.div
                                    className="absolute inset-0 border border-white/[0.05] rounded-lg"
                                    initial={false}
                                    animate={{
                                        opacity: [0, 1],
                                        scale: [0.98, 1],
                                    }}
                                    transition={{
                                        duration: 0.3,
                                        ease: "easeOut",
                                    }}
                                />
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </div>

            <AnimatePresence>
                {isTyping && (
                    <motion.div 
                        className="fixed bottom-8 mx-auto transform -translate-x-1/2 backdrop-blur-2xl bg-white/[0.02] rounded-full px-4 py-2 shadow-lg border border-white/[0.05]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-7 rounded-full bg-white/[0.05] flex items-center justify-center text-center">
                                <span className="text-xs font-medium text-white/90 mb-0.5">Merlin</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-white/70">
                                <span>Thinking</span>
                                <TypingDots />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {inputFocused && (
                <motion.div 
                    className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none z-0 opacity-[0.02] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 blur-[96px]"
                    animate={{
                        x: mousePosition.x - 400,
                        y: mousePosition.y - 400,
                    }}
                    transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 150,
                        mass: 0.5,
                    }}
                />
            )}
        </div>
    );
}

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
                        delay: dot * 0.15,
                        ease: "easeInOut",
                    }}
                    style={{
                        boxShadow: "0 0 4px rgba(255, 255, 255, 0.3)"
                    }}
                />
            ))}
        </div>
    );
}


const rippleKeyframes = `
@keyframes ripple {
  0% { transform: scale(0.5); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }
}
`;

if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = rippleKeyframes;
    document.head.appendChild(style);
}
