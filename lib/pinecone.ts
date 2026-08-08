// Simple Pinecone vector database integration
import { Pinecone } from "@pinecone-database/pinecone";
import type { DocumentSource } from "./types";

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
  return client.index(process.env.PINECONE_INDEX_NAME || "rag-pre");
}

// Store document chunks as vectors in Pinecone
export async function storeVectors(
  documentId: string,
  chunks: Array<{ content: string; embedding: number[] }>,
  metadata: { title: string; filename: string; fileType: string },
) {
  try {
    const index = getPineconeIndex();
    const vectors = chunks.map((chunk, index) => ({
      id: `${documentId}-chunk-${index}`, // Unique ID for each chunk
      values: chunk.embedding, // The actual vector numbers
      metadata: {
        // Extra info stored with vector
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
    console.error("Error storing vectors:", error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to store vectors in Pinecone: ${message}`);
  }
}

// Search for similar vectors in Pinecone
export async function searchSimilarVectors(
  queryEmbedding: number[],
  topK: number = 4,
  filter?: Record<string, any>,
): Promise<DocumentSource[]> {
  try {
    const index = getPineconeIndex();

    const searchResults = await index.query({
      vector: queryEmbedding,
      topK: topK,
      includeMetadata: true,
      filter: filter,
    });

    // Convert results to DocumentSource format
    const sources: DocumentSource[] = [];

    for (const match of searchResults.matches || []) {
      if (!match.metadata || !match.score) continue;

      sources.push({
        documentId: match.metadata.documentId as string,
        documentTitle: match.metadata.title as string,
        chunkId: match.id,
        content: match.metadata.content as string,
        similarity: match.score,
      });
    }

    return sources; // Pinecone already returns results sorted by similarity
  } catch (error) {
    console.error("Error searching vectors:", error);
    throw new Error("Failed to search vectors in Pinecone");
  }
}

// Delete all vectors for a document
export async function deleteDocumentVectors(documentId: string): Promise<void> {
  try {
    const index = getPineconeIndex();

    // Delete all vectors with the document ID filter (simple key-value format)
    await index.deleteMany({
      filter: { documentId },
    });

    console.log(`Deleted vectors for document ${documentId}`);
  } catch (error) {
    console.error("Error deleting vectors:", error);
    throw new Error("Failed to delete vectors from Pinecone");
  }
}

// Get index statistics
export async function getIndexStats() {
  try {
    const index = getPineconeIndex();
    const stats = await index.describeIndexStats();
    return stats;
  } catch (error) {
    console.error("Error getting index stats:", error);
    return null;
  }
}

// Initialize Pinecone index if it doesn't exist
export async function initializePineconeIndex() {
  try {
    const client = getPineconeClient();

    // Check if index exists
    const indexes = await client.listIndexes();
    const indexName = process.env.PINECONE_INDEX_NAME || "rag-documents";
    const indexExists = indexes.indexes?.some(
      (index) => index.name === indexName,
    );

    if (!indexExists) {
      console.log(`Creating Pinecone index: ${indexName}`);

      await client.createIndex({
        name: process.env.PINECONE_INDEX_NAME || "rag-documents",
        dimension: 1536, // text-embedding-3-small dimensions
        metric: "cosine",
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-east-1",
          },
        },
      });

      // Wait for index to be ready
      console.log("Waiting for index to be ready...");
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    return true;
  } catch (error) {
    console.error("Error initializing Pinecone index:", error);
    return false;
  }
}
