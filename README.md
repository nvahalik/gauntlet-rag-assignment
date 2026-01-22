# RAG Document Search Engine

A Next.js 14+ application with TypeScript that implements a RAG (Retrieval-Augmented Generation) system for searching and querying uploaded Markdown documents using ChromaDB and OpenAI.

## Features

- **Document Upload & Processing**: Upload Markdown files, chunk them semantically, generate embeddings, and store in ChromaDB
- **RAG Search**: Perform similarity search on uploaded documents with AI-powered responses
- **Chat Interface**: Clean UI for asking questions about uploaded documents with cited sources
- **Semantic Chunking**: Smart document chunking that preserves structure (headers, sections)
- **Source Citations**: Responses include references to source documents and sections

## Tech Stack

- **Framework**: Next.js 14+ with App Router and TypeScript
- **Styling**: Tailwind CSS
- **Vector Database**: ChromaDB (local development, easily migrable to Chroma Cloud)
- **LLM Services**: OpenAI (text-embedding-3-small for embeddings, gpt-4o-mini for chat)
- **File Processing**: Markdown parsing and semantic chunking

## Prerequisites

1. **Node.js** (v18 or higher)
2. **ChromaDB** running locally
3. **OpenAI API key**

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo>
cd rag-document-search
npm install
```

### 2. Set up ChromaDB

Install and start ChromaDB locally:

```bash
# Install ChromaDB
pip install chromadb

# Start ChromaDB server (default port 8000)
chroma run --host localhost --port 8000
```

### 3. Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values:

```env
OPENAI_API_KEY=your-openai-api-key
CHROMA_URL=http://localhost:8000
```

### 4. Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Visit `http://localhost:3000` to access the application.

## Usage

### 1. Upload Documents
- Navigate to the "Upload" tab
- Drag and drop or select Markdown files (.md, .markdown)
- Files are automatically processed and chunked semantically
- Maximum file size: 5MB

### 2. Search Documents
- Use the "Search" tab for similarity-based document search
- Enter natural language queries
- Results show relevant chunks with context and source citations

### 3. Chat with Documents
- Use the "Chat" tab for conversational AI interaction
- Ask questions about your uploaded documents
- Responses include source citations and relevant document sections
- Supports follow-up questions and conversation history

## Project Structure

```
/app
  /api
    /documents
      /upload/route.ts              # Document upload endpoint
      /list/route.ts                # List uploaded documents
    /search/route.ts                # RAG search endpoint
    /chat/route.ts                  # Chat/question answering endpoint
  /dashboard/page.tsx               # Main dashboard
  layout.tsx                        # Root layout
  page.tsx                          # Landing/redirect page

/lib
  /chroma.ts                        # ChromaDB client setup
  /openai.ts                        # OpenAI client setup
  /document-processor.ts            # Markdown parsing and chunking logic
  /types.ts                         # TypeScript type definitions

/components
  /document-upload.tsx              # File upload component
  /search-interface.tsx             # Search UI
  /document-list.tsx                # Display uploaded documents
  /chat-interface.tsx               # Chat UI with message history
```

## Key Features Detail

### Document Processing
- **Semantic Chunking**: Splits documents by headers/sections rather than fixed character count
- **Metadata Preservation**: Maintains document structure, headers, and section information
- **Overlap Handling**: Implements smart overlap between chunks for better context
- **Validation**: File type and size validation with error handling

### Vector Search
- **Embedding Generation**: Uses OpenAI text-embedding-3-small for high-quality embeddings
- **Similarity Search**: ChromaDB provides fast similarity search with distance scoring
- **Context Retrieval**: Retrieves most relevant chunks for user queries
- **Source Attribution**: Maintains links between search results and source documents

### AI Chat
- **RAG Pipeline**: Combines retrieval with generation for accurate, contextual responses
- **Source Citations**: All responses include references to source documents
- **Conversation Memory**: Maintains chat history for follow-up questions
- **Markdown Support**: Renders formatted responses with code blocks and lists

### Authentication & Security
- **No Authentication**: This project currently has no authentication for easy local deployment.
- **Global Collection**: Documents are stored in a global ChromaDB collection.

## Deployment

### Environment Setup
1. Set up ChromaDB in production (consider Chroma Cloud for managed service)
2. Set all environment variables in your deployment platform

### Recommended Platforms
- **Vercel**: Easiest deployment for Next.js applications
- **Railway**: Good for full-stack apps with database needs
- **Docker**: Container deployment for custom infrastructure

## Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Adding New Features
- API routes go in `/app/api/`
- UI components in `/components/`
- Utility functions in `/lib/`
- Types in `/lib/types.ts`

## Troubleshooting

### Common Issues

1. **ChromaDB Connection Failed**
   - Ensure ChromaDB is running on the correct port
   - Check CHROMA_URL environment variable
   - Verify network connectivity

2. **Google OAuth Issues**
   - Verify redirect URIs in Google Cloud Console
   - Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
   - Ensure NEXTAUTH_URL matches your domain

3. **Domain Access Denied**
   - Verify ALLOWED_DOMAIN matches your email domain
   - Check that user email domain matches exactly

4. **OpenAI API Errors**
   - Verify OPENAI_API_KEY is valid
   - Check API quota and billing
   - Monitor rate limits

### Performance Optimization
- Consider implementing document caching for frequently accessed files
- Add pagination for large document lists
- Implement query result caching for common searches
- Consider upgrading to ChromaDB cloud for better performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section
2. Search existing GitHub issues
3. Create a new issue with detailed information