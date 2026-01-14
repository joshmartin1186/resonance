// User API Keys Types

export type ApiProvider = 'anthropic' | 'openai' | 'replicate' | 'stability'

export interface UserApiKey {
  id: string
  organization_id: string
  provider: ApiProvider
  encrypted_key: string
  key_hint: string | null
  is_valid: boolean
  last_used_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

// For display (never expose the actual key)
export interface ApiKeyDisplay {
  id: string
  provider: ApiProvider
  key_hint: string | null
  is_valid: boolean
  last_used_at: string | null
  created_at: string
}

// For creating/updating keys
export interface ApiKeyInput {
  provider: ApiProvider
  api_key: string // Plain text, will be encrypted
}

// Provider metadata
export const API_PROVIDERS: Record<ApiProvider, {
  name: string
  description: string
  docs_url: string
  key_prefix: string
  required_for: string[]
}> = {
  anthropic: {
    name: 'Anthropic (Claude)',
    description: 'Powers AI-driven visual planning and creative direction',
    docs_url: 'https://console.anthropic.com/settings/keys',
    key_prefix: 'sk-ant-',
    required_for: ['AI Visual Planning', 'Creative Direction']
  },
  openai: {
    name: 'OpenAI',
    description: 'Alternative AI provider for visual planning',
    docs_url: 'https://platform.openai.com/api-keys',
    key_prefix: 'sk-',
    required_for: ['AI Visual Planning (Alternative)']
  },
  replicate: {
    name: 'Replicate',
    description: 'AI model hosting for image/video generation',
    docs_url: 'https://replicate.com/account/api-tokens',
    key_prefix: 'r8_',
    required_for: ['AI Image Generation', 'Style Transfer']
  },
  stability: {
    name: 'Stability AI',
    description: 'Stable Diffusion for generative visuals',
    docs_url: 'https://platform.stability.ai/account/keys',
    key_prefix: 'sk-',
    required_for: ['Generative Backgrounds', 'AI Art']
  }
}

// Validate key format
export function validateApiKeyFormat(provider: ApiProvider, key: string): boolean {
  const config = API_PROVIDERS[provider]

  // Basic validation
  if (!key || key.length < 20) return false

  // Check prefix for known providers
  if (provider === 'anthropic' && !key.startsWith('sk-ant-')) return false
  if (provider === 'replicate' && !key.startsWith('r8_')) return false

  return true
}

// Get key hint (last 4 chars)
export function getKeyHint(key: string): string {
  if (key.length < 4) return '****'
  return `...${key.slice(-4)}`
}
