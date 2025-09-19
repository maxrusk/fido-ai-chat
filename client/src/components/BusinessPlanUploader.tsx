import { useState } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BusinessPlanUploaderProps {
  onUploadComplete?: (analysis: {
    filePath: string;
    extractedContent: string;
    aiInsights: string;
    analysis: any;
    fileName: string;
  }) => void;
  className?: string;
}

/**
 * A specialized file upload component for business plans that allows users to upload
 * documents (PDF, DOC, DOCX, TXT) for AI analysis.
 */
export function BusinessPlanUploader({ onUploadComplete, className }: BusinessPlanUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles: 1,
        maxFileSize: 10485760, // 10MB
        allowedFileTypes: ['.pdf', '.doc', '.docx', '.txt', '.md'],
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: async () => {
          try {
            const response = await apiRequest('GET', '/api/business-plans/upload') as { uploadURL: string };
            return {
              method: 'PUT' as const,
              url: response.uploadURL,
            };
          } catch (error) {
            console.error('Failed to get upload URL:', error);
            throw error;
          }
        },
      })
      .on("complete", async (result) => {
        if (result.successful && result.successful.length > 0) {
          setIsAnalyzing(true);
          const uploadedFile = result.successful[0];
          
          try {
            // Analyze the uploaded business plan
            const response = await apiRequest('/api/business-plans/analyze', 'POST', {
              filePath: uploadedFile.uploadURL,
              fileName: uploadedFile.name,
            }) as { filePath: string; extractedContent: string; aiInsights: string; analysis: any };

            toast({
              title: "Business Plan Uploaded Successfully",
              description: "Your plan has been analyzed and is ready for AI review.",
            });

            onUploadComplete?.(response);
            setShowModal(false);
          } catch (error) {
            console.error('Failed to analyze business plan:', error);
            toast({
              title: "Analysis Failed",
              description: "Failed to analyze your business plan. Please try again.",
              variant: "destructive",
            });
          } finally {
            setIsAnalyzing(false);
          }
        }
      })
      .on("error", (error) => {
        console.error('Upload error:', error);
        toast({
          title: "Upload Failed",
          description: "Failed to upload your business plan. Please try again.",
          variant: "destructive",
        });
      })
  );

  return (
    <div className={className}>
      <Button 
        onClick={() => setShowModal(true)} 
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
        disabled={isAnalyzing}
      >
        {isAnalyzing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            <FileText className="h-4 w-4" />
            <span>Upload Business Plan</span>
          </>
        )}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
        note="Upload your existing business plan (PDF, DOC, DOCX, TXT, MD) for AI analysis"
      />
    </div>
  );
}