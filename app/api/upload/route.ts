import { NextRequest, NextResponse } from 'next/server';
import { processDocument, isFileTypeSupported } from '@/lib/document-processor';
import { generateEmbeddings } from '@/lib/ai/embeddings';
import { storeVectors } from '@/lib/pinecone';
import { createDocument, updateDocument } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isFileTypeSupported(file)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, DOCX, TXT, or MD files.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB (change this to 10MB if you want to test the system)
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB.' },
        { status: 400 }
      );
    }

    // Generate unique document ID
    const documentId = `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Save document to MongoDB first
    await createDocument({
      documentId,
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
      filename: file.name,
      fileType: file.name.split('.').pop()?.toLowerCase() || 'unknown',
      fileSize: file.size,
      uploadedAt: new Date(),
      status: 'processing',
    });

    // Process the document (extract text and create chunks)
    const { content, chunks } = await processDocument(file);

    if (chunks.length === 0) {
      // Update document status to error
      await updateDocument(documentId, {
        status: 'error',
        errorMessage: 'No content could be extracted from the file.'
      });
      
      return NextResponse.json(
        { error: 'No content could be extracted from the file.' },
        { status: 400 }
      );
    }

    // Generate embeddings for all chunks
    const embeddings = await generateEmbeddings(chunks);

    // Store vectors in Pinecone
    const vectorCount = await storeVectors(
      documentId,
      embeddings,
      {
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
        filename: file.name,
        fileType: file.name.split('.').pop()?.toLowerCase() || 'unknown',
      }
    );

    // Update document in MongoDB with completion status
    await updateDocument(documentId, {
      status: 'completed',
      processedAt: new Date(),
      chunkCount: chunks.length,
      vectorCount,
      contentLength: content.length,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      documentId,
      filename: file.name,
      message: `Successfully processed ${chunks.length} chunks and stored ${vectorCount} vectors.`,
      stats: {
        originalSize: file.size,
        chunkCount: chunks.length,
        vectorCount,
        contentLength: content.length,
      },
    });

  } catch (error) {
    console.error('Upload processing error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process document', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to upload files.' },
    { status: 405 }
  );
}

