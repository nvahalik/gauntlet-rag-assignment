'use client'

import { useState, useEffect } from 'react'
import { File, Calendar, Hash, FileText, Loader2, Trash2 } from 'lucide-react'
import { Document } from '@/lib/types'

interface DocumentListProps {
  refreshTrigger?: number
  onClearComplete?: () => void
}

export default function DocumentList({ refreshTrigger, onClearComplete }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isClearing, setIsClearing] = useState(false)

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/documents/list')
      const result = await response.json()

      if (response.ok && result.success) {
        setDocuments(result.documents)
      } else {
        throw new Error(result.error || 'Failed to fetch documents')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [refreshTrigger])

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all documents? This action cannot be undone.')) {
      return
    }

    try {
      setIsClearing(true)
      
      const response = await fetch('/api/documents/clear', {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        setDocuments([])
        onClearComplete?.()
      } else {
        throw new Error(result.error || 'Failed to clear documents')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear documents')
    } finally {
      setIsClearing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading documents...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium">Error loading documents</div>
          <div className="text-red-600 text-sm mt-1">{error}</div>
        </div>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center py-12">
          <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No documents uploaded yet
          </h3>
          <p className="text-gray-500">
            Upload your first Markdown document to get started with search and chat.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-800">
            Uploaded Documents
          </h2>
          {documents.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={isClearing}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isClearing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>{isClearing ? 'Clearing...' : 'Clear All'}</span>
            </button>
          )}
        </div>
        <p className="text-gray-600 text-sm">
          {documents.length} document{documents.length !== 1 ? 's' : ''} available for search and chat
        </p>
      </div>

      <div className="space-y-4">
        {documents.map((document) => (
          <div
            key={document.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0">
                  <File className="w-8 h-8 text-blue-500" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {document.filename}
                    </h3>
                    <div className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${document.status === 'completed' ? 'bg-green-100 text-green-800' :
                        document.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}
                    `}>
                      {document.status}
                    </div>
                  </div>

                  {document.metadata.title && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Title:</span> {document.metadata.title}
                    </div>
                  )}

                  {document.metadata.description && (
                    <div className="text-sm text-gray-600 mb-3">
                      {document.metadata.description}
                    </div>
                  )}

                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(document.uploadedAt)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="w-4 h-4" />
                      <span>{document.metadata.wordCount.toLocaleString()} words</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Hash className="w-4 h-4" />
                      <span>{document.metadata.chunkCount} chunks</span>
                    </div>
                  </div>

                  {document.error && (
                    <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
                      {document.error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}