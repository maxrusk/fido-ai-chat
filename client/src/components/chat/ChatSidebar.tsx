import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Settings, Plus, Trash2, Activity, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { ChatSession } from "@shared/schema";
import fidoLogo from "@assets/fido_logo-full-stacked-black@4x_1754950685097.png";

interface ChatSidebarProps {
  currentSessionId: number | null;
  onSessionSelect: (sessionId: number | null) => void;
  onSettingsClick: () => void;
  activeCopilotType?: string;
  onCopilotChange?: (copilotType: string) => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function ChatSidebar({ 
  currentSessionId, 
  onSessionSelect, 
  onSettingsClick,
  activeCopilotType = 'business_plan_architect',
  onCopilotChange,
  isMobile = false,
  isOpen = true,
  onClose,
  isCollapsed = false,
  onToggleCollapse
}: ChatSidebarProps) {
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
          window.location.href = "/signin";
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

  const handleDeleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this chat session?')) {
      if (currentSessionId === sessionId) {
        onSessionSelect(null);
      }
      await deleteSessionMutation.mutateAsync(sessionId);
    }
  };

  const handleNewChat = () => {
    onSessionSelect(null);
    if (isMobile && onClose) onClose();
  };

  const handleCopilotSwitch = (newCopilotType: string) => {
    if (onCopilotChange) {
      onCopilotChange(newCopilotType);
      // Clear current session when switching agents
      onSessionSelect(null);
    }
  };

  const getCopilotDisplayName = (type: string): string => {
    switch (type) {
      case 'business_plan_architect':
        return 'Business Plan Architect';
      case 'funding_navigator':
        return 'Funding Navigator';
      case 'growth_engine':
        return 'Growth Engine';
      default:
        return 'Business Co-Pilot';
    }
  };

  const getCopilotIcon = (type: string): string => {
    switch (type) {
      case 'business_plan_architect':
        return '📋';
      case 'funding_navigator':
        return '💰';
      case 'growth_engine':
        return '🚀';
      default:
        return '🎯';
    }
  };

  const getCopilotColor = (type: string): string => {
    switch (type) {
      case 'business_plan_architect':
        return 'from-mint-400 to-mint-600';
      case 'funding_navigator':
        return 'from-green-600 to-emerald-600';
      case 'growth_engine':
        return 'from-purple-600 to-pink-600';
      default:
        return 'from-indigo-600 to-rose-600';
    }
  };

  if (isMobile && !isOpen) return null;

  return (
    <div className={`h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-xl border-r border-gray-200/50 dark:border-gray-700/50 relative overflow-hidden transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-full'
    }`}>
      {/* Subtle animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-400/10 dark:via-purple-400/10 dark:to-pink-400/10"></div>
      
      {/* Fido Header with New Chat */}
      <div className="relative z-10 p-6 border-b border-gray-200/30 dark:border-gray-700/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img 
              src={fidoLogo} 
              alt="Fido Financial Logo" 
              className="w-8 h-8 object-contain"
            />
            {!isCollapsed && (
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Fido
              </h1>
            )}
            {/* Mobile Close Button */}
            {isMobile && onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="ml-auto h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isMobile && !isCollapsed && (
              <Button
                onClick={handleNewChat}
                size="sm"
                className="h-8 w-8 p-0 bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-sm transition-all duration-300 hover:scale-110 hover:rotate-90 animate-button-pulse"
              >
                <Plus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </Button>
            )}
            {/* Desktop Collapse Toggle */}
            {!isMobile && onToggleCollapse && (
              <Button
                onClick={onToggleCollapse}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-110"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
        
        {/* Copilot Agent Switcher */}
        {!isCollapsed && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Co-Pilots</p>
            <div className="space-y-2">
              {['business_plan_architect', 'funding_navigator', 'growth_engine'].map((copilotType) => (
                <button
                  key={copilotType}
                  onClick={() => handleCopilotSwitch(copilotType)}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 text-left w-full hover:scale-105 hover:-translate-y-1 ${
                    activeCopilotType === copilotType 
                      ? 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-button-scale' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 animate-button-bounce'
                  }`}
                >
                  <div className={`w-8 h-8 bg-gradient-to-r ${getCopilotColor(copilotType)} rounded-lg flex items-center justify-center text-white text-sm font-semibold`}>
                    {getCopilotIcon(copilotType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {getCopilotDisplayName(copilotType)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {copilotType === 'business_plan_architect' && 'Strategic Planning'}
                      {copilotType === 'funding_navigator' && 'Capital & Funding'}
                      {copilotType === 'growth_engine' && 'Scaling & Growth'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Collapsed Copilot Switcher */}
        {isCollapsed && (
          <div className="space-y-2">
            {['business_plan_architect', 'funding_navigator', 'growth_engine'].map((copilotType) => (
              <button
                key={copilotType}
                onClick={() => handleCopilotSwitch(copilotType)}
                className={`w-full flex items-center justify-center p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                  activeCopilotType === copilotType 
                    ? 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
                title={getCopilotDisplayName(copilotType)}
              >
                <div className={`w-8 h-8 bg-gradient-to-r ${getCopilotColor(copilotType)} rounded-lg flex items-center justify-center text-white text-sm font-semibold`}>
                  {getCopilotIcon(copilotType)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-2">
          {/* Chats Header */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              CHATS
            </h3>
          </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No chat sessions yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Start a conversation to see your history</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => {
                onSessionSelect(Number(session.id));
                if (isMobile && onClose) onClose();
              }}
              className={`group p-3 rounded-lg cursor-pointer transition-all duration-300 relative hover:scale-105 hover:-translate-y-1 ${
                currentSessionId === Number(session.id)
                  ? 'bg-white/50 dark:bg-gray-700/50 animate-button-scale'
                  : 'hover:bg-white/30 dark:hover:bg-gray-700/30 animate-button-slide'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {session.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(session.updatedAt!).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDeleteSession(Number(session.id), e)}
                  className="opacity-0 group-hover:opacity-100 transition-all duration-300 p-1 text-gray-400 hover:text-red-500 hover:scale-110 hover:rotate-6"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
        </div>
      </div>
      
      {/* Bottom Actions - Settings & Logout */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/10 dark:bg-gray-800/50 backdrop-blur-md border-t border-gray-200/30 dark:border-gray-700/30">
        <div className="p-3 space-y-1">
          <Button
            variant="ghost"
            onClick={onSettingsClick}
            className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-700/30 h-10 px-3 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
          >
            <Settings className="h-4 w-4 mr-3 hover:rotate-90 transition-transform duration-300" />
            <span className="text-sm">Settings</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => window.location.href = '/api/logout'}
            className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-700/30 h-10 px-3 transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:text-red-400"
          >
            <svg className="h-4 w-4 mr-3 hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm">Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
