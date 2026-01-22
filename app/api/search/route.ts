import { NextRequest, NextResponse } from 'next/server'
import { chromaClient } from '@/lib/chroma'

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 5 } = await request.json()
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const collectionName = 'docs_global'
    
    try {
      const searchResults = await chromaClient.searchDocuments({
        collectionName,
        queryText: query.trim(),
        nResults: Math.min(limit, 20), // Cap at 20 results
      })

      const results = searchResults.documents.map((doc: string, index: number) => ({
        id: searchResults.ids[index],
        content: doc,
        metadata: {
          filename: searchResults.metadatas[index]?.filename || 'Unknown',
          section: searchResults.metadatas[index]?.section || 'Unknown',
          headers: searchResults.metadatas[index]?.headers || [],
        },
        distance: searchResults.distances[index] || 1,
      }))

      return NextResponse.json({
        success: true,
        results,
        query: query.trim(),
        totalResults: results.length,
      })

    } catch (error) {
      // Collection might not exist or be empty
      return NextResponse.json({
        success: true,
        results: [],
        query: query.trim(),
        totalResults: 0,
      })
    }

  } catch (error) {
    console.error('Error performing search:', error)
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    )
  }
}