import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import FinancialPlanUploader from "@/components/financial-analysis/FinancialPlanUploader";
import FinancialAnalysisViewer from "@/components/financial-analysis/FinancialAnalysisViewer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Link } from "wouter";

export default function FinancialAnalysis() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(true);

  // Redirect to signin if not authenticated
  if (!isLoading && !isAuthenticated) {
    window.location.href = '/signin';
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const handleAnalysisComplete = (analysisId: string) => {
    setCurrentAnalysisId(analysisId);
    setShowUploader(false);
  };

  const handleStartImprovement = () => {
    // Navigate to chat interface with funding navigator for improvement recommendations
    window.location.href = '/?copilot=funding_navigator&context=plan_improvement';
  };

  const handleBackToUploader = () => {
    setShowUploader(true);
    setCurrentAnalysisId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 chat-dot-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Financial Plan Analysis
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Upload your existing plan and get AI-powered insights to improve it
              </p>
            </div>
          </div>
        </div>

        {/* Welcome Message for First-Time Users */}
        {showUploader && !currentAnalysisId && (
          <Card className="mb-8 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">
                Welcome to Financial Plan Analysis
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                Upload your existing business plan, financial projections, or pitch deck. Our AI will:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
                <div className="space-y-2">
                  <p className="font-medium">📊 Analyze Financial Metrics</p>
                  <p>• Revenue projections and growth rates</p>
                  <p>• Cost structure and profit margins</p>
                  <p>• Cash flow and funding requirements</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">🎯 Provide Actionable Insights</p>
                  <p>• Identify strengths and opportunities</p>
                  <p>• Highlight potential risks and gaps</p>
                  <p>• Suggest specific improvements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {showUploader ? (
            <FinancialPlanUploader
              onAnalysisComplete={handleAnalysisComplete}
              maxFileSize={15 * 1024 * 1024} // 15MB for financial documents
            />
          ) : currentAnalysisId ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Analysis Results
                </h2>
                <Button onClick={handleBackToUploader} variant="outline">
                  Upload Another Plan
                </Button>
              </div>
              
              <FinancialAnalysisViewer
                analysisId={currentAnalysisId}
                onStartImprovement={handleStartImprovement}
              />
            </div>
          ) : null}
        </div>

        {/* Help Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>
                Common questions about financial plan analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    What file types are supported?
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We support PDF, Word (.docx), Excel (.xlsx), and plain text files. 
                    Your document can include financial projections, business plans, or pitch decks.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    How accurate is the analysis?
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Our AI analyzes your plan against industry standards and best practices. 
                    While highly accurate, always review recommendations with domain experts.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Is my data secure?
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Yes, all uploaded documents are encrypted and stored securely. 
                    We never share your financial information with third parties.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    What happens after analysis?
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You can start a conversation with our Capital Architect AI to implement 
                    recommendations and improve your financial plan step-by-step.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}