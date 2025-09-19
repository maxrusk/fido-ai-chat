import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadProgress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  analysisId?: string;
  error?: string;
}

interface FinancialPlanUploaderProps {
  onAnalysisComplete: (analysisId: string) => void;
  maxFileSize?: number;
}

export default function FinancialPlanUploader({ 
  onAnalysisComplete, 
  maxFileSize = 10 * 1024 * 1024 // 10MB default
}: FinancialPlanUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const supportedFormats = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/plain'
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (!supportedFormats.includes(file.type)) {
      return `Unsupported file type. Please upload PDF, Word, Excel, or text files.`;
    }
    if (file.size > maxFileSize) {
      return `File size too large. Maximum size is ${formatFileSize(maxFileSize)}.`;
    }
    return null;
  };

  const uploadFile = async (file: File): Promise<void> => {
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const uploadedFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadProgress: 0,
      status: 'uploading'
    };

    setUploadedFiles(prev => [...prev, uploadedFile]);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileId', fileId);

      // Upload file with progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadedFiles(prev => 
            prev.map(f => f.id === fileId ? { ...f, uploadProgress: progress } : f)
          );
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          
          // Update file status to processing
          setUploadedFiles(prev => 
            prev.map(f => f.id === fileId ? { ...f, status: 'processing', uploadProgress: 100 } : f)
          );

          // Start AI analysis
          try {
            const analysisResponse = await fetch(`/api/financial-analysis/analyze`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                fileId: fileId,
                fileName: file.name,
                fileType: file.type,
                uploadPath: response.uploadPath
              })
            });

            if (!analysisResponse.ok) {
              throw new Error('Analysis failed');
            }

            const analysisData = await analysisResponse.json();

            // Update file status to completed
            setUploadedFiles(prev => 
              prev.map(f => f.id === fileId ? { 
                ...f, 
                status: 'completed',
                analysisId: analysisData.analysisId 
              } : f)
            );

            toast({
              title: "Analysis Complete",
              description: `${file.name} has been successfully analyzed.`
            });

            onAnalysisComplete(analysisData.analysisId);

          } catch (analysisError) {
            throw new Error('Failed to analyze document');
          }

        } else {
          throw new Error('Upload failed');
        }
      });

      xhr.addEventListener('error', () => {
        throw new Error('Upload failed due to network error');
      });

      xhr.open('POST', '/api/financial-analysis/upload');
      xhr.send(formData);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileId ? { ...f, status: 'error', error: errorMessage } : f)
      );

      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleFileInput = useCallback((files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        toast({
          title: "Invalid File",
          description: error,
          variant: "destructive"
        });
        return;
      }

      uploadFile(file);
    });
  }, [maxFileSize, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    handleFileInput(e.dataTransfer.files);
  }, [handleFileInput]);

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (file: UploadedFile) => {
    switch (file.status) {
      case 'uploading':
        return `Uploading... ${file.uploadProgress}%`;
      case 'processing':
        return 'Analyzing with AI...';
      case 'completed':
        return 'Analysis complete';
      case 'error':
        return file.error || 'Error occurred';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Upload Financial Plan
          </CardTitle>
          <CardDescription>
            Upload your existing business or financial plan for AI analysis and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Drop your financial plan here
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              or click to browse your files
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Supports PDF, Word, Excel files up to {formatFileSize(maxFileSize)}
            </p>
            
            <input
              id="file-input"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={(e) => handleFileInput(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Uploaded Files</h4>
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0">
                    {getStatusIcon(file.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)} • {getStatusText(file)}
                    </p>
                    
                    {(file.status === 'uploading' || file.status === 'processing') && (
                      <Progress value={file.status === 'uploading' ? file.uploadProgress : 100} className="mt-2" />
                    )}
                    
                    {file.status === 'error' && (
                      <Alert className="mt-2">
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription className="text-xs">
                          {file.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}