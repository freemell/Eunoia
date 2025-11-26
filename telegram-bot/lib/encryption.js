import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey() {
  const secret = process.env.ENCRYPTION_SECRET || 'merlin-default-secret-change-in-production';
  return crypto.createHash('sha256').update(secret).digest();
}

export function encrypt(plaintext) {
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

export function decrypt(encryptedData, iv) {
  try {
    const key = getEncryptionKey();
    const ivBuffer = Buffer.from(iv, 'hex');
    const encryptedBuffer = Buffer.from(encryptedData, 'hex');
    
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



