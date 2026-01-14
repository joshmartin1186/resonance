import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encryptApiKey, getEncryptionSecret } from '@/lib/encryption'
import { validateApiKeyFormat, getKeyHint, type ApiProvider } from '@/lib/types/api-keys'

// GET /api/keys - List all API keys for the organization
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's organization
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 })
  }

  // Fetch keys (encrypted_key excluded from response)
  const { data: keys, error } = await supabase
    .from('user_api_keys')
    .select('id, provider, key_hint, is_valid, last_used_at, last_error, created_at')
    .eq('organization_id', userData.organization_id)
    .order('provider')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ keys })
}

// POST /api/keys - Add or update an API key
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's organization and role
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 })
  }

  // Check permission
  if (!['owner', 'admin'].includes(userData.role)) {
    return NextResponse.json({ error: 'Only admins can manage API keys' }, { status: 403 })
  }

  const body = await request.json()
  const { provider, api_key } = body as { provider: ApiProvider; api_key: string }

  // Validate provider
  const validProviders: ApiProvider[] = ['anthropic', 'openai', 'replicate', 'stability']
  if (!validProviders.includes(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
  }

  // Validate key format
  if (!api_key || api_key.length < 20) {
    return NextResponse.json({ error: 'Invalid API key format' }, { status: 400 })
  }

  if (!validateApiKeyFormat(provider, api_key)) {
    return NextResponse.json({
      error: `Invalid ${provider} API key format`
    }, { status: 400 })
  }

  try {
    // Encrypt the key
    const encryptionSecret = getEncryptionSecret()
    const encryptedKey = encryptApiKey(api_key, encryptionSecret)
    const keyHint = getKeyHint(api_key)

    // Upsert the key
    const { data, error } = await supabase
      .from('user_api_keys')
      .upsert({
        organization_id: userData.organization_id,
        provider,
        encrypted_key: encryptedKey,
        key_hint: keyHint,
        is_valid: true,
        last_error: null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id,provider'
      })
      .select('id, provider, key_hint, is_valid, created_at')
      .single()

    if (error) {
      console.error('Error saving API key:', error)
      return NextResponse.json({ error: 'Failed to save API key' }, { status: 500 })
    }

    return NextResponse.json({ key: data })
  } catch (err) {
    console.error('Encryption error:', err)
    return NextResponse.json({ error: 'Failed to encrypt API key' }, { status: 500 })
  }
}

// DELETE /api/keys - Remove an API key
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's organization and role
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 })
  }

  if (!['owner', 'admin'].includes(userData.role)) {
    return NextResponse.json({ error: 'Only admins can manage API keys' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const provider = searchParams.get('provider') as ApiProvider

  if (!provider) {
    return NextResponse.json({ error: 'Provider required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('user_api_keys')
    .delete()
    .eq('organization_id', userData.organization_id)
    .eq('provider', provider)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
