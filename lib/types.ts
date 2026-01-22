export interface User {
  id: string
  email: string
  name: string
  image?: string
}

export interface Document {
  id: string
  filename: string
  uploadedAt: string
  status: 'processing' | 'completed' | 'error'
  error?: string
  metadata: {
    title?: string
    description?: string
    wordCount: number
    chunkCount: number
  }
}

export interface DocumentChunk {
  id: string
  content: string
  metadata: {
    filename: string
    chunkIndex: number
    headers: string[]
    section: string
    wordCount: number
  }
}

export interface SearchResult {
  id: string
  content: string
  metadata: {
    filename: string
    section: string
    headers: string[]
  }
  distance: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  sources?: SearchResult[]
}

export interface ChatSession {
  id: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface UploadResponse {
  success: boolean
  documentId?: string
  error?: string
}

export interface SearchResponse {
  results: SearchResult[]
  query: string
  totalResults: number
}

export interface ChatResponse {
  message: ChatMessage
  success: boolean
  error?: string
}