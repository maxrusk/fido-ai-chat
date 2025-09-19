import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Plus, 
  Calendar, 
  Eye, 
  Edit, 
  Trash2, 
  Download,
  ArrowLeft,
  Search,
  MessageSquare,
  Clock,
  Filter,
  Save,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Link } from 'wouter';
import type { BusinessPlan, ChatSession } from '@shared/schema';

interface BusinessPlanWithStats extends BusinessPlan {
  sectionsCompleted: number;
  totalSections: number;
  completionPercentage: number;
}

export default function BusinessPlansPage() {
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<BusinessPlanWithStats | null>(null);
  const [activeTab, setActiveTab] = useState('plans');
  const [sessionFilter, setSessionFilter] = useState('all');
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Fetch user's business plans
  const { data: businessPlans = [], isLoading, error } = useQuery<BusinessPlanWithStats[]>({
    queryKey: ['/api/business-plans'],
    queryFn: async () => {
      const response = await fetch('/api/business-plans', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to access your business plans');
        }
        throw new Error(`Failed to load business plans: ${response.status}`);
      }
      const plans = await response.json();
      
      // Calculate completion stats for each plan
      return plans.map((plan: BusinessPlan) => {
        const sections = (plan.sections as Record<string, any>) || {};
        const sectionKeys = Object.keys(sections);
        const completedSections = sectionKeys.filter(key => 
          sections[key]?.completed || (sections[key]?.content && sections[key].content.length > 50)
        );
        
        return {
          ...plan,
          sectionsCompleted: completedSections.length,
          totalSections: 9, // Standard business plan sections
          completionPercentage: Math.round((completedSections.length / 9) * 100)
        };
      });
    },
    enabled: !!user
  });

  // Fetch user's chat sessions
  const { data: chatSessions = [], isLoading: isLoadingSessions, error: sessionsError } = useQuery<ChatSession[]>({
    queryKey: ['/api/chat/sessions'],
    queryFn: async () => {
      const response = await fetch('/api/chat/sessions', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to access your chat sessions');
        }
        throw new Error(`Failed to load chat sessions: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user && activeTab === 'sessions'
  });

  // Filter chat sessions based on search and filter criteria
  const filteredSessions = chatSessions.filter(session => {
    const matchesSearch = !chatSearchTerm || 
      session.title.toLowerCase().includes(chatSearchTerm.toLowerCase()) ||
      session.copilotType.toLowerCase().includes(chatSearchTerm.toLowerCase());
    
    const matchesFilter = sessionFilter === 'all' || session.copilotType === sessionFilter;
    
    return matchesSearch && matchesFilter;
  });

  // Group sessions by date for better organization
  const groupSessionsByDate = (sessions: ChatSession[]) => {
    const groups = sessions.reduce((acc, session) => {
      const date = new Date(session.updatedAt || new Date()).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(session);
      return acc;
    }, {} as Record<string, ChatSession[]>);

    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b || '').getTime() - new Date(a || '').getTime())
      .map(([date, sessions]) => ({
        date,
        sessions: sessions.sort((a, b) => new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime())
      }));
  };

  const sessionGroups = groupSessionsByDate(filteredSessions);

  // Helper functions
  const getCopilotDisplayName = (type: string): string => {
    switch (type) {
      case 'business_plan_architect':
        return 'Business Builder';
      case 'funding_navigator':
        return 'Capital Architect';
      case 'growth_engine':
        return 'Growth Engine';
      default:
        return 'Fido Assistant';
    }
  };

  const getCopilotColor = (type: string): string => {
    switch (type) {
      case 'business_plan_architect':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300';
      case 'funding_navigator':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'growth_engine':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatLastActivity = (date: string): string => {
    const now = new Date();
    const updated = new Date(date || new Date());
    const diffMs = now.getTime() - updated.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return updated.toLocaleDateString();
  };

  // Delete business plan mutation
  const deleteMutation = useMutation({
    mutationFn: async (planId: string) => {
      return await apiRequest('DELETE', `/api/business-plans/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-plans'] });
      toast({
        title: "Success",
        description: "Business plan deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete business plan",
        variant: "destructive",
      });
    }
  });

  // Update business plan title mutation
  const updateTitleMutation = useMutation({
    mutationFn: async ({ planId, title }: { planId: string; title: string }) => {
      return await apiRequest('PUT', `/api/business-plans/${planId}/title`, { title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-plans'] });
      setEditingPlanId(null);
      setEditingTitle('');
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

  // Filter plans based on search term
  const filteredPlans = businessPlans.filter(plan =>
    (plan.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (plan.businessName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeletePlan = (planId: string) => {
    if (confirm('Are you sure you want to delete this business plan? This action cannot be undone.')) {
      deleteMutation.mutate(planId);
    }
  };

  const handleCreateNewPlan = () => {
    // Navigate to chat page to start new business plan
    window.location.href = '/chat?agent=business_plan_architect';
  };

  const handleEditTitle = (planId: string, currentTitle: string) => {
    setEditingPlanId(planId);
    setEditingTitle(currentTitle);
  };

  const handleSaveTitle = () => {
    if (editingPlanId && editingTitle.trim()) {
      updateTitleMutation.mutate({
        planId: editingPlanId,
        title: editingTitle.trim()
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingPlanId(null);
    setEditingTitle('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Show loading state while checking authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Card className="max-w-md w-full">
              <CardContent className="p-8 text-center">
                <h2 className="text-xl font-semibold mb-4">Access Your Business Plans</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Please log in to view and manage your business plans.
                </p>
                <Button 
                  onClick={() => window.location.href = '/api/login'}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 text-white"
                  data-testid="button-login"
                >
                  Log In to Continue
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show error states for failed API calls
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Card className="max-w-md w-full">
              <CardContent className="p-8 text-center">
                <h2 className="text-xl font-semibold mb-4 text-red-600">Error Loading Business Plans</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {error instanceof Error ? error.message : 'Something went wrong while loading your business plans.'}
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="w-full"
                    data-testid="button-retry"
                  >
                    Try Again
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/api/login'}
                    className="w-full bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 text-white"
                    data-testid="button-relogin"
                  >
                    Log In Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your business plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/chat">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Chat
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Business Plans & Sessions
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Access your business plans and chat history
                </p>
              </div>
            </div>
            <Button onClick={handleCreateNewPlan} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Business Plan
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Business Plans ({businessPlans.length})
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat Sessions ({chatSessions.length})
            </TabsTrigger>
          </TabsList>

          {/* Business Plans Tab */}
          <TabsContent value="plans" className="mt-6">
            {/* Search for Plans */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search business plans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

        {/* Business Plans Grid */}
        {filteredPlans.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {businessPlans.length === 0 ? 'No business plans yet' : 'No plans match your search'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {businessPlans.length === 0 
                ? 'Create your first business plan to get started' 
                : 'Try adjusting your search terms'}
            </p>
            {businessPlans.length === 0 && (
              <Button onClick={handleCreateNewPlan} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Business Plan
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {editingPlanId === plan.id ? (
                        <div className="flex items-center gap-2 mb-2">
                          <Input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="text-lg font-semibold"
                            placeholder="Enter business plan name"
                            data-testid={`input-plan-title-${plan.id}`}
                          />
                          <Button
                            size="sm"
                            onClick={handleSaveTitle}
                            disabled={updateTitleMutation.isPending || !editingTitle.trim()}
                            data-testid={`button-save-title-${plan.id}`}
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={updateTitleMutation.isPending}
                            data-testid={`button-cancel-edit-${plan.id}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                            {plan.title}
                          </CardTitle>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditTitle(plan.id, plan.title)}
                            className="h-6 w-6 p-0"
                            data-testid={`button-edit-title-${plan.id}`}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                      {plan.businessName && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {plan.businessName}
                        </p>
                      )}
                    </div>
                    <Badge className={getStatusColor(plan.status || 'draft')}>
                      {plan.status || 'draft'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Progress</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {plan.sectionsCompleted}/{plan.totalSections} sections
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${plan.completionPercentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {plan.completionPercentage}% complete
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <Calendar className="w-4 h-4 mr-1" />
                    Updated {formatDate(plan.updatedAt || new Date().toISOString())}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link to={`/business-plans/${plan.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Link to={`/?plan=${plan.id}`} className="flex-1">
                      <Button size="sm" className="w-full">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeletePlan(plan.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>

          {/* Chat Sessions Tab */}
          <TabsContent value="sessions" className="mt-6">
            {/* Search and Filters for Sessions */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search chat sessions..."
                  value={chatSearchTerm}
                  onChange={(e) => setChatSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Filter by Copilot Type */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={sessionFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSessionFilter('all')}
                >
                  All Sessions
                </Button>
                <Button
                  variant={sessionFilter === 'business_plan_architect' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSessionFilter('business_plan_architect')}
                  className="text-emerald-600"
                >
                  Business Builder
                </Button>
                <Button
                  variant={sessionFilter === 'funding_navigator' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSessionFilter('funding_navigator')}
                  className="text-blue-600"
                >
                  Capital Architect
                </Button>
                <Button
                  variant={sessionFilter === 'growth_engine' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSessionFilter('growth_engine')}
                  className="text-purple-600"
                >
                  Growth Engine
                </Button>
              </div>
            </div>

            {/* Sessions List */}
            {isLoadingSessions ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading chat sessions...</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {chatSessions.length === 0 ? 'No chat sessions yet' : 'No sessions match your criteria'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {chatSessions.length === 0 
                    ? 'Start a conversation to see your sessions here' 
                    : 'Try adjusting your search or filter'}
                </p>
                {chatSessions.length === 0 && (
                  <Link to="/">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Start Your First Chat
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {sessionGroups.map(({ date, sessions }) => (
                  <div key={date}>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {date}
                    </h3>
                    <div className="space-y-2">
                      {sessions.map((session) => (
                        <Card key={session.id} className="hover:shadow-md transition-shadow duration-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <Badge className={getCopilotColor(session.copilotType)}>
                                    {getCopilotDisplayName(session.copilotType)}
                                  </Badge>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatLastActivity(session.updatedAt?.toString() || new Date().toISOString())}
                                  </span>
                                </div>
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {session.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  Session ID: {session.id.toString().slice(0, 8)}...
                                </p>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <Link to={`/?session=${session.id}&copilot=${session.copilotType}`}>
                                  <Button size="sm" variant="outline">
                                    <Eye className="w-4 h-4 mr-1" />
                                    Resume
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}