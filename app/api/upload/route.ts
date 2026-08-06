import { processDocument } from "@/lib/document-processor";
import { createDocument, updateDocument } from "@/lib/mongodb";
import { error } from "console";
import { NextResponse, NextRequest } from "next/server";
import { generateEmbeddings } from '@/lib/ai/embeddings';

export async function POST(request: NextRequest) {
  try {
    // 1- Get the file from the request

    const formData = await request.formData();
    const file = formData.get("file") as File;

    // 2- Validate the file

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // TODO: Validate the file type
    // TODO: Validate the file size(10mb limit)
    const maxSize = 100 * 1024 * 1024; // 100mb in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large, Maximum size is 100MB." },
        { status: 400 },
      );
    }

    // Generate unique document ID
    const documentId = `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // 3- Save the file information to the database
    await createDocument({
      documentId,
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
      filename: file.name,
      fileType: file.name.split(".").pop()?.toLowerCase() || "unknown",
      fileSize: file.size,
      uploadedAt: new Date(),
      status: "processing",
    });

    // 4- Process the document (extract text and create chunks)

    const { content, chunks } = await processDocument(file);

    if (chunks.length === 0) {
      // Update document status to error
      await updateDocument(documentId, {
        status: "error",
        errorMessage: "No content could be extracted from the file.",
      });

      return NextResponse.json(
        { error: "No content could be extracted from the file." },
        { status: 400 },
      );
    }


    // 5- Generate embeddings for all chunks
    const embeddings = await generateEmbeddings(chunks);



    // 6- Store vectors in Pinecone
    // 7- Update document in MongoDB whith completion status
    // 8- Return success response
  } catch (error) {}
}
