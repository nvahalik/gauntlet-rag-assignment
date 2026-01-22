import { v4 as uuidv4 } from 'uuid'

export interface DocumentChunk {
  id: string
  content: string
  metadata: {
    filename: string
    chunkIndex: number
    // headers: string[]
    section: string
    wordCount: number
  }
}

export interface ProcessedDocument {
  filename: string
  chunks: DocumentChunk[]
  totalChunks: number
}

export class DocumentProcessor {
  private readonly maxChunkSize = 1000 // words
  private readonly overlapSize = 100 // words

  processMarkdown(content: string, filename: string): ProcessedDocument {
    const chunks = this.chunkMarkdown(content, filename)
    
    return {
      filename,
      chunks,
      totalChunks: chunks.length,
    }
  }

  private createSingleChunk(content: string, filename: string): DocumentChunk {
    const wordCount = content.split(/\s+/).length
    const metadata = this.extractMetadata(content)

    return {
      id: uuidv4(),
      content: content.trim(),
      metadata: {
        filename,
        chunkIndex: 0,
        section: metadata.title || 'Full Document',
        wordCount,
      },
    }
  }

  private  chunkMarkdown(content: string, filename: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = []
    const sections = this.splitBySections(content)
    
    let chunkIndex = 0
    
    for (const section of sections) {
      const sectionChunks = this.chunkSection(section, filename, chunkIndex)
      chunks.push(...sectionChunks)
      chunkIndex += sectionChunks.length
    }
    
    return chunks
  }

  private splitBySections(content: string): Array<{
    headers: string[]
    content: string
    section: string
  }> {
    const lines = content.split('\n')
    const sections: Array<{
      headers: string[]
      content: string
      section: string
    }> = []
    
    let currentHeaders: string[] = []
    let currentContent: string[] = []
    let currentSection = 'Introduction'
    
    for (const line of lines) {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/)
      
      if (headerMatch) {
        // Save previous section if it has content
        if (currentContent.length > 0) {
          sections.push({
            headers: [...currentHeaders],
            content: currentContent.join('\n').trim(),
            section: currentSection,
          })
          currentContent = []
        }
        
        const level = headerMatch[1].length
        const headerText = headerMatch[2]
        
        // Update headers based on hierarchy
        currentHeaders = currentHeaders.slice(0, level - 1)
        currentHeaders[level - 1] = headerText
        currentSection = headerText
        
        // Include the header in the content
        currentContent.push(line)
      } else {
        currentContent.push(line)
      }
    }
    
    // Add the last section
    if (currentContent.length > 0) {
      sections.push({
        headers: [...currentHeaders],
        content: currentContent.join('\n').trim(),
        section: currentSection,
      })
    }
    
    return sections.filter(section => section.content.trim().length > 0)
  }

  private chunkSection(
    section: {
      headers: string[]
      content: string
      section: string
    },
    filename: string,
    startIndex: number
  ): DocumentChunk[] {
    const words = section.content.split(/\s+/)
    const chunks: DocumentChunk[] = []
    
    if (words.length <= this.maxChunkSize) {
      // Section fits in one chunk
      chunks.push({
        id: uuidv4(),
        content: section.content,
        metadata: {
          filename,
          chunkIndex: startIndex,
          section: section.section,
          wordCount: words.length,
        },
      })
    } else {
      // Split section into multiple chunks with overlap
      let start = 0
      let chunkIndex = startIndex
      
      while (start < words.length) {
        const end = Math.min(start + this.maxChunkSize, words.length)
        const chunkWords = words.slice(start, end)
        const chunkContent = chunkWords.join(' ')
        
        chunks.push({
          id: uuidv4(),
          content: chunkContent,
          metadata: {
            filename,
            chunkIndex,
            headers: section.headers,
            section: section.section,
            wordCount: chunkWords.length,
          },
        })
        
        // Move start position, accounting for overlap
        start = end - this.overlapSize
        chunkIndex++
        
        // Ensure we don't have negative start
        if (start < 0) start = 0
        
        // Break if we're at the end
        if (end >= words.length) break
      }
    }
    
    return chunks
  }

  extractMetadata(content: string): {
    title?: string
    description?: string
    tags?: string[]
    wordCount: number
  } {
    const lines = content.split('\n')
    const wordCount = content.split(/\s+/).length
    
    // Look for title (first # header)
    let title: string | undefined
    const titleMatch = lines.find(line => line.match(/^#\s+(.+)$/))
    if (titleMatch) {
      title = titleMatch.replace(/^#\s+/, '')
    }
    
    // Look for description (first paragraph after title)
    let description: string | undefined
    const firstParagraph = lines.find(line => 
      line.trim().length > 0 && 
      !line.startsWith('#') && 
      !line.startsWith('```') &&
      !line.startsWith('---')
    )
    if (firstParagraph && firstParagraph.length > 20) {
      description = firstParagraph.substring(0, 200) + (firstParagraph.length > 200 ? '...' : '')
    }
    
    return {
      title,
      description,
      wordCount,
    }
  }

  validateMarkdown(content: string): { isValid: boolean; error?: string } {
    if (!content || content.trim().length === 0) {
      return { isValid: false, error: 'Content is empty' }
    }
    
    if (content.length > 1000000) { // 1MB limit
      return { isValid: false, error: 'File is too large (max 1MB)' }
    }
    
    // Basic validation - check for common markdown patterns
    const hasMarkdownFeatures = /^#{1,6}\s+|\*\*|\*|`|```|\[.*\]\(.*\)|^-\s+|^\d+\.\s+/m.test(content)
    
    if (!hasMarkdownFeatures) {
      // Allow plain text files
      console.warn('File may not be markdown, but processing as plain text')
    }
    
    return { isValid: true }
  }
}

export const documentProcessor = new DocumentProcessor()