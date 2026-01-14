'use client'

import { useState, useEffect } from 'react'
import { Key, ExternalLink, Check, X, AlertCircle, Loader2, Trash2, Eye, EyeOff } from 'lucide-react'
import { API_PROVIDERS, type ApiProvider, type ApiKeyDisplay } from '@/lib/types/api-keys'

export function ApiKeysSettings() {
  const [keys, setKeys] = useState<ApiKeyDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<ApiProvider | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state for each provider
  const [formState, setFormState] = useState<Record<ApiProvider, { value: string; visible: boolean }>>({
    anthropic: { value: '', visible: false },
    openai: { value: '', visible: false },
    replicate: { value: '', visible: false },
    stability: { value: '', visible: false }
  })

  // Fetch existing keys
  useEffect(() => {
    fetchKeys()
  }, [])

  async function fetchKeys() {
    try {
      const res = await fetch('/api/keys')
      const data = await res.json()
      if (data.keys) {
        setKeys(data.keys)
      }
    } catch (err) {
      console.error('Failed to fetch keys:', err)
    } finally {
      setLoading(false)
    }
  }

  async function saveKey(provider: ApiProvider) {
    const apiKey = formState[provider].value
    if (!apiKey) return

    setSaving(provider)
    setError(null)

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, api_key: apiKey })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to save key')
        return
      }

      // Update local state
      setKeys(prev => {
        const existing = prev.findIndex(k => k.provider === provider)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = data.key
          return updated
        }
        return [...prev, data.key]
      })

      // Clear form
      setFormState(prev => ({
        ...prev,
        [provider]: { value: '', visible: false }
      }))
    } catch (err) {
      setError('Failed to save API key')
    } finally {
      setSaving(null)
    }
  }

  async function deleteKey(provider: ApiProvider) {
    if (!confirm(`Remove ${API_PROVIDERS[provider].name} API key?`)) return

    try {
      const res = await fetch(`/api/keys?provider=${provider}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setKeys(prev => prev.filter(k => k.provider !== provider))
      }
    } catch (err) {
      console.error('Failed to delete key:', err)
    }
  }

  function getExistingKey(provider: ApiProvider): ApiKeyDisplay | undefined {
    return keys.find(k => k.provider === provider)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">API Keys</h3>
        <p className="text-sm text-muted-foreground">
          Add your own API keys to enable AI-powered features. Keys are encrypted and stored securely.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        {(Object.keys(API_PROVIDERS) as ApiProvider[]).map(provider => {
          const config = API_PROVIDERS[provider]
          const existingKey = getExistingKey(provider)
          const form = formState[provider]

          return (
            <div
              key={provider}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">{config.name}</h4>
                    {existingKey && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                        existingKey.is_valid
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {existingKey.is_valid ? (
                          <>
                            <Check className="h-3 w-3" /> Connected
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3" /> Invalid
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {config.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {config.required_for.map(feature => (
                      <span
                        key={feature}
                        className="px-2 py-0.5 bg-muted rounded text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <a
                  href={config.docs_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Get key <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {existingKey ? (
                <div className="flex items-center gap-3 pt-2 border-t">
                  <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono">
                    ••••••••••••••••{existingKey.key_hint}
                  </code>
                  <button
                    onClick={() => deleteKey(provider)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <div className="relative flex-1">
                    <input
                      type={form.visible ? 'text' : 'password'}
                      value={form.value}
                      onChange={(e) => setFormState(prev => ({
                        ...prev,
                        [provider]: { ...prev[provider], value: e.target.value }
                      }))}
                      placeholder={`Paste your ${config.name} API key`}
                      className="w-full px-3 py-2 border rounded-lg text-sm font-mono pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setFormState(prev => ({
                        ...prev,
                        [provider]: { ...prev[provider], visible: !prev[provider].visible }
                      }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    >
                      {form.visible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => saveKey(provider)}
                    disabled={!form.value || saving === provider}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving === provider ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Important</p>
            <p className="mt-1">
              API keys are billed directly to your account with each provider.
              Resonance does not charge for AI usage - you pay the providers directly
              based on your usage.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
