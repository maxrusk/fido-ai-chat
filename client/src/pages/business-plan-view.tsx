import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useRoute } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  Download, 
  CheckCircle,
  Clock,
  FileText,
  MessageSquare,
  X,
  Copy,
  Printer
} from 'lucide-react';
import { Link } from 'wouter';
import type { BusinessPlan } from '@shared/schema';
import jsPDF from 'jspdf';

interface BusinessPlanSection {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  lastUpdated?: string;
}

const BUSINESS_PLAN_SECTIONS = [
  { id: 'executive_summary', title: 'Executive Summary', icon: '📋' },
  { id: 'business_description', title: 'Business Description', icon: '🏢' },
  { id: 'market_analysis', title: 'Market Analysis', icon: '📊' },
  { id: 'products_services', title: 'Products & Services', icon: '📦' },
  { id: 'marketing_plan', title: 'Marketing Plan', icon: '📈' },
  { id: 'operations_plan', title: 'Operations Plan', icon: '⚙️' },
  { id: 'financial_projections', title: 'Financial Projections', icon: '💰' },
  { id: 'funding_request', title: 'Funding Request', icon: '💼' },
  { id: 'owner_bio', title: 'Owner Bio', icon: '👤' }
];

export default function BusinessPlanViewPage() {
  const [, params] = useRoute('/business-plans/:planId');
  const planId = params?.planId;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  // Fetch business plan details
  const { data: businessPlan, isLoading } = useQuery<BusinessPlan>({
    queryKey: ['/api/business-plans', planId],
    queryFn: async () => {
      return await apiRequest('GET', `/api/business-plans/${planId}`);
    },
    enabled: !!planId && !!user
  });

  // Update section mutation
  const updateSectionMutation = useMutation({
    mutationFn: async ({ sectionId, content }: { sectionId: string; content: string }) => {
      return await apiRequest('PUT', `/api/business-plans/${planId}/sections/${sectionId}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-plans', planId] });
      setEditingSection(null);
      setEditContent('');
      toast({
        title: "Success",
        description: "Section updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update section",
        variant: "destructive",
      });
    }
  });

  // Update title mutation
  const updateTitleMutation = useMutation({
    mutationFn: async (newTitle: string) => {
      return await apiRequest('PUT', `/api/business-plans/${planId}/title`, { title: newTitle });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-plans', planId] });
      setEditingTitle(false);
      setTitleInput('');
      toast({
        title: "Success",
        description: "Business plan name updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update business plan name",
        variant: "destructive",
      });
    }
  });

  const handleEditSection = (sectionId: string, currentContent: string) => {
    setEditingSection(sectionId);
    setEditContent(currentContent || '');
  };

  const handleSaveSection = () => {
    if (editingSection) {
      updateSectionMutation.mutate({
        sectionId: editingSection,
        content: editContent
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditContent('');
  };

  const handleEditTitle = () => {
    setEditingTitle(true);
    setTitleInput(businessPlan?.title || '');
  };

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      updateTitleMutation.mutate(titleInput.trim());
    }
  };

  const handleCancelTitleEdit = () => {
    setEditingTitle(false);
    setTitleInput('');
  };

  const handleContinueEditing = () => {
    // Navigate to chat with this business plan loaded
    window.location.href = `/chat?plan=${planId}&agent=business_plan_architect`;
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = margin;

      // Title
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(businessPlan?.title || 'Business Plan', margin, yPosition);
      yPosition += 15;

      if (businessPlan?.businessName) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "normal");
        pdf.text(businessPlan.businessName, margin, yPosition);
        yPosition += 20;
      }

      // Sections
      const sections = businessPlan?.sections || {};
      BUSINESS_PLAN_SECTIONS.forEach((section) => {
        const sectionData = sections[section.id];
        if (sectionData?.content) {
          // Section title
          pdf.setFontSize(16);
          pdf.setFont("helvetica", "bold");
          pdf.text(`${section.icon} ${section.title}`, margin, yPosition);
          yPosition += 10;

          // Section content
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "normal");
          const lines = pdf.splitTextToSize(sectionData.content, pageWidth - 2 * margin);
          lines.forEach((line: string) => {
            if (yPosition > 270) {
              pdf.addPage();
              yPosition = margin;
            }
            pdf.text(line, margin, yPosition);
            yPosition += 6;
          });
          yPosition += 10;
        }
      });

      // Save PDF
      const fileName = `${businessPlan?.businessName || businessPlan?.title || 'business-plan'}.pdf`;
      pdf.save(fileName);

      toast({
        title: "Success",
        description: "Business plan PDF generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getCompletionStats = () => {
    if (!businessPlan?.sections) return { completed: 0, total: 9, percentage: 0 };
    
    const sections = businessPlan.sections;
    const completedSections = BUSINESS_PLAN_SECTIONS.filter(section => {
      const sectionData = sections[section.id];
      return sectionData?.completed || (sectionData?.content && sectionData.content.length > 50);
    });

    return {
      completed: completedSections.length,
      total: BUSINESS_PLAN_SECTIONS.length,
      percentage: Math.round((completedSections.length / BUSINESS_PLAN_SECTIONS.length) * 100)
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading business plan...</p>
        </div>
      </div>
    );
  }

  if (!businessPlan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Business plan not found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The business plan you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link href="/business-plans">
            <Button>Back to Business Plans</Button>
          </Link>
        </div>
      </div>
    );
  }

  const stats = getCompletionStats();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/business-plans">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Plans
                </Button>
              </Link>
              <div>
                {editingTitle ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      className="text-xl font-bold"
                      placeholder="Enter business plan name"
                      data-testid="input-business-plan-title"
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveTitle}
                      disabled={updateTitleMutation.isPending || !titleInput.trim()}
                      data-testid="button-save-title"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelTitleEdit}
                      disabled={updateTitleMutation.isPending}
                      data-testid="button-cancel-title-edit"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {businessPlan.title}
                    </h1>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleEditTitle}
                      data-testid="button-edit-title"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {businessPlan.businessName && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {businessPlan.businessName}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={generatePDF}
                disabled={isGeneratingPDF}
                variant="outline"
                size="sm"
              >
                {isGeneratingPDF ? (
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export PDF
              </Button>
              <Button onClick={handleContinueEditing} size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Continue Editing
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Completion Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {stats.completed} of {stats.total} sections completed
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {stats.percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${stats.percentage}%` }}
              ></div>
            </div>
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Last updated: {formatDate(businessPlan.updatedAt)}
            </div>
          </CardContent>
        </Card>

        {/* Business Plan Sections */}
        <div className="space-y-6">
          {BUSINESS_PLAN_SECTIONS.map((section) => {
            const sectionData = businessPlan.sections?.[section.id];
            const isEditing = editingSection === section.id;
            const hasContent = sectionData?.content && sectionData.content.length > 0;
            const isCompleted = sectionData?.completed || (sectionData?.content && sectionData.content.length > 50);

            return (
              <Card key={section.id} className={`${isCompleted ? 'border-green-200 dark:border-green-800' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-2xl">{section.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          {section.title}
                          {isCompleted && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        {sectionData?.lastUpdated && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                            Last updated: {formatDate(sectionData.lastUpdated)}
                          </p>
                        )}
                      </div>
                    </CardTitle>
                    {!isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSection(section.id, sectionData?.content || '')}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder={`Enter content for ${section.title}...`}
                        className="min-h-[200px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveSection}
                          disabled={updateSectionMutation.isPending}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : hasContent ? (
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                        {sectionData.content}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">
                        This section hasn't been completed yet
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSection(section.id, '')}
                        className="mt-2"
                      >
                        Add content
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}