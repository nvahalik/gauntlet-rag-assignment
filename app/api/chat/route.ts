import { NextRequest, NextResponse } from 'next/server'
import { chromaClient } from '@/lib/chroma'
import { generateChatResponse } from '@/lib/openai'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const { message, messages = [] } = await request.json()
    
    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const collectionName = 'docs_global'
    
    // Search for relevant context
    let context = ''
    let sources: any[] = []
    
    try {
      const searchResults = await chromaClient.searchDocuments({
        collectionName,
        queryText: message.trim(),
        nResults: 5,
      })

      if (searchResults.documents.length > 0) {
        // Build context from search results
        context = searchResults.documents
          .map((doc: string, index: number) => {
            const metadata = searchResults.metadatas[index]
            return `Source: ${metadata?.filename} - ${metadata?.section}\n${doc}\n---`
          })
          .join('\n\n')

        // Build sources array
        sources = searchResults.documents.map((doc: string, index: number) => ({
          id: searchResults.ids[index],
          content: doc.substring(0, 200) + (doc.length > 200 ? '...' : ''),
          metadata: {
            filename: searchResults.metadatas[index]?.filename || 'Unknown',
            section: searchResults.metadatas[index]?.section || 'Unknown',
            headers: searchResults.metadatas[index]?.headers || [],
          },
          distance: searchResults.distances[index] || 1,
        }))
      }
    } catch (error) {
      console.warn('No documents found for context:', error)
    }

    // Prepare messages for OpenAI
    const chatMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }))

    // Add the current user message
    chatMessages.push({
      role: 'user',
      content: message.trim(),
    })

    // Generate response using OpenAI
    const response = await generateChatResponse({
      messages: chatMessages,
      context,
    })

    const assistantMessage = {
      id: uuidv4(),
      role: 'assistant' as const,
      content: response,
      timestamp: new Date().toISOString(),
      sources: sources.length > 0 ? sources : undefined,
    }

    return NextResponse.json({
      success: true,
      message: assistantMessage,
    })

  } catch (error) {
    console.error('Error in chat endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}