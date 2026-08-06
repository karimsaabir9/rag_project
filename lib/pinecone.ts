// Simple Pinecone vector database integration
import { Pinecone } from '@pinecone-database/pinecone';


let pineconeClient: Pinecone | null = null;

// Initialize Pinecone client
 
export function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pineconeClient;
}

// Get Pinecone index
 
export function getPineconeIndex() {
  const client = getPineconeClient();
  return client.index(process.env.PINECONE_INDEX_NAME || 'rag-documents');
}

// Store document chunks as vectors in Pinecone
 
export async function storeVectors(
  documentId: string,
  chunks: Array<{ content: string; embedding: number[] }>,
  metadata: { title: string; filename: string; fileType: string }
) {
  try {
    const index = getPineconeIndex();

    // Example of how to store vectors in Pinecone
    const vectors = chunks.map((chunk, index) => ({
      id: `${documentId}-chunk-${index}`,           // Unique ID for each chunk
      values: chunk.embedding,                       // The actual vector numbers  
      metadata: {                                    // Extra info stored with vector
        documentId,
        chunkIndex: index,
        content: chunk.content,
        title: metadata.title,
        filename: metadata.filename,
        fileType: metadata.fileType,
        timestamp: new Date().toISOString(),
      },
    }));

    // Upsert vectors in batches to avoid rate limits
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert({ records: batch });
    }

    console.log(`Stored ${vectors.length} vectors for document ${documentId}`);
    return vectors.length;
  } catch (error) {
    console.error('Error storing vectors:', error);
    throw new Error('Failed to store vectors in Pinecone');
  }
}

