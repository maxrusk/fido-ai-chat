import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import ChatInterface from '@/components/chat/ChatInterface';

export function ChatPage() {
  const [location] = useLocation();
  const [agentType, setAgentType] = useState<string>('business_plan_architect');
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Check if current user is admin
  const isAdmin = user?.id === import.meta.env.VITE_ADMIN_USER_ID;

  useEffect(() => {
    // Parse URL parameters to determine which agent to load
    const params = new URLSearchParams(window.location.search);
    const agent = params.get('agent');
    
    if (agent && ['business_plan_architect', 'funding_navigator', 'growth_engine'].includes(agent)) {
      setAgentType(agent);
    }
  }, [location]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const getAgentTitle = (type: string): string => {
    switch (type) {
      case 'business_plan_architect':
        return 'Business Plan Builder';
      case 'funding_navigator':
        return 'Funding Navigator';
      case 'growth_engine':
        return 'Growth Engine';
      default:
        return 'Fido Business Co-Pilot';
    }
  };

  const getAgentDescription = (type: string): string => {
    switch (type) {
      case 'business_plan_architect':
        return 'AI expert helps build comprehensive business plans with professional structure and strategic frameworks';
      case 'funding_navigator':
        return 'AI strategist identifies funding sources and creates detailed capital acquisition strategies';
      case 'growth_engine':
        return 'AI advisor develops operational systems and scalable growth strategies for business expansion';
      default:
        return 'AI consultant provides strategic business guidance and execution plans';
    }
  };

  const getAgentColor = (type: string): string => {
    switch (type) {
      case 'business_plan_architect':
        return 'from-blue-500 to-indigo-600';
      case 'funding_navigator':
        return 'from-green-500 to-emerald-600';
      case 'growth_engine':
        return 'from-purple-500 to-pink-600';
      default:
        return 'from-indigo-500 to-purple-600';
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing if not authenticated (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Agent Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 bg-gradient-to-br ${getAgentColor(agentType)} rounded-lg flex items-center justify-center`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {agentType === 'business_plan_architect' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  )}
                  {agentType === 'funding_navigator' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                  {agentType === 'growth_engine' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  )}
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {getAgentTitle(agentType)}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getAgentDescription(agentType)}
                </p>
              </div>
              
              {/* Settings Bar moved to left */}
              <div className="flex items-center gap-4 ml-8">
                {/* Agent Switcher */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAgentType('business_plan_architect')}
                    className={`p-2 rounded-lg transition-colors ${
                      agentType === 'business_plan_architect'
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title="Business Plan Builder"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setAgentType('funding_navigator')}
                    className={`p-2 rounded-lg transition-colors ${
                      agentType === 'funding_navigator'
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title="Funding Navigator"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setAgentType('growth_engine')}
                    className={`p-2 rounded-lg transition-colors ${
                      agentType === 'growth_engine'
                        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title="Growth Engine"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </button>
                </div>
                
                {/* Financial Calculator Button */}
                <button
                  onClick={() => window.open('/financial-calculator', '_blank')}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
                  title="Open AI Financial Calculator"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Financial Calculator
                </button>

                {/* Financial Analysis Button */}
                <button
                  onClick={() => window.location.href = '/financial-analysis'}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded-lg transition-colors"
                  title="Upload and analyze existing business plans"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Plan Analysis
                </button>
                
                {/* Analytics Dashboard Button - Admin Only */}
                {isAdmin && (
                  <button
                    onClick={() => window.open('/analytics', '_blank')}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-lg transition-colors"
                    title="View Analytics Dashboard (Admin Only)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Analytics
                  </button>
                )}
                
                {/* Logout Button */}
                <button
                  onClick={() => window.location.href = '/api/logout'}
                  className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
            <div></div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1">
        <ChatInterface 
          key={agentType} // Force re-render when agent changes
          copilotType={agentType}
        />
      </div>
    </div>
  );
}