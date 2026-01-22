import { NextRequest, NextResponse } from 'next/server'
import { documentProcessor } from '@/lib/document-processor'
import { chromaClient } from '@/lib/chroma'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
      return NextResponse.json({ error: 'Only Markdown files are supported' }, { status: 400 })
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    const content = await file.text()
    
    // Validate markdown content
    const validation = documentProcessor.validateMarkdown(content)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Process the document
    const processed = documentProcessor.processMarkdown(content, file.name)
    const documentId = uuidv4()
    
    // Extract metadata
    const metadata = documentProcessor.extractMetadata(content)

    // Store chunks in ChromaDB
    const collectionName = 'docs_global'
    
    const documents = processed.chunks.map(chunk => chunk.content)
    const metadatas = processed.chunks.map(chunk => ({
      ...chunk.metadata,
      documentId,
      uploadedAt: new Date().toISOString(),
    }))
    const ids = processed.chunks.map(chunk => chunk.id)

    await chromaClient.addDocuments({
      collectionName,
      documents,
      metadatas,
      ids,
    })

    // Return success response
    return NextResponse.json({
      success: true,
      documentId,
      filename: file.name,
      chunks: processed.totalChunks,
      metadata,
    })

  } catch (error) {
    console.error('Error processing document upload:', error)
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    )
  }
}