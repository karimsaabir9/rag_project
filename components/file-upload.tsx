'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { isFileTypeSupported } from '@/lib/document-processor';

interface FileUploadProps {
  onFileProcessed?: (result: { documentId: string; filename: string }) => void;
  maxSize?: number; // in bytes
}

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  documentId?: string;
}

export function FileUpload({ 
  onFileProcessed, 
  maxSize = 100 * 1024 * 1024 // 100MB (change this to 10MB if you want to test the system)
}: FileUploadProps) {
  const [currentFile, setCurrentFile] = useState<UploadFile | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach((rejection) => {
      const { file, errors } = rejection;
      errors.forEach((error: any) => {
        if (error.code === 'file-too-large') {
          toast.error(`File ${file.name} is too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
        } else if (error.code === 'file-invalid-type') {
          toast.error(`File ${file.name} type is not supported. Please upload PDF, DOCX, TXT, or MD files.`);
        }
      });
    });

    // Only handle the first accepted file (single file upload)
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // If there's already a file, ask user if they want to replace it
      if (currentFile && currentFile.status !== 'completed') {
        toast.error('Please wait for the current file to finish processing, or remove it first.');
        return;
      }

      const newFile: UploadFile = {
        file,
        id: Math.random().toString(36).substring(7),
        status: 'pending',
        progress: 0,
      };

      setCurrentFile(newFile);
      uploadFile(newFile);
      
      // Show info if user dropped multiple files
      if (acceptedFiles.length > 1) {
        toast.info(`Only processing the first file: ${file.name}. Please upload files one at a time.`);
      }
    }
  }, [maxSize, currentFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxFiles: 1, // Only allow 1 file
    maxSize,
    multiple: false, // Disable multiple file selection
  });

  const uploadFile = async (uploadFile: UploadFile) => {
    try {
      // Update status to uploading
      setCurrentFile(prev => 
        prev?.id === uploadFile.id ? { ...prev, status: 'uploading' as const } : prev
      );

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setCurrentFile(prev => 
          prev?.id === uploadFile.id ? { ...prev, progress: i } : prev
        );
      }

      // Change to processing status
      setCurrentFile(prev => 
        prev?.id === uploadFile.id ? { ...prev, status: 'processing' as const, progress: 0 } : prev
      );

      // Call the upload API
      const formData = new FormData();
      formData.append('file', uploadFile.file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Update to completed
      setCurrentFile(prev => 
        prev?.id === uploadFile.id ? { 
          ...prev, 
          status: 'completed' as const, 
          progress: 100,
          documentId: result.documentId 
        } : prev
      );

      toast.success(`${uploadFile.file.name} uploaded and processed successfully!`);
      onFileProcessed?.(result);

    } catch (error) {
      console.error('Upload error:', error);
      setCurrentFile(prev => 
        prev?.id === uploadFile.id ? { 
          ...prev, 
          status: 'error' as const, 
          error: error instanceof Error ? error.message : 'Upload failed' 
        } : prev
      );
      toast.error(`Failed to upload ${uploadFile.file.name}`);
    }
  };

  const removeFile = () => {
    setCurrentFile(null);
  };

  const retryFile = () => {
    if (currentFile) {
      setCurrentFile(prev => 
        prev ? { ...prev, status: 'pending' as const, progress: 0, error: undefined } : prev
      );
      uploadFile(currentFile);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Area */}
      <Card className="border-2 border-dashed border-gray-300 transition-colors hover:border-gray-400">
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              cursor-pointer text-center space-y-4 p-8 rounded-lg transition-colors
              ${isDragActive ? 'bg-gray-50 border-gray-400' : 'hover:bg-gray-50/50'}
            `}
          >
            <input {...getInputProps()} />
            <div className="mx-auto w-12 h-12 text-gray-500">
              <Upload className="w-full h-full" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop files here' : 'Upload your documents'}
              </h3>
              <p className="text-sm text-gray-600">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Supports PDF, DOCX, TXT, MD • Max {maxSize / 1024 / 1024}MB • One file at a time
              </p>
            </div>
            <Button variant="outline" type="button" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Choose File
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current File */}
      {currentFile && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Current File</h4>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <File className="w-5 h-5 text-gray-600 flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium truncate">
                    {currentFile.file.name}
                  </span>
                  <Badge variant={
                    currentFile.status === 'completed' ? 'default' :
                    currentFile.status === 'error' ? 'destructive' :
                    'secondary'
                  }>
                    {currentFile.status}
                  </Badge>
                </div>
                
                <div className="text-xs text-gray-500">
                  {(currentFile.file.size / 1024 / 1024).toFixed(1)} MB
                </div>
                
                {(currentFile.status === 'uploading' || currentFile.status === 'processing') && (
                  <div className="mt-2">
                    <Progress value={currentFile.progress} className="h-1" />
                    <div className="text-xs text-gray-500 mt-1">
                      {currentFile.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                    </div>
                  </div>
                )}
                
                {currentFile.error && (
                  <Alert className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {currentFile.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                {currentFile.status === 'completed' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                
                {currentFile.status === 'error' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={retryFile}
                  >
                    Retry
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={removeFile}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}