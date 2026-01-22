'use client'

import { useState, useCallback } from 'react'
import { Upload, File, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'

interface UploadResult {
  filename: string
  status: 'uploading' | 'completed' | 'error'
  error?: string
  chunks?: number
}

interface UploadState {
  isDragActive: boolean
  isUploading: boolean
  uploadResults: UploadResult[]
  totalFiles: number
  completedFiles: number
  globalError?: string
}

interface DocumentUploadProps {
  onUploadComplete?: (results: any[]) => void
}

export default function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    isDragActive: false,
    isUploading: false,
    uploadResults: [],
    totalFiles: 0,
    completedFiles: 0,
  })

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setUploadState(prev => ({ ...prev, isDragActive: true }))
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setUploadState(prev => ({ ...prev, isDragActive: false }))
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setUploadState(prev => ({ ...prev, isDragActive: false }))
    
    const files = Array.from(e.dataTransfer.files)
    const markdownFiles = files.filter(file => 
      file.name.endsWith('.md') || file.name.endsWith('.markdown')
    )
    
    if (markdownFiles.length > 0) {
      uploadFiles(markdownFiles)
    } else {
      setUploadState(prev => ({ 
        ...prev, 
        globalError: 'Please upload only Markdown files (.md or .markdown)' 
      }))
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      uploadFiles(files)
    }
  }, [])

  const uploadFiles = async (files: File[]) => {
    const initialResults: UploadResult[] = files.map(file => ({
      filename: file.name,
      status: 'uploading' as const,
    }))

    setUploadState({
      isDragActive: false,
      isUploading: true,
      uploadResults: initialResults,
      totalFiles: files.length,
      completedFiles: 0,
      globalError: undefined,
    })

    const results: any[] = []
    
    // Upload files sequentially to avoid overwhelming the server
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (response.ok && result.success) {
          // Update specific file status
          setUploadState(prev => ({
            ...prev,
            uploadResults: prev.uploadResults.map(item =>
              item.filename === file.name
                ? { ...item, status: 'completed' as const, chunks: result.chunks }
                : item
            ),
            completedFiles: prev.completedFiles + 1,
          }))
          
          results.push(result)
        } else {
          throw new Error(result.error || 'Upload failed')
        }
      } catch (error) {
        // Update specific file status with error
        setUploadState(prev => ({
          ...prev,
          uploadResults: prev.uploadResults.map(item =>
            item.filename === file.name
              ? { 
                  ...item, 
                  status: 'error' as const, 
                  error: error instanceof Error ? error.message : 'Upload failed' 
                }
              : item
          ),
          completedFiles: prev.completedFiles + 1,
        }))
      }
    }

    // Mark upload as complete
    setUploadState(prev => ({ ...prev, isUploading: false }))
    
    // Notify parent component
    if (results.length > 0) {
      onUploadComplete?.(results)
    }

    // Clear results after 5 seconds
    setTimeout(() => {
      setUploadState(prev => ({
        ...prev,
        uploadResults: [],
        totalFiles: 0,
        completedFiles: 0,
      }))
    }, 5000)
  }

  const { isDragActive, isUploading, uploadResults, totalFiles, completedFiles, globalError } = uploadState
  
  const hasResults = uploadResults.length > 0
  const progress = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0
  const hasErrors = uploadResults.some(result => result.status === 'error')
  const successCount = uploadResults.filter(result => result.status === 'completed').length

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200
          ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${globalError ? 'border-red-400 bg-red-50' : ''}
          ${hasResults && !hasErrors ? 'border-green-400 bg-green-50' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".md,.markdown"
          multiple
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center space-y-4">
          {isUploading ? (
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          ) : hasResults && !hasErrors ? (
            <CheckCircle className="w-12 h-12 text-green-500" />
          ) : hasResults && hasErrors ? (
            <AlertCircle className="w-12 h-12 text-yellow-500" />
          ) : globalError ? (
            <XCircle className="w-12 h-12 text-red-500" />
          ) : (
            <Upload className="w-12 h-12 text-gray-400" />
          )}

          {isUploading ? (
            <div className="w-full max-w-md">
              <div className="mb-3">
                <div className="text-sm font-medium text-blue-600">
                  Uploading {totalFiles} document{totalFiles !== 1 ? 's' : ''}...
                </div>
                <div className="text-xs text-gray-500">
                  {completedFiles} of {totalFiles} completed
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : hasResults ? (
            <div className="text-sm font-medium">
              {hasErrors ? (
                <div className="text-yellow-600">
                  {successCount} of {totalFiles} documents uploaded successfully
                </div>
              ) : (
                <div className="text-green-600">
                  Successfully uploaded {successCount} document{successCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          ) : globalError ? (
            <div className="text-sm text-red-600 font-medium">
              {globalError}
            </div>
          ) : (
            <div>
              <div className="text-xl font-semibold text-gray-700 mb-2">
                Upload Markdown Documents
              </div>
              <div className="text-gray-500 text-sm">
                Drag and drop your .md or .markdown files here, or click to select multiple files
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Maximum file size: 5MB each • Multiple files supported
              </div>
            </div>
          )}

          {!isUploading && !hasResults && !globalError && (
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <File className="w-4 h-4" />
              <span>Supported formats: .md, .markdown</span>
            </div>
          )}
        </div>
      </div>

      {/* Upload Results */}
      {hasResults && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Upload Results:</h3>
          <div className="space-y-2">
            {uploadResults.map((result, index) => (
              <div
                key={index}
                className={`
                  flex items-center justify-between p-3 rounded-lg border text-sm
                  ${result.status === 'completed' ? 'bg-green-50 border-green-200' :
                    result.status === 'error' ? 'bg-red-50 border-red-200' :
                    'bg-gray-50 border-gray-200'}
                `}
              >
                <div className="flex items-center space-x-3">
                  {result.status === 'uploading' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  ) : result.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="font-medium">{result.filename}</span>
                </div>
                
                <div className="text-xs text-gray-500">
                  {result.status === 'completed' && result.chunks && (
                    <span>{result.chunks} chunk{result.chunks !== 1 ? 's' : ''}</span>
                  )}
                  {result.status === 'error' && result.error && (
                    <span className="text-red-600">{result.error}</span>
                  )}
                  {result.status === 'uploading' && (
                    <span>Processing...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}