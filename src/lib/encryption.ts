import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Get encryption key from environment variable or generate a default one
 * IMPORTANT: In production, use a strong secret key stored securely
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || 'merlin-default-secret-change-in-production';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt a string (private key) using AES-256-GCM
 */
export function encrypt(plaintext: string): { encrypted: string; iv: string } {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    const encryptedWithTag = encrypted + tag.toString('hex');

    return {
      encrypted: encryptedWithTag,
      iv: iv.toString('hex')
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt an encrypted string (private key) using AES-256-GCM
 */
export function decrypt(encryptedData: string, iv: string): string {
  try {
    const key = getEncryptionKey();
    const ivBuffer = Buffer.from(iv, 'hex');
    const encryptedBuffer = Buffer.from(encryptedData, 'hex');
    
    // Extract tag (last 32 hex characters = 16 bytes)
    const tag = encryptedBuffer.slice(-TAG_LENGTH);
    const encrypted = encryptedBuffer.slice(0, -TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Validate encryption/decryption is working
 */
export function validateEncryption(): boolean {
  try {
    const testData = 'test-private-key-123';
    const { encrypted, iv } = encrypt(testData);
    const decrypted = decrypt(encrypted, iv);
    return decrypted === testData;
  } catch {
    return false;
  }
}

