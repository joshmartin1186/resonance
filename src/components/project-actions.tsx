'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ProjectActionsProps {
  projectId: string
  status: string
  videoUrl: string | null
}

export function ProjectActions({ projectId, status, videoUrl }: ProjectActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStartGeneration = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start generation')
      }

      // Refresh the page to show updated status
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/cancel`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/projects')
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 bg-[#FEE2E2] text-[#C2410C] rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Primary Action */}
      {status === 'draft' && (
        <Button
          onClick={handleStartGeneration}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Starting...' : 'Start Generation'}
        </Button>
      )}

      {status === 'failed' && (
        <Button
          onClick={handleStartGeneration}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Retrying...' : 'Retry Generation'}
        </Button>
      )}

      {(status === 'queued' || status === 'analyzing' || status === 'generating') && (
        <Button
          onClick={handleCancel}
          disabled={isLoading}
          variant="secondary"
          className="w-full"
        >
          {isLoading ? 'Canceling...' : 'Cancel Generation'}
        </Button>
      )}

      {status === 'completed' && (
        <>
          <Button
            onClick={handleStartGeneration}
            disabled={isLoading}
            variant="secondary"
            className="w-full"
          >
            {isLoading ? 'Regenerating...' : 'Regenerate'}
          </Button>
          {videoUrl && (
            <Link href={videoUrl} target="_blank" className="block">
              <Button variant="secondary" className="w-full">
                Download Video
              </Button>
            </Link>
          )}
        </>
      )}

      {/* Delete - always available */}
      <Button
        onClick={handleDelete}
        disabled={isLoading}
        variant="ghost"
        className="w-full text-[#C2410C] hover:text-[#C2410C] hover:bg-[#FEE2E2]"
      >
        Delete Project
      </Button>
    </div>
  )
}

/**
 * Header actions for the project page
 */
export function ProjectHeaderActions({ projectId, status, videoUrl }: ProjectActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleStartGeneration = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })

      if (response.ok) {
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-3">
      {status === 'draft' && (
        <Button onClick={handleStartGeneration} disabled={isLoading}>
          {isLoading ? 'Starting...' : 'Start Generation'}
        </Button>
      )}
      {status === 'completed' && videoUrl && (
        <Link href={videoUrl} target="_blank">
          <Button>Download Video</Button>
        </Link>
      )}
      {status === 'failed' && (
        <Button onClick={handleStartGeneration} disabled={isLoading}>
          {isLoading ? 'Retrying...' : 'Retry Generation'}
        </Button>
      )}
    </div>
  )
}
