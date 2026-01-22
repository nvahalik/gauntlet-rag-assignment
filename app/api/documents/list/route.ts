import { NextRequest, NextResponse } from 'next/server'
import { chromaClient } from '@/lib/chroma'

export async function GET(request: NextRequest) {
  try {
    const collectionName = 'docs_global'
    
    try {
      const collection = await chromaClient.getOrCreateCollection({
        collectionName
      })
      const results = await collection.get()
      
      // Group by document
      const documentsMap = new Map()
      
      if (results.metadatas) {
        results.metadatas.forEach((metadata: any, index: number) => {
          const docId = metadata.documentId
          if (!documentsMap.has(docId)) {
            documentsMap.set(docId, {
              id: docId,
              filename: metadata.filename,
              uploadedAt: metadata.uploadedAt,
              status: 'completed',
              metadata: {
                wordCount: 0,
                chunkCount: 0,
              }
            })
          }
          
          const doc = documentsMap.get(docId)
          doc.metadata.wordCount += metadata.wordCount || 0
          doc.metadata.chunkCount += 1
        })
      }

      const documents = Array.from(documentsMap.values())
      
      return NextResponse.json({
        success: true,
        documents: documents.sort((a, b) => 
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        ),
      })

    } catch (error) {
      // Collection doesn't exist yet
      return NextResponse.json({
        success: true,
        documents: [],
      })
    }

  } catch (error) {
    console.error('Error listing documents:', error)
    return NextResponse.json(
      { error: 'Failed to list documents' },
      { status: 500 }
    )
  }
}