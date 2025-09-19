import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  DollarSign,
  TrendingUp,
  Trash2,
  Calculator
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { ChatSession } from "@shared/schema";
import fidoLogo from "@assets/fido_logo-full-stacked-black@4x_1754950685097.png";

interface FloatingSidebarProps {
  currentSessionId: number | null;
  onSessionSelect: (sessionId: number | null) => void;
  onSettingsClick: () => void;
  activeCopilotType?: string;
  onCopilotChange?: (copilotType: string) => void;
}

export default function FloatingSidebar({ 
  currentSessionId, 
  onSessionSelect, 
  onSettingsClick,
  activeCopilotType = 'business_plan_architect',
  onCopilotChange
}: FloatingSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCoPilotsCollapsed, setIsCoPilotsCollapsed] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery<ChatSession[]>({
    queryKey: ['/api/chat/sessions'],
    retry: false,
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      await apiRequest('DELETE', `/api/chat/sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
      toast({
        title: "Success",
        description: "Chat session deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to delete chat session",
        variant: "destructive",
      });
    },
  });

  const handleNewChat = async () => {
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          title: `New ${getCopilotName(activeCopilotType)} Chat`,
          copilotType: activeCopilotType 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create new chat session');
      }

      const newSession = await response.json();
      onSessionSelect(newSession.id);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
      
      toast({
        title: "Success",
        description: "New chat session created",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new chat session",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSessionMutation.mutate(sessionId);
  };

  const handleCopilotSwitch = (copilotType: string) => {
    if (onCopilotChange) {
      onCopilotChange(copilotType);
    }
  };

  const getCopilotName = (type: string): string => {
    switch (type) {
      case 'business_plan_architect':
        return 'Business Plan Architect';
      case 'funding_navigator':
        return 'Funding Navigator';
      case 'growth_engine':
        return 'Growth Engine';
      default:
        return 'Business Assistant';
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50 flex flex-col gap-3 max-w-sm">
      {/* Main Sidebar Container */}
      <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-500 hover:shadow-2xl animate-slide-in-left ${
        isExpanded ? 'w-80' : 'w-16'
      }`}>
        
        {/* Toggle Button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/30 dark:border-gray-700/30">
          {isExpanded && (
            <div className="flex items-center gap-3">
              <img 
                src={fidoLogo} 
                alt="Fido Logo" 
                className="w-8 h-8 rounded-lg shadow-sm"
              />
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Fido
              </h1>
            </div>
          )}
          
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 transition-all duration-300 hover:scale-110 flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            )}
          </Button>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-0">
            {/* Co-pilots Section */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Co-Pilots
                </div>
                <Button
                  onClick={() => setIsCoPilotsCollapsed(!isCoPilotsCollapsed)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 transition-all duration-300 hover:scale-110"
                >
                  {isCoPilotsCollapsed ? (
                    <ChevronDown className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronUp className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                  )}
                </Button>
              </div>
              
              {/* Collapsible Co-pilots List */}
              <div className={`space-y-3 transition-all duration-500 ease-in-out overflow-hidden ${
                isCoPilotsCollapsed 
                  ? 'max-h-0 opacity-0' 
                  : 'max-h-96 opacity-100'
              }`}>
                {/* Business Plan Architect */}
                <Button
                  onClick={() => handleCopilotSwitch('business_plan_architect')}
                  variant="ghost"
                  className={`w-full h-16 p-3 rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-3 text-left ${
                    activeCopilotType === 'business_plan_architect' 
                      ? 'bg-gradient-to-r from-mint-50 to-mint-100 dark:from-mint-900/20 dark:to-mint-800/20 border border-mint-200 dark:border-mint-700' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      Business Plan Architect
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Strategic Planning
                    </div>
                  </div>
                </Button>

                {/* Funding Navigator */}
                <Button
                  onClick={() => handleCopilotSwitch('funding_navigator')}
                  variant="ghost"
                  className={`w-full h-16 p-3 rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-3 text-left ${
                    activeCopilotType === 'funding_navigator' 
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      Funding Navigator
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Capital & Funding
                    </div>
                  </div>
                </Button>

                {/* Growth Engine */}
                <Button
                  onClick={() => handleCopilotSwitch('growth_engine')}
                  variant="ghost"
                  className={`w-full h-16 p-3 rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-3 text-left ${
                    activeCopilotType === 'growth_engine' 
                      ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      Growth Engine
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Scaling & Growth
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Chat Sessions */}
            <div className="border-t border-gray-200/30 dark:border-gray-700/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Chats
                </div>
                <Button
                  onClick={handleNewChat}
                  size="sm"
                  className="h-6 w-6 p-0 bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-sm transition-all duration-300 hover:scale-110"
                >
                  <Plus className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                </Button>
              </div>

              {/* Session List */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                    No chat sessions yet
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        currentSessionId === Number(session.id)
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700'
                          : ''
                      }`}
                      onClick={() => onSessionSelect(Number(session.id))}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {session.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : 'No date'}
                        </div>
                      </div>
                      <Button
                        onClick={(e) => handleDeleteSession(Number(session.id), e)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-gray-200/30 dark:border-gray-700/30 p-4 space-y-2">
              <Button
                onClick={() => window.location.href = '/financial-projections'}
                variant="ghost"
                className="w-full h-10 justify-start gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105"
              >
                <Calculator className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Financial Projections</span>
              </Button>
              
              <Button
                onClick={onSettingsClick}
                variant="ghost"
                className="w-full h-10 justify-start gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105"
              >
                <Settings className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Settings</span>
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full h-10 justify-start gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105"
              >
                <LogOut className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Logout</span>
              </Button>
            </div>
          </div>
        )}

        {/* Collapsed State - Agent Icons */}
        {!isExpanded && (
          <div className="p-2 space-y-2">
            {/* Business Plan Architect - Collapsed */}
            <Button
              onClick={() => handleCopilotSwitch('business_plan_architect')}
              variant="ghost"
              className={`w-full h-12 p-2 rounded-xl transition-all duration-300 hover:scale-110 flex items-center justify-center ${
                activeCopilotType === 'business_plan_architect' 
                  ? 'bg-gradient-to-r from-mint-50 to-mint-100 dark:from-mint-900/30 dark:to-mint-800/30 border-2 border-mint-300 dark:border-mint-600' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title="Business Plan Architect - Strategic Planning"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white">
                <FileText className="h-4 w-4" />
              </div>
            </Button>

            {/* Funding Navigator - Collapsed */}
            <Button
              onClick={() => handleCopilotSwitch('funding_navigator')}
              variant="ghost"
              className={`w-full h-12 p-2 rounded-xl transition-all duration-300 hover:scale-110 flex items-center justify-center ${
                activeCopilotType === 'funding_navigator' 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-300 dark:border-green-600' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title="Funding Navigator - Capital & Funding"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center text-white">
                <DollarSign className="h-4 w-4" />
              </div>
            </Button>

            {/* Growth Engine - Collapsed */}
            <Button
              onClick={() => handleCopilotSwitch('growth_engine')}
              variant="ghost"
              className={`w-full h-12 p-2 rounded-xl transition-all duration-300 hover:scale-110 flex items-center justify-center ${
                activeCopilotType === 'growth_engine' 
                  ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-300 dark:border-purple-600' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title="Growth Engine - Scaling & Growth"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white">
                <TrendingUp className="h-4 w-4" />
              </div>
            </Button>

            {/* Action Buttons - Collapsed */}
            <div className="border-t border-gray-200/30 dark:border-gray-700/30 pt-2 mt-2 space-y-2">
              <Button
                onClick={handleNewChat}
                variant="ghost"
                className="w-full h-10 p-2 rounded-xl transition-all duration-300 hover:scale-110 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700"
                title="New Chat"
              >
                <Plus className="h-4 w-4 text-gray-500" />
              </Button>

              <Button
                onClick={() => window.location.href = '/financial-projections'}
                variant="ghost"
                className="w-full h-10 p-2 rounded-xl transition-all duration-300 hover:scale-110 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700"
                title="Financial Projections"
              >
                <Calculator className="h-4 w-4 text-gray-500" />
              </Button>

              <Button
                onClick={onSettingsClick}
                variant="ghost"
                className="w-full h-10 p-2 rounded-xl transition-all duration-300 hover:scale-110 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700"
                title="Settings"
              >
                <Settings className="h-4 w-4 text-gray-500" />
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full h-10 p-2 rounded-xl transition-all duration-300 hover:scale-110 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700"
                title="Logout"
              >
                <LogOut className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}