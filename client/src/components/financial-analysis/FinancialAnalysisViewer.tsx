import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Download,
  RefreshCw,
  BarChart3,
  DollarSign,
  Target,
  Users
} from "lucide-react";
import CollaborationMarkers, { triggerSectionView } from '@/components/collaboration/CollaborationMarkers';

interface FinancialAnalysis {
  id: string;
  fileName: string;
  uploadedAt: string;
  status: 'processing' | 'completed' | 'error';
  overallScore: number;
  keyFindings: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    risks: string[];
  };
  sectionAnalysis: {
    section: string;
    score: number;
    feedback: string;
    recommendations: string[];
    priority: 'high' | 'medium' | 'low';
  }[];
  financialMetrics: {
    metric: string;
    currentValue: string;
    benchmarkValue: string;
    status: 'good' | 'warning' | 'poor';
    recommendation: string;
  }[];
  actionItems: {
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    category: string;
    estimatedImpact: string;
    completed: boolean;
  }[];
}

interface FinancialAnalysisViewerProps {
  analysisId: string;
  onStartImprovement?: () => void;
}

export default function FinancialAnalysisViewer({ analysisId, onStartImprovement }: FinancialAnalysisViewerProps) {
  const [selectedTab, setSelectedTab] = useState('overview');

  const { data: analysis, isLoading, error, refetch } = useQuery<FinancialAnalysis>({
    queryKey: ['/api/financial-analysis', analysisId],
    enabled: !!analysisId,
    refetchInterval: (query) => query.state.data?.status === 'processing' ? 2000 : false, // Poll while processing
  });

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getMetricStatusIcon = (status: 'good' | 'warning' | 'poor') => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'poor': return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Analyzing your financial plan...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !analysis) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Analysis Failed
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We couldn't analyze your financial plan. Please try uploading again.
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (analysis.status === 'processing') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Analyzing: {analysis.fileName}
          </CardTitle>
          <CardDescription>
            Our AI is analyzing your financial plan. This usually takes 1-2 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={75} />
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Analyzing financial metrics and generating recommendations...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Collaboration Panel */}
      <CollaborationMarkers 
        analysisId={analysisId} 
        onCreateSession={() => console.log('Collaboration session created')}
        onInviteUser={() => console.log('Invite user to collaboration')}
      />

      {/* Header with Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Analysis: {analysis.fileName}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">Overall Score</div>
              <div className={`text-2xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                {analysis.overallScore}/100
              </div>
            </div>
          </CardTitle>
          <CardDescription>
            Completed on {new Date(analysis.uploadedAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Analysis Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6" onFocus={() => triggerSectionView('overview')}>
          {/* Key Findings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.keyFindings.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                      • {strength}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.keyFindings.weaknesses.map((weakness, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                      • {weakness}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <TrendingUp className="w-5 h-5" />
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.keyFindings.opportunities.map((opportunity, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                      • {opportunity}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="w-5 h-5" />
                  Risks to Consider
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.keyFindings.risks.map((risk, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                      • {risk}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sections" className="space-y-4" onFocus={() => triggerSectionView('sections')}>
          {analysis.sectionAnalysis.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{section.section}</CardTitle>
                  <div className="flex items-center gap-3">
                    <Badge className={getPriorityColor(section.priority)}>
                      {section.priority} priority
                    </Badge>
                    <span className={`text-xl font-bold ${getScoreColor(section.score)}`}>
                      {section.score}/100
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">{section.feedback}</p>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Recommendations:</h4>
                  <ul className="space-y-1">
                    {section.recommendations.map((rec, recIndex) => (
                      <li key={recIndex} className="text-sm text-gray-700 dark:text-gray-300">
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4" onFocus={() => triggerSectionView('metrics')}>
          {analysis.financialMetrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getMetricStatusIcon(metric.status)}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{metric.metric}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Current: {metric.currentValue} | Benchmark: {metric.benchmarkValue}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                  {metric.recommendation}
                </p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="actions" className="space-y-4" onFocus={() => triggerSectionView('actions')}>
          <div className="space-y-4">
            {analysis.actionItems.map((action) => (
              <Card key={action.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {action.title}
                        </h4>
                        <Badge className={getPriorityColor(action.priority)}>
                          {action.priority}
                        </Badge>
                        <Badge variant="outline">{action.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {action.description}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Expected Impact: {action.estimatedImpact}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={onStartImprovement} className="flex-1">
          <Target className="w-4 h-4 mr-2" />
          Start Plan Improvement
        </Button>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>
    </div>
  );
}