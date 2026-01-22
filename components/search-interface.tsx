'use client'

import { useState } from 'react'
import { Search, FileText, ExternalLink } from 'lucide-react'
import { SearchResult } from '@/lib/types'
import DocumentViewer from './document-viewer'

interface SearchInterfaceProps {
  className?: string
}

export default function SearchInterface({ className = '' }: SearchInterfaceProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [documentViewer, setDocumentViewer] = useState<{
    isOpen: boolean
    filename: string
  }>({
    isOpen: false,
    filename: ''
  })

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim()) return

    setIsSearching(true)
    setError(null)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim(), limit: 10 }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setResults(result.results)
      } else {
        throw new Error(result.error || 'Search failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  const handleSourceClick = (filename: string) => {
    setDocumentViewer({
      isOpen: true,
      filename: filename
    })
  }

  const handleCloseViewer = () => {
    setDocumentViewer({
      isOpen: false,
      filename: ''
    })
  }

  return (
    <div className={`w-full ${className}`}>
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search through your documents..."
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSearching}
          />
        </div>
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="mt-3 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium">Search Error</div>
          <div className="text-red-600 text-sm mt-1">{error}</div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Search Results
            </h3>
            <span className="text-sm text-gray-500">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </span>
          </div>

          {results.map((result, index) => (
            <div
              key={result.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-gray-900">
                    {result.metadata.filename}
                  </span>
                  {result.metadata.section !== 'Unknown' && (
                    <span className="text-sm text-gray-500">
                      • {result.metadata.section}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <span>
                    Relevance: {Math.round((1 - result.distance) * 100)}%
                  </span>
                </div>
              </div>

              {result.metadata.headers && result.metadata.headers.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {result.metadata.headers.map((header, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {header}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-gray-700 text-sm leading-relaxed">
                {highlightText(
                  result.content.length > 300 
                    ? result.content.substring(0, 300) + '...' 
                    : result.content,
                  query
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <button 
                  onClick={() => handleSourceClick(result.metadata.filename)}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View full document
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && query && !isSearching && !error && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <div className="text-gray-500">
            No results found for "{query}". Try different keywords or check your uploaded documents.
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewer
        filename={documentViewer.filename}
        isOpen={documentViewer.isOpen}
        onClose={handleCloseViewer}
      />
    </div>
  )
}