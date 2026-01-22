'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, FileText, Loader2, ExternalLink } from 'lucide-react'
import { ChatMessage } from '@/lib/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import DocumentViewer from './document-viewer'

interface ChatInterfaceProps {
  className?: string
}

export default function ChatInterface({ className = '' }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [documentViewer, setDocumentViewer] = useState<{
    isOpen: boolean
    filename: string
  }>({
    isOpen: false,
    filename: ''
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input.trim(),
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setMessages(prev => [...prev, result.message])
      } else {
        throw new Error(result.error || 'Failed to get response')
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
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
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-800">
            Chat with Your Documents
          </h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Ask questions about your uploaded documents
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <div className="text-gray-500 mb-2">
              Start a conversation about your documents
            </div>
            <div className="text-sm text-gray-400">
              Try asking: "What are the main topics covered?" or "Summarize the key points"
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                <div
                  className={`inline-block max-w-3xl px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      className="prose prose-sm max-w-none"
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        code: ({ children }) => (
                          <code className="bg-gray-200 px-1 py-0.5 rounded text-xs">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-gray-800 text-white p-3 rounded mt-2 overflow-x-auto">
                            {children}
                          </pre>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>

                <div
                  className={`text-xs text-gray-400 mt-1 ${
                    message.role === 'user' ? 'text-right' : ''
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs font-medium text-gray-600 mb-2">
                      Sources:
                    </div>
                    {message.sources.map((source, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-lg p-3 text-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className="font-medium text-gray-800">
                              {source.metadata.filename}
                            </span>
                            <span className="text-gray-500">
                              • {source.metadata.section}
                            </span>
                          </div>
                          <button
                            onClick={() => handleSourceClick(source.metadata.filename)}
                            className="flex items-center space-x-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors duration-200"
                            title="View full document"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View</span>
                          </button>
                        </div>
                        <div className="text-gray-600 text-xs">
                          {source.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <Bot className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="inline-block bg-gray-100 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your documents..."
              rows={1}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="text-xs text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewer
        filename={documentViewer.filename}
        isOpen={documentViewer.isOpen}
        onClose={handleCloseViewer}
      />
    </div>
  )
}