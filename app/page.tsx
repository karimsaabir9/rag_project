"use client";

import { FileText, Upload, RefreshCw, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";

export default function Home() {

  const handleFileProcessed = (result: { documentId: string; filename: string }) => {
    toast.success(`Document "${result.filename}" processed successfully`);
  };

  return (
    <div className=" min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  RAG Document Chat
                </h1>
                <p className="text-gray-600">
                  Upload documents and chat with them using AI
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white"
              >
                <Upload className="w-4 h-4" />
                Upload
              </Button>
              <Button
                variant="ghost"
                size="icon"
                // onClick={fetchDocuments}
                // disabled={isLoading}
                className="text-gray-600 hover:bg-gray-100"
              >
                <RefreshCw
                  className={`w-4 h-4 ${false ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Document
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFileProcessed={handleFileProcessed}
                  maxSize={100 * 1024 * 1024} // 100MB
                />
                <h1>Upload Document</h1>
              </CardContent>
            </Card>
          </div>

          {/* Document Library */}
          <div>
            {/* <DocumentList
              documents={documents}
              onDocumentDeleted={handleDocumentDeleted}
            /> */}

            {/* Instructions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">How it works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                    1
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      Upload Document
                    </div>
                    <div className="text-xs text-gray-500">
                      PDF, DOCX, TXT, or MD file
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                    2
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      AI Processing
                    </div>
                    <div className="text-xs text-gray-500">
                      Documents are chunked and embedded
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                    3
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      Click Chat Button
                    </div>
                    <div className="text-xs text-gray-500">
                      Click the chat icon on any completed document
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chat Instructions */}
            {[{ status: "completed" }].filter((d) => d.status === "completed")
              .length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Ready to Chat!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    You have{" "}
                    {
                      [{ status: "completed" }].filter(
                        (d) => d.status === "completed",
                      ).length
                    }{" "}
                    document
                    {[{ status: "completed" }].filter(
                      (d) => d.status === "completed",
                    ).length !== 1
                      ? "s"
                      : ""}{" "}
                    ready for chat.
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          How to start chatting
                        </div>
                        <div className="text-xs text-gray-600">
                          Click the chat icon (💬) next to any completed
                          document in the list above
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>RAG System Demo - Upload documents and chat with them using AI</p>
        </div>
      </div>
    </div>
  );
}
