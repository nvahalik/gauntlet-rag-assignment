import { ChromaClient as CC, Collection, EmbeddingFunction } from "chromadb";

const globalForChroma = globalThis as unknown as {
  ollamaEmbedder: EmbeddingFunction | undefined;
};

async function getOllamaEmbedder(): Promise<EmbeddingFunction> {
  if (!globalForChroma.ollamaEmbedder) {
    const { OllamaEmbeddingFunction } = await import("@chroma-core/ollama");
    globalForChroma.ollamaEmbedder = new OllamaEmbeddingFunction({
      url: "http://10.11.1.29:11434/",
      model: "nomic-embed-text"
    });
  }
  return globalForChroma.ollamaEmbedder;
}

class ChromaClient {
  private client: undefined|CC;
  private embeddingFunction: EmbeddingFunction | null = null;
  private collection: undefined|Collection;

  async initialize() {
    if (!this.client) {
      try {
        // Dynamic import to handle potential SSR issues
        this.client = new CC({
          host: 'chromadb',
          port: 8000
        })
        
        // this.embeddingFunction = new OpenAIEmbeddingFunction({
        //   openai_api_key: process.env.OPENAI_API_KEY!,
        //   openai_model: 'text-embedding-3-small'
        // })
        this.embeddingFunction = await getOllamaEmbedder();
      } catch (error) {
        console.error('Failed to initialize ChromaDB:', error)
        throw new Error('ChromaDB initialization failed. Make sure ChromaDB server is running.')
      }
    }
  }

  async getOrCreateCollection(name: string): Promise<Collection> {
    await this.initialize();
    if (!this.collection) {
      this.collection = await this.client!.getOrCreateCollection({
        name,
        embeddingFunction: this.embeddingFunction!,
      });
    }
    return this.collection;
  }

  async addDocuments({
    collectionName,
    documents,
    metadatas,
    ids,
  }: {
    collectionName: string
    documents: string[]
    metadatas: any[]
    ids: string[]
  }) {
    try {
      const collection = await this.getOrCreateCollection(collectionName)

      console.log({
        ids,
        documents,
        metadatas,
      });

      await collection.add({
        ids,
        documents,
        metadatas,
      })

      return { success: true }
    } catch (error) {
      console.log(error)
      console.error('Error adding documents to ChromaDB:', error)
      throw error
    }
  }

  async searchDocuments({
    collectionName,
    queryText,
    nResults = 5,
  }: {
    collectionName: string
    queryText: string
    nResults?: number
  }) {
    try {
      const collection = await this.getOrCreateCollection(collectionName)
      
      const results = await collection.query({
        queryTexts: [queryText],
        nResults,
      })
      
      return {
        documents: results.documents?.[0] || [],
        metadatas: results.metadatas?.[0] || [],
        distances: results.distances?.[0] || [],
        ids: results.ids?.[0] || [],
      }
    } catch (error) {
      console.error('Error searching documents in ChromaDB:', error)
      throw error
    }
  }

  async listCollections() {
    try {
      await this.initialize()
      return await this.client!.listCollections()
    } catch (error) {
      console.error('Error listing collections:', error)
      throw error
    }
  }

  async deleteCollection(name: string) {
    try {
      await this.initialize()
      await this.client!.deleteCollection({ name })
      return { success: true }
    } catch (error) {
      console.error('Error deleting collection:', error)
      throw error
    }
  }
}

export const chromaClient = new ChromaClient()