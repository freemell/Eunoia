// Bridge implementation for Telegram bot using Bungee Exchange API
// Real cross-chain bridge implementation using public sandbox endpoint

import { Connection, PublicKey, VersionedTransaction, LAMPORTS_PER_SOL, TransactionInstruction, TransactionMessage, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, createAssociatedTokenAccountInstruction, createSyncNativeInstruction } from '@solana/spl-token';
import { fetchQuote, swapFromSolana } from '@mayanfinance/swap-sdk';
import { config } from 'dotenv';
import { logger } from './logger.js';

config();

// Get RPC URL from environment (default to mainnet)
const HELIUS_RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=3b269aef-4457-42ba-b1a3-c78854d59c3a'; // Helius free tier from helius.dev

const getRpcUrl = () => {
  if (process.env.SOLANA_RPC_URL) {
    return process.env.SOLANA_RPC_URL;
  }
  if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
    return process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  }
  return HELIUS_RPC_URL;
};

// Create Solana connection
const createConnection = () => {
  const rpcUrl = getRpcUrl();
  logger.info('Creating Solana bridge connection', { rpcUrl });
  return new Connection(rpcUrl, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
  });
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class MerlinBridge {
  constructor() {
    // Hardcoded to Bungee Exchange public backend (free, keyless access for testing)
    // WARNING: Very limited shared RPS - not suitable for production
    // This is hardcoded to ensure no API key is required
    const baseUrl = 'https://public-backend.bungee.exchange';
    
    // Remove trailing slash if present
    this.socketApiUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.isBungeePublic = true; // Always true since we're hardcoding Bungee
  }

  // Normalize chain names (handle common variations)
  normalizeChainName(chain) {
    if (!chain) return null;
    
    const chainLower = chain.toLowerCase();
    
    // Map common variations to standard names
    const chainAliases = {
      'sol': 'solana',
      'solana': 'solana',
      'eth': 'ethereum',
      'ethereum': 'ethereum',
      'base': 'base',
      'polygon': 'polygon',
      'arbitrum': 'arbitrum',
      'optimism': 'optimism',
      'avalanche': 'avalanche',
      'avax': 'avalanche',
      'bsc': 'bsc',
      'bnb': 'bsc', // BNB Smart Chain (BSC)
      'binance': 'bsc',
      'binance smart chain': 'bsc',
    };
    
    return chainAliases[chainLower] || chainLower;
  }

  // Chain ID mappings for Socket/Bungee API
  getChainId(chain) {
    const normalizedChain = this.normalizeChainName(chain);
    
    // Use Bungee's chain IDs when using Bungee public backend
    if (this.isBungeePublic) {
      const bungeeChainMapping = {
        'solana': 89999, // Bungee's chain ID for Solana mainnet
        'ethereum': 1,
        'base': 8453,
        'polygon': 137,
        'arbitrum': 42161,
        'optimism': 10,
        'avalanche': 43114,
        'bsc': 56, // BNB Smart Chain
      };
      return bungeeChainMapping[normalizedChain] || null;
    }
    
    // Socket.tech chain IDs
    const chainMapping = {
      'solana': 1399811149, // Socket chain ID for Solana
      'ethereum': 1,
      'base': 8453,
      'polygon': 137,
      'arbitrum': 42161,
      'optimism': 10,
      'avalanche': 43114,
      'bsc': 56, // BNB Smart Chain
    };
    
    return chainMapping[normalizedChain] || null;
  }

  // Token address mappings
  getTokenAddress(chain, token) {
    // Handle case-insensitive inputs
    const chainLower = chain ? chain.toLowerCase() : '';
    const tokenUpper = token ? token.toUpperCase() : '';
    
    // Bungee/Socket native token address (lowercase) - used for native tokens across all chains
    const nativeAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    
    // Native SOL on Solana - use native address for bridging (not WSOL)
    if (chainLower === 'solana' && (tokenUpper === 'SOL' || !tokenUpper)) {
      return nativeAddress; // Bungee expects native address for SOL on Solana
    }
    
    // Solana token addresses (for non-native tokens)
    if (chainLower === 'solana') {
      const solanaTokens = {
        'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        'WSOL': 'So11111111111111111111111111111111111111112', // WSOL fallback if explicitly requested
      };
      return solanaTokens[tokenUpper] || token; // Return as-is if not in mapping
    }
    
    // EVM token addresses (mainnet)
    const normalizedChain = this.normalizeChainName(chain);
    const evmTokens = {
      'USDC': normalizedChain === 'ethereum' ? '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' :
              normalizedChain === 'base' ? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' :
              normalizedChain === 'polygon' ? '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' :
              normalizedChain === 'arbitrum' ? '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' :
              normalizedChain === 'bsc' ? '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' : // BSC USDC
              '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      'USDT': normalizedChain === 'ethereum' ? '0xdAC17F958D2ee523a2206206994597C13D831ec7' :
              normalizedChain === 'polygon' ? '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' :
              normalizedChain === 'bsc' ? '0x55d398326f99059fF775485246999027B3197955' : // BSC USDT
              '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    };
    
    // Native tokens on EVM chains (ETH, BNB, MATIC, AVAX, etc.)
    const evmNatives = ['ETH', 'BNB', 'MATIC', 'AVAX'];
    if (evmNatives.includes(tokenUpper)) {
      return nativeAddress;
    }
    
    // Return mapped token address or default to native token address
    return evmTokens[tokenUpper] || nativeAddress;
  }

  async executeBridge(params, keypair) {
    try {
      const { fromChain, toChain, token, amount, toAddress } = params;

      console.log('🌉 Executing bridge:', { fromChain, toChain, token, amount, toAddress });

      // Validate parameters
      if (!fromChain || !toChain) {
        return {
          success: false,
          message: 'Missing chain parameters',
          error: `Invalid chain parameters: fromChain=${fromChain}, toChain=${toChain}`
        };
      }

      if (!toAddress) {
        return {
          success: false,
          message: 'Missing destination address',
          error: 'toAddress is required for bridging'
        };
      }

      if (!keypair) {
        return {
          success: false,
          message: 'Missing keypair',
          error: 'Wallet keypair is required for bridging'
        };
      }

      // Normalize chain names
      const normalizedFromChain = this.normalizeChainName(fromChain);
      const normalizedToChain = this.normalizeChainName(toChain);

      // Get chain IDs
      const fromChainId = this.getChainId(normalizedFromChain);
      const toChainId = this.getChainId(normalizedToChain);

      if (!fromChainId || !toChainId) {
        return {
          success: false,
          message: 'Unsupported chain',
          error: `Chain not supported: fromChain=${fromChain} (normalized: ${normalizedFromChain}), toChain=${toChain} (normalized: ${normalizedToChain}). Supported chains: Solana, Ethereum, Base, Polygon, Arbitrum, Optimism, Avalanche, BSC/BNB`
        };
      }

      // For Solana to EVM bridges, use Socket API
      if (normalizedFromChain === 'solana' && this.isEvmChain(normalizedToChain)) {
        return await this.bridgeSolanaToEvm(params, keypair, fromChainId, toChainId, normalizedToChain);
      }

      return {
        success: false,
        message: 'Bridge not yet implemented for this chain combination',
        error: `Bridge from ${fromChain} to ${toChain} not supported yet. Currently only Solana to EVM chains are supported.`
      };

    } catch (error) {
      console.error('❌ Bridge execution error:', error);
      return {
        success: false,
        message: 'Bridge execution failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async buildSolanaTransaction(txData, keypair, toAddress) {
    try {
      const connection = createConnection();
      logger.info('Building Solana transaction via Bungee route', { toAddress });
      
      // Check if txData is a base64-encoded string (legacy format)
      if (typeof txData === 'string') {
        // Legacy: base64 encoded transaction
        const transactionBuf = Buffer.from(txData, 'base64');
        const transaction = VersionedTransaction.deserialize(transactionBuf);
        transaction.sign([keypair]);
        
        const signature = await connection.sendRawTransaction(transaction.serialize(), {
          skipPreflight: false,
          maxRetries: 3,
        });
        
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        }, 'confirmed');
        
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }
        
        return signature;
      }
      
      // New format: txData contains instructions, lookupTables, signers
      if (txData.instructions && Array.isArray(txData.instructions)) {
        // Use imports from top of file
        
        // Convert instructions
        const instructions = txData.instructions.map(instr => {
          // Data is u8 array ([14, 63, ...]) - convert to Buffer
          let instructionData;
          if (Array.isArray(instr.data)) {
            // Data is u8 array
            instructionData = Buffer.from(instr.data);
          } else if (typeof instr.data === 'string') {
            // Data might be base64-encoded string (legacy)
            instructionData = Buffer.from(instr.data, 'base64');
          } else {
            throw new Error(`Unknown instruction data format: ${typeof instr.data}`);
          }
          
          return new TransactionInstruction({
            programId: new PublicKey(instr.programId),
            keys: instr.keys.map(key => ({
              pubkey: new PublicKey(key.pubkey),
              isSigner: key.isSigner,
              isWritable: key.isWritable,
            })),
            data: instructionData,
          });
        });
        
        // Fetch lookup tables if present
        let lookupTableAccounts = [];
        if (txData.lookupTables && Array.isArray(txData.lookupTables) && txData.lookupTables.length > 0) {
          console.log(`📋 Fetching ${txData.lookupTables.length} lookup table(s)...`);
          const tables = await Promise.all(
            txData.lookupTables.map(async (addr) => {
              try {
                return await connection.getAddressLookupTable(new PublicKey(addr));
              } catch (error) {
                console.warn(`⚠️ Failed to fetch lookup table ${addr}:`, error.message);
                return null;
              }
            })
          );
          lookupTableAccounts = tables.filter(table => table !== null);
          console.log(`✅ Loaded ${lookupTableAccounts.length} lookup table(s)`);
        }
        
        // Helper to compile a versioned transaction with a given blockhash
        const compileTransaction = (recentBlockhash) => {
          const messageV0 = new TransactionMessage({
            payerKey: keypair.publicKey,
            recentBlockhash,
            instructions,
          }).compileToV0Message(lookupTableAccounts);
          return new VersionedTransaction(messageV0);
        };
        
        // Sign with user keypair and additional signers if any
        const signers = [keypair];
        if (txData.signers && Array.isArray(txData.signers) && txData.signers.length > 0) {
          console.log(`🔐 Adding ${txData.signers.length} additional signer(s)...`);
          const additionalSigners = txData.signers.map(secret => {
            // Handle both Uint8Array and array formats
            const secretKey = secret instanceof Uint8Array ? secret : Uint8Array.from(secret);
            return Keypair.fromSecretKey(secretKey);
          });
          signers.push(...additionalSigners);
        }
        
        // Fetch blockhash for simulation
        const initialBlockhashInfo = await connection.getLatestBlockhash('processed');
        let transaction = compileTransaction(initialBlockhashInfo.blockhash);
        transaction.sign(signers);
        console.log(`✍️ Transaction signed with ${signers.length} signer(s) for simulation`);
        
        // Simulate transaction to surface detailed errors before sending on-chain
        try {
          logger.info('Simulating bridge transaction');
          const simulation = await connection.simulateTransaction(transaction, {
            sigVerify: false,
            commitment: 'processed',
          });
          
          if (simulation.value.err) {
            logger.error('Bridge transaction simulation failed', { error: simulation.value.err });
            console.error('🧪 Transaction simulation failed:', simulation.value.err);
            if (simulation.value.logs) {
              console.log('🧪 Simulation logs:', simulation.value.logs);
            }
            throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
          }
          
          if (simulation.value.logs && simulation.value.logs.length > 0) {
            logger.debug('Bridge simulation logs', { logs: simulation.value.logs });
            console.log('🧪 Simulation logs:', simulation.value.logs);
          } else {
            logger.info('Bridge transaction simulation succeeded');
            console.log('🧪 Transaction simulation succeeded (no logs returned)');
          }
        } catch (simError) {
          logger.error('Simulation threw unexpected error', { error: simError instanceof Error ? simError.message : simError });
          console.error('❌ Simulation error:', simError);
          throw simError;
        }
        
        // Refresh blockhash right before sending to avoid expiration
        const latestBlockhashInfo = await connection.getLatestBlockhash('processed');
        const { blockhash, lastValidBlockHeight } = latestBlockhashInfo;
        transaction = compileTransaction(blockhash);
        transaction.sign(signers);
        console.log(`✍️ Transaction re-signed with refreshed blockhash ${blockhash}`);
        
        const skipPreflightEnv = process.env.BRIDGE_SKIP_PREFLIGHT;
        const skipPreflight = skipPreflightEnv ? skipPreflightEnv === 'true' : false;
        if (skipPreflight) {
          console.log('⚙️ Skipping preflight checks per BRIDGE_SKIP_PREFLIGHT=true');
        }
        
        // Send transaction with configurable preflight behaviour
        const signature = await connection.sendTransaction(transaction, {
          skipPreflight,
          preflightCommitment: 'processed',
          maxRetries: 3,
        });
        logger.info('Bridge transaction sent to Solana', { signature });
        console.log('📤 Bridge transaction sent:', signature);
        
        // Wait for confirmation
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        }, 'confirmed');
        
        if (confirmation.value.err) {
          logger.error('Bridge transaction confirmation failed', { error: confirmation.value.err, signature });
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }
        
        logger.info('Bridge transaction confirmed on Solana', { signature });
        console.log('✅ Transaction confirmed on Solana');
        
        return signature;
      }
      
      throw new Error('Unknown transaction data format');
    } catch (error) {
      console.error('❌ Error building Solana transaction:', error);
      throw error;
    }
  }

  isSolanaMintAddress(value) {
    if (!value || typeof value !== 'string') return false;
    if (value.startsWith('0x')) return false;
    // Basic length check for base58 addresses
    return value.length >= 32 && value.length <= 44;
  }

  async ensureAtas(connection, keypair, mintAddresses = [], requiredAmountSol = 0) {
    const uniqueMints = [...new Set(mintAddresses.filter(mint => this.isSolanaMintAddress(mint)))];
    if (uniqueMints.length === 0) {
      return;
    }

    if (requiredAmountSol > 0) {
      const balanceLamports = await connection.getBalance(keypair.publicKey, 'processed');
      const balanceSol = balanceLamports / LAMPORTS_PER_SOL;
      const requiredSol = requiredAmountSol + 0.02;
      if (balanceSol < requiredSol) {
        logger.error('Insufficient SOL balance for Mayan bridge', { balanceSol, requiredSol });
        throw new Error('Insufficient SOL for Mayan bridge - add at least 0.02 SOL more for fees and auctions');
      }
      logger.info('SOL balance sufficient for Mayan bridge', { balanceSol, requiredSol });
    }

    const ataInstructions = [];
    for (const mintAddress of uniqueMints) {
      try {
        const mintPubkey = new PublicKey(mintAddress);
        const ata = await getAssociatedTokenAddress(mintPubkey, keypair.publicKey);
        try {
          await getAccount(connection, ata);
          logger.debug('ATA already exists', { mintAddress, ata: ata.toBase58() });
        } catch (accountError) {
          logger.info('Creating missing ATA', { mintAddress, ata: ata.toBase58() });
          ataInstructions.push(
            createAssociatedTokenAccountInstruction(
              keypair.publicKey,
              ata,
              keypair.publicKey,
              mintPubkey
            )
          );
        }
      } catch (error) {
        logger.warn('Failed to prepare ATA', { mintAddress, error: error.message });
      }
    }

    if (ataInstructions.length === 0) {
      return;
    }

    const transaction = new Transaction().add(...ataInstructions);
    transaction.feePayer = keypair.publicKey;

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('processed');
    transaction.recentBlockhash = blockhash;
    transaction.sign(keypair);

    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, 'confirmed');

    logger.info('ATA preparation completed', { signature });
  }

  async ensureWsolBalance(connection, keypair, requiredLamports) {
    const wsolMint = 'So11111111111111111111111111111111111111112';
    const wsolAta = await getAssociatedTokenAddress(new PublicKey(wsolMint), keypair.publicKey);

    const balanceInfo = await connection.getTokenAccountBalance(wsolAta).catch(() => null);
    const currentLamports = balanceInfo ? Number(balanceInfo.value.amount) : 0;
    const bufferLamports = 1_000_000; // ~0.001 SOL buffer
    const targetLamports = requiredLamports + bufferLamports;

    if (currentLamports >= targetLamports) {
      logger.info('WSOL balance sufficient for bridge', { currentLamports, targetLamports });
      return;
    }

    const additionalLamports = targetLamports - currentLamports;

    logger.info('Wrapping SOL to WSOL ATA', { currentLamports, targetLamports, additionalLamports });

    const wrapTransaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: wsolAta,
        lamports: additionalLamports,
      }),
      createSyncNativeInstruction(wsolAta)
    );

    wrapTransaction.feePayer = keypair.publicKey;
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('processed');
    wrapTransaction.recentBlockhash = blockhash;
    wrapTransaction.sign(keypair);

    const signature = await connection.sendTransaction(
      wrapTransaction,
      [keypair],
      {
        skipPreflight: false,
        preflightCommitment: 'processed',
        maxRetries: 3,
      }
    );

    logger.info('WSOL wrap transaction sent', { signature });

    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, 'confirmed');

    if (confirmation.value.err) {
      logger.error('WSOL wrap transaction failed', { error: confirmation.value.err });
      throw new Error(`Failed to wrap SOL to WSOL: ${JSON.stringify(confirmation.value.err)}`);
    }

    logger.info('WSOL wrap transaction confirmed', { signature });
  }

  async bridgeWithMayan(params, keypair, normalizedToChain, amountInSmallestUnit) {
    const { amount, toAddress, token } = params;
    logger.info('Attempting Mayan fallback bridge', { amount, token, normalizedToChain, toAddress });

    const connection = createConnection();
    const fromAddress = keypair.publicKey.toBase58();
    const amountSol = amountInSmallestUnit / LAMPORTS_PER_SOL;

    const quoteParams = {
      amountIn64: amountInSmallestUnit.toString(),
      fromToken: 'So11111111111111111111111111111111111111112', // WSOL
      toToken: this.getTokenAddress(normalizedToChain, token || 'SOL'),
      fromChain: 'solana',
      toChain: normalizedToChain,
      slippageBps: 500,
      gasDrop: 0,
    };

    await this.ensureAtas(connection, keypair, ['So11111111111111111111111111111111111111112'], amountSol);
    await this.ensureWsolBalance(connection, keypair, amountInSmallestUnit);

    const quotes = await fetchQuote(quoteParams);
    if (!quotes || quotes.length === 0) {
      throw new Error('Mayan fallback: no quotes available');
    }

    // Sort quotes by effective USD received if available
    const bestQuote = quotes
      .sort((a, b) => {
        const receivedA = parseFloat(a.effectiveToAmountInUsd || a.toAmountInUsd || a.toAmount || 0);
        const receivedB = parseFloat(b.effectiveToAmountInUsd || b.toAmountInUsd || b.toAmount || 0);
        return receivedB - receivedA;
      })[0];

    logger.info('Selected Mayan quote', { route: bestQuote.routeName || bestQuote.name || 'unknown', toChain: normalizedToChain });

    const maxRetries = 3;
    let lastError = null;
    let signature = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info('Executing Mayan swap', { attempt });
        const swapResult = await swapFromSolana(
          bestQuote,
          fromAddress,
          toAddress,
          null,
          async (transaction) => {
            transaction.sign([keypair]);
            return transaction;
          },
          connection
        );

        signature = swapResult?.signature || swapResult?.txHash || swapResult;
        if (!signature) {
          throw new Error('Mayan fallback returned invalid response');
        }

        logger.info('Mayan fallback bridge submitted', { signature, attempt });
        break;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        lastError = error;

        if (errorMessage.includes('custom program error: 0x1788') || errorMessage.includes('InsufficientFunds')) {
          const balanceLamports = await connection.getBalance(keypair.publicKey, 'processed');
          logger.error('Mayan swap failed due to insufficient funds', {
            balanceLamports,
            requiredLamports: amountInSmallestUnit,
            error: errorMessage,
          });
          throw new Error('Insufficient SOL for Mayan bridge - add at least 0.02 SOL more for fees and auctions');
        }

        if (errorMessage.includes('Transaction has already been processed, but no signature found')) {
          if (attempt < maxRetries) {
            logger.warn('Mayan swap hit duplicate transaction bug, retrying', { attempt, error: errorMessage });
            await sleep(1000);
            continue;
          }
          logger.error('Mayan swap failed after retries due to duplicate transaction bug', { error: errorMessage });
          throw new Error('Mayan bridge failed: transaction processed but signature missing. Please retry.');
        }

        if (attempt < maxRetries) {
          logger.warn('Mayan swap attempt failed, retrying', { attempt, error: errorMessage });
          await sleep(1000);
          continue;
        }

        logger.error('Mayan swap failed after maximum retries', { error: errorMessage });
        throw error;
      }
    }

    if (!signature) {
      throw lastError || new Error('Mayan bridge failed without a signature');
    }

    return {
      success: true,
      transactionHash: signature,
      bridgeTxId: signature,
      message: `✅ Bridge transaction initiated via Mayan. ${amount} ${token || 'SOL'} bridging from Solana to ${normalizedToChain}. Transaction: ${signature}`,
      estimatedTime: bestQuote?.estimatedTime || '3-5 minutes',
    };
  }

  async bridgeSolanaToEvm(params, keypair, fromChainId, toChainId, normalizedToChain) {
    const { amount, toAddress, token } = params;
    let amountInSmallestUnit;
    let amountNum;

    try {
      const userPublicKey = keypair.publicKey.toString();
      const tokenAddress = this.getTokenAddress('solana', token || 'SOL');
      
      // Convert amount to smallest unit
      if (token === 'SOL' || !token) {
        amountNum = parseFloat(amount);
        
        // Minimum amount check for bridging (0.05 SOL to cover fees and ensure route availability)
        const MIN_SOL_AMOUNT = 0.05; // ~$7-8 USD - test and adjust based on real routes
        if (amountNum < MIN_SOL_AMOUNT) {
          return {
            success: false,
            message: `Amount too small for bridging`,
            error: `Minimum amount for bridging is ${MIN_SOL_AMOUNT} SOL (~$${(MIN_SOL_AMOUNT * 150).toFixed(2)} USD) to cover cross-chain fees and ensure route availability. You requested ${amountNum} SOL. Try increasing to at least ${MIN_SOL_AMOUNT} SOL.`
          };
        }
        
        amountInSmallestUnit = Math.floor(amountNum * LAMPORTS_PER_SOL);
      } else {
        // For SPL tokens, we'd need to get decimals - for now assume 6 decimals for USDC/USDT
        amountNum = parseFloat(amount);
        amountInSmallestUnit = Math.floor(amountNum * 1e6);
      }

      console.log('🌉 Getting bridge quote from Socket/Bungee API...');
      console.log('🔗 Base URL:', this.socketApiUrl);

      // Step 1: Get bridge quote from Socket/Bungee API
      // Bungee Exchange public backend uses: /api/v1/bungee/quote
      // Socket.tech uses: /quote (v2 is in base URL)
      const quoteEndpoint = this.isBungeePublic ? '/api/v1/bungee/quote' : '/quote';
      
      // Bungee API uses different parameter names than Socket API
      let queryParams;
      if (this.isBungeePublic) {
        // Bungee API parameter names - include enableManual=true and optimization params
        queryParams = new URLSearchParams({
          originChainId: fromChainId.toString(),
          destinationChainId: toChainId.toString(),
          inputToken: tokenAddress,
          outputToken: this.getTokenAddress(normalizedToChain, token || 'SOL'),
          inputAmount: amountInSmallestUnit.toString(),
          userAddress: userPublicKey,
          receiverAddress: toAddress,
          enableManual: 'true', // Required for Solana bridges to populate manualRoutes
          sort: 'output', // Maximize received amount
          singleTxOnly: 'false', // Allow multi-hop routes if needed
          refuel: 'false', // No auto-refuel on destination chain
          swapSlippage: '0.5',
          bridgeSlippage: '0.5',
        });
      } else {
        // Socket API parameter names (legacy)
        queryParams = new URLSearchParams({
          fromChainId: fromChainId.toString(),
          toChainId: toChainId.toString(),
          fromTokenAddress: tokenAddress,
          toTokenAddress: this.getTokenAddress(normalizedToChain, token || 'SOL'),
          fromAmount: amountInSmallestUnit.toString(),
          userAddress: userPublicKey,
          recipient: toAddress,
          uniqueRoutesPerBridge: 'true',
          sort: 'output',
          singleTxOnly: 'true',
          swapSlippage: '0.5',
          bridgeSlippage: '0.5',
        });
      }
      const quoteUrl = `${this.socketApiUrl}${quoteEndpoint}?${queryParams.toString()}`;

      // Bungee public backend: NO API key required, NO authentication headers
      // Unconditionally bypass all API key checks for Bungee public backend
      const headers = {}; // Empty headers - no authentication needed

      console.log('📡 Request URL:', quoteUrl);
      console.log('📡 Request headers:', headers);

      const quoteResponse = await fetch(quoteUrl, {
        headers: headers
      });

      if (!quoteResponse.ok) {
        const errorText = await quoteResponse.text();
        console.error('❌ Bridge API quote error:', errorText);
        console.error('❌ Response status:', quoteResponse.status);
        console.error('❌ Response URL:', quoteResponse.url);
        
        if (quoteResponse.status === 401) {
          throw new Error('Bridge API authentication failed. Please set SOCKET_API_KEY in your .env file. Get your free API key at https://docs.socket.tech/socket-api');
        }
        
        throw new Error(`Failed to get bridge quote: ${errorText}`);
      }

      const quote = await quoteResponse.json();
      console.log('✅ Got bridge quote response:', JSON.stringify(quote, null, 2));

      // Check for error messages in response
      if (quote.error || quote.message || (quote.result && quote.result.error)) {
        const errorMsg = quote.error || quote.message || (quote.result && quote.result.error);
        console.error('❌ API returned error:', errorMsg);
        throw new Error(`Bridge API error: ${errorMsg}`);
      }

      // Handle different response formats (Bungee Exchange vs Socket)
      let selectedRoute = null;
      
      // Bungee API response structure: result.autoRoute or result.manualRoutes
      if (quote.result) {
        const result = quote.result;
        
        // First check autoRoute
        if (result.autoRoute) {
          selectedRoute = result.autoRoute;
          console.log('✅ Found autoRoute');
        }
        // If no autoRoute, check manualRoutes (populated when enableManual=true)
        else if (result.manualRoutes && Array.isArray(result.manualRoutes) && result.manualRoutes.length > 0) {
          // Sort routes by effectiveReceivedInUsd (highest first) or estimatedOutput
          const sortedRoutes = result.manualRoutes.sort((a, b) => {
            // Prefer effectiveReceivedInUsd if available
            const receivedA = parseFloat(a.effectiveReceivedInUsd || a.estimatedOutput || a.outputAmount || 0);
            const receivedB = parseFloat(b.effectiveReceivedInUsd || b.estimatedOutput || b.outputAmount || 0);
            return receivedB - receivedA; // Highest received amount first
          });
          selectedRoute = sortedRoutes[0];
          const routeName = selectedRoute.routeDetails?.name || selectedRoute.name || selectedRoute.integrator || 'Mayan';
          const receivedUsd = selectedRoute.effectiveReceivedInUsd ? `$${selectedRoute.effectiveReceivedInUsd.toFixed(2)}` : 'unknown';
          const estimatedTime = selectedRoute.estimatedTime ? `${selectedRoute.estimatedTime}s` : 'unknown';
          console.log(`✅ Found ${result.manualRoutes.length} manual route(s), using best: ${routeName} (Net USD: ${receivedUsd}, Time: ${estimatedTime})`);
        }
        // Check for depositRoute (alternative route format)
        else if (result.depositRoute) {
          selectedRoute = result.depositRoute;
          console.log('✅ Found depositRoute');
        }
        // Legacy: check for routes array
        else if (result.routes && Array.isArray(result.routes) && result.routes.length > 0) {
          selectedRoute = result.routes[0];
          console.log('✅ Found routes array');
        }
        // Legacy: result might be an array
        else if (Array.isArray(result) && result.length > 0) {
          selectedRoute = result[0];
          console.log('✅ Found result array');
        }
      }
      // Fallback: check top-level routes
      else if (quote.routes && Array.isArray(quote.routes) && quote.routes.length > 0) {
        selectedRoute = quote.routes[0];
        console.log('✅ Found top-level routes');
      }
      // Fallback: quote might be an array
      else if (Array.isArray(quote) && quote.length > 0) {
        selectedRoute = quote[0];
        console.log('✅ Found quote array');
      }

      console.log('🔍 Selected route:', selectedRoute ? JSON.stringify(selectedRoute, null, 2) : 'null');
      console.log('🔍 Full response structure:', {
        hasResult: !!quote.result,
        hasAutoRoute: !!(quote.result && quote.result.autoRoute),
        manualRoutesCount: (quote.result && quote.result.manualRoutes) ? quote.result.manualRoutes.length : 0,
        hasRoutes: !!(quote.result && quote.result.routes),
      });

      if (!selectedRoute) {
        const result = quote.result || {};
        const hasAutoRoute = !!result.autoRoute;
        const manualRoutesCount = (result.manualRoutes && Array.isArray(result.manualRoutes)) ? result.manualRoutes.length : 0;
        const hasDepositRoute = !!result.depositRoute;
        
        console.error('❌ No routes in response. Full response:', JSON.stringify(quote, null, 2));
        console.error('❌ Request URL was:', quoteUrl);
        console.error('❌ Request parameters:', {
          originChainId: fromChainId,
          destinationChainId: toChainId,
          inputToken: tokenAddress,
          outputToken: this.getTokenAddress(normalizedToChain, token || 'SOL'),
          inputAmount: amountInSmallestUnit,
          amountSOL: amountNum ? `${amountNum} SOL` : 'unknown',
          enableManual: 'true',
          sort: 'output',
          singleTxOnly: 'false',
          refuel: 'false',
        });
        
        // Provide helpful error message based on what we found
        let errorMessage = 'No bridge routes available for this transaction. ';
        if (hasAutoRoute === false && manualRoutesCount === 0 && !hasDepositRoute) {
          errorMessage += 'Possible reasons:\n';
          errorMessage += `- Amount too small (minimum ~0.05 SOL / ~$7-8 USD to cover fees)\n`;
          errorMessage += '- Route not supported for this token pair\n';
          errorMessage += '- Low liquidity for this specific combination\n';
          errorMessage += `\nYou requested: ${amountNum || 'unknown'} SOL. Try:\n`;
          errorMessage += `1. Increasing amount to at least 0.05 SOL\n`;
          
          // Suggest bridging to USDC if trying native-to-native
          const outputToken = this.getTokenAddress(normalizedToChain, token || 'SOL');
          if (outputToken === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
            errorMessage += `2. Bridging to USDC on ${normalizedToChain} instead (better liquidity for small amounts)\n`;
            if (normalizedToChain === 'bsc') {
              errorMessage += `   Use outputToken: 0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d (USDC on BSC)`;
            }
          }
        }
        
        throw new Error(errorMessage);
      }

      // Step 2: Build bridge transaction
      // Use the selected route (from autoRoute or manualRoutes)
      const route = selectedRoute;
      
      const connection = createConnection();
      const mintCandidates = new Set();
      const addMintCandidate = (candidate) => {
        if (this.isSolanaMintAddress(candidate)) {
          mintCandidates.add(candidate);
        }
      };

      addMintCandidate(tokenAddress);
      addMintCandidate(route?.sourceTokenAddress);
      addMintCandidate(route?.depositTokenAddress);
      addMintCandidate(route?.fromTokenAddress);
      addMintCandidate(route?.inputToken);
      addMintCandidate(route?.routeDetails?.sourceTokenAddress);
      addMintCandidate(route?.routeDetails?.srcTokenAddress);

      const requiredAmountSol = (token === 'SOL' || !token) ? amountNum : 0;
      await this.ensureAtas(connection, keypair, Array.from(mintCandidates), requiredAmountSol);

      if (token === 'SOL' || !token) {
        await this.ensureWsolBalance(connection, keypair, amountInSmallestUnit);
      }

      // Bungee API requires GET request with quoteId as query parameter
      if (this.isBungeePublic) {
        // Extract quoteId from the route
        const quoteId = route.quoteId || route.id;
        if (!quoteId) {
          throw new Error('No quoteId found in route. Cannot build transaction.');
        }
        
        const buildTxUrl = `${this.socketApiUrl}/api/v1/bungee/build-tx?quoteId=${quoteId}`;
        console.log('🔨 Building transaction with quoteId:', quoteId);
        console.log('🔨 Build TX URL:', buildTxUrl);

        // Bungee public backend: NO API key required, GET request
        const buildTxResponse = await fetch(buildTxUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!buildTxResponse.ok) {
          const errorText = await buildTxResponse.text();
          console.error('❌ Build TX error:', errorText);
          throw new Error(`Failed to build bridge transaction: ${errorText}`);
        }

        const buildTxData = await buildTxResponse.json();
        console.log('✅ Bridge transaction built:', JSON.stringify(buildTxData, null, 2));
        
        // For Socket API (legacy)
        if (!buildTxData.result || !buildTxData.result.txData) {
          throw new Error('Invalid transaction data from Bungee Exchange');
        }
        
        // Handle Solana transaction building
        const signature = await this.buildSolanaTransaction(buildTxData.result.txData, keypair, toAddress);
        
        // Step 3: Get bridge status
        const bridgeStatus = await this.getBridgeStatus(signature);

        return {
          success: true,
          transactionHash: signature,
          bridgeTxId: bridgeStatus?.bridgeTxId || signature,
          message: `✅ Bridge transaction initiated! ${amount} ${token || 'SOL'} bridging from Solana to ${normalizedToChain}. Transaction: ${signature}`,
          estimatedTime: route.estimatedTime || '3-5 minutes',
        };
      } else {
        // Socket API uses POST (legacy)
        const buildTxEndpoint = '/build-tx';
        const buildTxUrl = `${this.socketApiUrl}${buildTxEndpoint}`;

        const buildTxHeaders = {
          'Content-Type': 'application/json',
        };
        const apiKey = process.env.SOCKET_API_KEY;
        if (apiKey) {
          buildTxHeaders['X-API-Key'] = apiKey;
        }

        const buildTxResponse = await fetch(buildTxUrl, {
          method: 'POST',
          headers: buildTxHeaders,
          body: JSON.stringify({
            route: route,
            userAddress: userPublicKey,
            recipient: toAddress,
          }),
        });

        if (!buildTxResponse.ok) {
          const errorText = await buildTxResponse.text();
          throw new Error(`Failed to build bridge transaction: ${errorText}`);
        }

        const buildTxData = await buildTxResponse.json();
        console.log('✅ Bridge transaction built');
        
        if (!buildTxData.result || !buildTxData.result.txData) {
          throw new Error('Invalid transaction data from Socket');
        }
        
        // Handle Solana transaction building
        const signature = await this.buildSolanaTransaction(buildTxData.result.txData, keypair, toAddress);
        
        // Step 4: Get bridge status
        const bridgeStatus = await this.getBridgeStatus(signature);

        return {
          success: true,
          transactionHash: signature,
          bridgeTxId: bridgeStatus?.bridgeTxId || signature,
          message: `✅ Bridge transaction initiated! ${amount} ${token || 'SOL'} bridging from Solana to ${normalizedToChain}. Transaction: ${signature}`,
          estimatedTime: route.estimatedTime || '3-5 minutes',
        };
      }

    } catch (error) {
      console.error('❌ Bridge error:', error);
      logger.warn('Bridge via Bungee failed, attempting Mayan fallback', { error: error instanceof Error ? error.message : error });
      try {
        const fallbackAmount = amountInSmallestUnit ?? Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
        return await this.bridgeWithMayan(params, keypair, normalizedToChain, fallbackAmount);
      } catch (fallbackError) {
        console.error('❌ Mayan fallback bridge error:', fallbackError);
        return {
          success: false,
          message: 'Bridge transaction failed',
          error: fallbackError instanceof Error ? fallbackError.message : error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  }

  async getBridgeStatus(txHash) {
    try {
      // Check bridge status via Socket/Bungee API
      const statusEndpoint = this.isBungeePublic ? '/api/v1/bungee/bridge-status' : '/bridge-status';
      const statusUrl = `${this.socketApiUrl}${statusEndpoint}?txHash=${txHash}`;
      
      // Bungee public backend: NO API key required
      const headers = {}; // Empty headers - no authentication needed
      
      const response = await fetch(statusUrl, {
        headers: headers
      });

      if (response.ok) {
        const data = await response.json();
        return data.result;
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch bridge status:', error.message);
    }
    return null;
  }

  isEvmChain(chain) {
    const normalizedChain = this.normalizeChainName(chain);
    const evmChains = ['ethereum', 'base', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'bsc'];
    return evmChains.includes(normalizedChain);
  }

  async getBridgeQuote(params) {
    // Calculate bridge quote based on amount and destination chain
    const { amount, toChain } = params;
    const normalizedToChain = this.normalizeChainName(toChain);
    
    let bridgeFee = 0.0005; // Base fee in SOL
    let estimatedTime = '3-5 minutes';
    
    // Adjust fee based on amount
    if (amount === 'all') {
      bridgeFee = 0.001;
    } else if (amount === 'half') {
      bridgeFee = 0.0007;
    } else if (typeof amount === 'number' && amount > 10) {
      bridgeFee = 0.0008;
    }

    // Adjust time based on destination chain
    if (['ethereum', 'base'].includes(normalizedToChain)) {
      estimatedTime = '3-5 minutes';
    } else if (['polygon', 'avalanche', 'bsc'].includes(normalizedToChain)) {
      estimatedTime = '2-4 minutes';
    } else {
      estimatedTime = '5-10 minutes';
    }

    return {
      estimatedTime,
      bridgeFee: `${bridgeFee} SOL`,
      slippage: '0.5%',
      minimumAmount: '0.001 SOL'
    };
  }
}

// Export singleton instance
export const merlinBridge = new MerlinBridge();

