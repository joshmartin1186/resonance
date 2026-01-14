// API Key Encryption Utilities (Worker Copy)
// Uses AES-256-GCM for symmetric encryption
import { createDecipheriv, scryptSync, createHash } from 'crypto';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
/**
 * Derive encryption key from password using scrypt
 */
function deriveKey(password, salt) {
    return scryptSync(password, salt, KEY_LENGTH);
}
/**
 * Decrypt an API key
 */
export function decryptApiKey(encryptedData, encryptionSecret) {
    const combined = Buffer.from(encryptedData, 'base64');
    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const key = deriveKey(encryptionSecret, salt);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
}
/**
 * Get encryption secret from environment
 */
export function getEncryptionSecret() {
    const secret = process.env.API_KEY_ENCRYPTION_SECRET;
    if (secret && secret.length >= 32) {
        return secret;
    }
    // Fallback: derive from service key
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        throw new Error('No encryption secret available. Set API_KEY_ENCRYPTION_SECRET env var.');
    }
    return createHash('sha256').update(serviceKey).digest('hex').slice(0, 32);
}
//# sourceMappingURL=encryption.js.map