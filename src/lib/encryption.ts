// API Key Encryption Utilities
// Uses AES-256-GCM for symmetric encryption

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 32
const TAG_LENGTH = 16
const KEY_LENGTH = 32

/**
 * Derive encryption key from password using scrypt
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, KEY_LENGTH)
}

/**
 * Encrypt an API key
 * Returns: salt:iv:tag:encrypted (base64 encoded)
 */
export function encryptApiKey(apiKey: string, encryptionSecret: string): string {
  const salt = randomBytes(SALT_LENGTH)
  const iv = randomBytes(IV_LENGTH)
  const key = deriveKey(encryptionSecret, salt)

  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(apiKey, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  const tag = cipher.getAuthTag()

  // Combine: salt + iv + tag + encrypted
  const combined = Buffer.concat([
    salt,
    iv,
    tag,
    Buffer.from(encrypted, 'base64')
  ])

  return combined.toString('base64')
}

/**
 * Decrypt an API key
 */
export function decryptApiKey(encryptedData: string, encryptionSecret: string): string {
  const combined = Buffer.from(encryptedData, 'base64')

  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH)
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
  const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)

  const key = deriveKey(encryptionSecret, salt)

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(encrypted)
  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString('utf8')
}

/**
 * Get encryption secret from environment
 * Falls back to a derived key from SUPABASE_SERVICE_KEY if not set
 */
export function getEncryptionSecret(): string {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET

  if (secret && secret.length >= 32) {
    return secret
  }

  // Fallback: derive from service key (not ideal but works)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

  if (!serviceKey) {
    throw new Error('No encryption secret available. Set API_KEY_ENCRYPTION_SECRET env var.')
  }

  // Use first 32 chars of service key hash as fallback
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(serviceKey).digest('hex').slice(0, 32)
}
