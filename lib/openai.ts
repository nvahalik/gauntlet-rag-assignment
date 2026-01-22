import OpenAI from 'openai'
import {ChatResponse, Ollama} from 'ollama'

export const openai = new OpenAI({
  apiKey: '',
})

const oll = new Ollama({
  host: process.env.OLLAMA_HOST || 'http://10.11.1.29:11434',
})

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // const response = await openai.embeddings.create({
    //   model: 'text-embedding-3-small',
    //   input: text,
    // })


    // const response = await openai.embeddings.create({
    //   model: 'text-embedding-3-small',
    //   input: text,
    // })

    const response = await oll.embed({
      model: 'nomic-embed-text',
      input: text
    });

    return response.embeddings[0];
    // return response.data[0].embedding

  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

export async function generateChatResponse({
  messages,
  context,
}: {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  context: string
}): Promise<string> {
  try {
    const systemMessage = {
      role: 'system' as const,
      content: `You are a helpful assistant that answers questions based on the provided context. Use the context to answer questions accurately and cite your sources when possible.

Context:
${context}

Instructions:
- Answer questions based only on the provided context
- If the answer isn't in the context, say so clearly
- Cite specific documents or sections when referencing information
- Be concise but comprehensive in your responses`,
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens: 1000,
    })

    return response.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.'

    // const response: ChatResponse = await oll.chat({
    //   model: 'steamdj/llama3-cpu-only:latest',
    //   messages: [systemMessage, ...messages],
    // })

    // return response.message?.content || 'I apologize, but I was unable to generate a response.'
  } catch (error) {
    console.error('Error generating chat response:', error)
    throw error
  }
}
