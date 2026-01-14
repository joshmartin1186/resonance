'use client'

import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FileUploadProps {
  bucket: 'audio-uploads' | 'footage-uploads'
  accept: string
  maxSize: number // in MB
  multiple?: boolean
  onUpload: (urls: string[]) => void
  onError?: (error: string) => void
  label?: string
  description?: string
}

interface UploadedFile {
  name: string
  url: string
  size: number
}

export function FileUpload({
  bucket,
  accept,
  maxSize,
  multiple = false,
  onUpload,
  onError,
  label = 'Upload files',
  description = 'Drag and drop or click to browse'
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File "${file.name}" exceeds ${maxSize}MB limit`
    }

    // Check file type
    const acceptedTypes = accept.split(',').map(t => t.trim())
    const fileType = file.type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    const isValidType = acceptedTypes.some(accepted => {
      if (accepted.startsWith('.')) {
        return fileExtension === accepted.toLowerCase()
      }
      if (accepted.endsWith('/*')) {
        return fileType.startsWith(accepted.replace('/*', '/'))
      }
      return fileType === accepted
    })

    if (!isValidType) {
      return `File "${file.name}" is not a supported format`
    }

    return null
  }

  const uploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)

    // Validate all files first
    for (const file of fileArray) {
      const error = validateFile(file)
      if (error) {
        onError?.(error)
        return
      }
    }

    setIsUploading(true)
    setProgress(0)

    const supabase = createClient()
    const newUrls: string[] = []
    const newFiles: UploadedFile[] = []

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i]
        const timestamp = Date.now()
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filePath = `${timestamp}-${sanitizedName}`

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          throw new Error(`Failed to upload ${file.name}: ${error.message}`)
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path)

        newUrls.push(urlData.publicUrl)
        newFiles.push({
          name: file.name,
          url: urlData.publicUrl,
          size: file.size
        })

        // Update progress
        setProgress(Math.round(((i + 1) / fileArray.length) * 100))
      }

      if (multiple) {
        setUploadedFiles(prev => [...prev, ...newFiles])
        onUpload([...uploadedFiles.map(f => f.url), ...newUrls])
      } else {
        setUploadedFiles(newFiles)
        onUpload(newUrls)
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      setProgress(0)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files)
    }
  }, [])

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files)
    }
  }

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)
    onUpload(newFiles.map(f => f.url))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging
            ? 'border-[#C45D3A] bg-[#C45D3A]/5'
            : 'border-[#E2E0DB] hover:border-[#C45D3A] hover:bg-[#F0EDE8]'
          }
          ${isUploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#E2E0DB] border-t-[#C45D3A] animate-spin" />
            <p className="text-[#5A534C]">Uploading... {progress}%</p>
            <div className="w-full max-w-xs mx-auto h-2 bg-[#E2E0DB] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C45D3A] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#F0EDE8] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#5A534C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-[#2A2621] font-medium">{label}</p>
            <p className="text-sm text-[#8A827A] mt-1">{description}</p>
            <p className="text-xs text-[#8A827A] mt-2">Max file size: {maxSize}MB</p>
          </>
        )}
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-[#F0EDE8] rounded-lg"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded bg-white flex items-center justify-center flex-shrink-0">
                  {bucket === 'audio-uploads' ? (
                    <svg className="w-5 h-5 text-[#C45D3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-[#C45D3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#2A2621] truncate">{file.name}</p>
                  <p className="text-xs text-[#8A827A]">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(index)
                }}
                className="p-2 hover:bg-white rounded-full transition-colors"
              >
                <svg className="w-4 h-4 text-[#5A534C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
