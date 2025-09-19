import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { apiRequest } from "@/lib/queryClient";
import ChatSidebar from "./ChatSidebar";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";


import BusinessPlanDocument from "@/components/business-plan/BusinessPlanDocument";
import BusinessPlanProgress from "@/components/business-plan/BusinessPlanProgress";
import SettingsModal from "@/components/modals/SettingsModal";
import DataCollectionModal from "@/components/modals/DataCollectionModal";
import WelcomeScreen from "@/components/welcome/WelcomeScreen";
import { BetaWelcomePopup } from "@/components/welcome/BetaWelcomePopup";
import { ChatDisclaimer, SecurityNotice } from "@/components/ui/legal-disclaimers";

import { Button } from "@/components/ui/button";
import { Settings, FileText, Trash2, ChevronDown, Plus, LogOut, X, FolderOpen } from "lucide-react";
import fidoLogo from "@assets/fido_logo-full-stacked-black@4x_1754950685097.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatMessage as ChatMessageType, ChatSession } from "@shared/schema";

const BUSINESS_PLAN_CATEGORIES = [
  { id: 'all', label: 'All', icon: '📄', color: 'text-gray-600' },
  { id: 'executive_summary', label: 'Executive', icon: '📋', color: 'text-purple-600' },
  { id: 'market_analysis', label: 'Market', icon: '📊', color: 'text-blue-600' },
  { id: 'business_description', label: 'Business', icon: '🏢', color: 'text-green-600' },
  { id: 'products_services', label: 'Products', icon: '📦', color: 'text-orange-600' },
  { id: 'marketing_plan', label: 'Marketing', icon: '📈', color: 'text-pink-600' },
  { id: 'operations_plan', label: 'Operations', icon: '⚙️', color: 'text-indigo-600' },
  { id: 'financial_projections', label: 'Financial', icon: '💰', color: 'text-emerald-600' },
  { id: 'funding_request', label: 'Funding', icon: '💼', color: 'text-yellow-600' },
  { id: 'owner_bio', label: 'Owner', icon: '👤', color: 'text-cyan-600' }
];

const getCopilotTitle = (type: string): string => {
  switch (type) {
    case 'business_plan_architect':
      return 'Business Builder';
    case 'funding_navigator':
      return 'Capital Architect';
    case 'growth_engine':
      return 'Growth Engine';
    default:
      return 'Fido';
  }
};

const getCopilotDescription = (type: string): string => {
  switch (type) {
    case 'business_plan_architect':
      return 'AI expert generates comprehensive business plans with professional structure';
    case 'funding_navigator':
      return 'AI strategist finds funding sources and builds capital acquisition plans';
    case 'growth_engine':
      return 'AI advisor optimizes operations and creates scalable growth strategies';
    default:
      return 'AI consultant provides strategic business guidance and execution plans';
  }
};

const getCopilotGradient = (type: string): string => {
  switch (type) {
    case 'business_plan_architect':
      return 'bg-gradient-to-r from-mint-400 to-mint-600';
    case 'funding_navigator':
      return 'bg-gradient-to-r from-green-600 to-emerald-600';
    case 'growth_engine':
      return 'bg-gradient-to-r from-purple-600 to-pink-600';
    default:
      return 'bg-gradient-to-r from-indigo-600 to-rose-600';
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





export default function ChatInterface({ copilotType = 'business_plan_architect' }: { copilotType?: string }) {
  const { user } = useAuth(); // Get authenticated user
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [activeCopilotType, setActiveCopilotType] = useState<string>(copilotType);
  const [showSettings, setShowSettings] = useState(false);
  const [showDataCollection, setShowDataCollection] = useState(false);
  const [showBusinessPlan, setShowBusinessPlan] = useState(false); // Start collapsed initially
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const [businessPlanWidth, setBusinessPlanWidth] = useState(50); // Percentage width
  const [isResizing, setIsResizing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(activeCopilotType === 'business_plan_architect'); // Only show welcome for business plan architect
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // Chat categorization filter
  const [showBetaWelcome, setShowBetaWelcome] = useState(false); // Beta welcome popup

  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [businessPlanSections, setBusinessPlanSections] = useState({ completed: 0, total: 9, isComplete: false });


  // Fetch current session messages
  const { data: messages = [], isLoading: loadingMessages, refetch: refetchMessages } = useQuery<ChatMessageType[]>({
    queryKey: ['/api/chat/sessions', currentSessionId, 'messages'],
    enabled: !!currentSessionId,
  });

  // Auto-scroll to bottom when new messages arrive or typing indicator changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Check if user has seen beta welcome before - show for all first-time users
  useEffect(() => {
    const hasSeenBetaWelcome = localStorage.getItem('fido-beta-welcome-seen');
    if (!hasSeenBetaWelcome) {
      setShowBetaWelcome(true);
    }
  }, []);

  // Also check when user authentication changes - show for new authenticated users
  useEffect(() => {
    if (user && user.id) {
      const userSpecificKey = `fido-beta-welcome-seen-${user.id}`;
      const hasSeenBetaWelcome = localStorage.getItem(userSpecificKey);
      if (!hasSeenBetaWelcome) {
        setShowBetaWelcome(true);
      }
    }
  }, [user]);



  // Handle copilot type changes and welcome screen logic (only when no URL params are being processed)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasUrlParams = urlParams.get('session') || urlParams.get('plan') || urlParams.get('copilot');
    
    // Only manage welcome screen if no URL parameters are present
    if (!hasUrlParams) {
      if (activeCopilotType === 'business_plan_architect') {
        // For business plan architect, show welcome if no current session
        setShowWelcome(!currentSessionId);
      } else {
        // For funding navigator and growth engine, never show welcome screen
        setShowWelcome(false);
      }
    }
  }, [activeCopilotType, currentSessionId]);

  const handleCloseBetaWelcome = () => {
    setShowBetaWelcome(false);
    // Set both general and user-specific flags
    localStorage.setItem('fido-beta-welcome-seen', 'true');
    if (user && user.id) {
      localStorage.setItem(`fido-beta-welcome-seen-${user.id}`, 'true');
    }
  };

  // Handle URL parameters for session restoration on component mount
  useEffect(() => {
    const handleUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session');
      const copilotParam = urlParams.get('copilot');
      const planId = urlParams.get('plan');

      // If specific session ID is provided, load it directly
      if (sessionId) {
        const sessionIdNum = parseInt(sessionId);
        if (!isNaN(sessionIdNum)) {
          console.log(`[URL-RESTORE] Loading session ${sessionIdNum}`);
          setCurrentSessionId(sessionIdNum);
          setShowWelcome(false);
          
          // Update copilot type if provided
          if (copilotParam && ['business_plan_architect', 'funding_navigator', 'growth_engine'].includes(copilotParam)) {
            setActiveCopilotType(copilotParam);
          }
        }
      }
      // If plan ID is provided, find associated session
      else if (planId) {
        console.log(`[URL-RESTORE] Loading plan ${planId}`);
        findSessionForPlan(planId);
      }
      // Otherwise, try to restore existing session for copilot type
      else {
        restoreSessionForCopilot();
      }
    };

    const findSessionForPlan = async (planId: string) => {
      try {
        const response = await fetch('/api/chat/sessions');
        if (response.ok) {
          const sessions = await response.json();
          
          // Find session associated with this business plan
          const planSession = sessions.find((session: any) => 
            session.businessPlanId?.toString() === planId
          );
          
          if (planSession) {
            console.log(`[PLAN-RESTORE] Found session ${planSession.id} for plan ${planId}`);
            setCurrentSessionId(planSession.id);
            setActiveCopilotType(planSession.copilotType || 'business_plan_architect');
            setShowWelcome(false);
          } else {
            // If no session found for plan, create new session
            setActiveCopilotType('business_plan_architect');
            setShowWelcome(false);
          }
        }
      } catch (error) {
        console.error('[PLAN-RESTORE] Failed to find session for plan:', error);
        setActiveCopilotType('business_plan_architect');
        setShowWelcome(false);
      }
    };

    const restoreSessionForCopilot = async () => {
      if (!currentSessionId && activeCopilotType) {
        try {
          // Try to find existing session for this copilot type
          const response = await fetch('/api/chat/sessions');
          if (response.ok) {
            const sessions = await response.json();
            
            // Find most recent session for current copilot type with auto-save within last 24 hours
            const existingSession = sessions
              .filter((session: any) => 
                session.copilotType === activeCopilotType && 
                session.lastAutoSave && 
                new Date(session.lastAutoSave).getTime() > Date.now() - (24 * 60 * 60 * 1000)
              )
              .sort((a: any, b: any) => new Date(b.lastAutoSave).getTime() - new Date(a.lastAutoSave).getTime())[0];

            if (existingSession) {
              console.log(`[SESSION-RESTORE] Restoring ${activeCopilotType} session ${existingSession.id}`);
              setCurrentSessionId(existingSession.id);
              setShowWelcome(false);
            } else {
              // No existing session found, show welcome for business plan architect
              setShowWelcome(activeCopilotType === 'business_plan_architect');
            }
          }
        } catch (error) {
          console.error('[SESSION-RESTORE] Failed to restore session:', error);
          setShowWelcome(activeCopilotType === 'business_plan_architect');
        }
      }
    };

    // Run URL parameter handling on mount
    handleUrlParams();
  }, []); // Only run once on mount

  // Handle mouse resize functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const containerWidth = window.innerWidth;
      const newBusinessPlanWidth = ((containerWidth - e.clientX) / containerWidth) * 100;
      
      // Constrain between 20% and 80%
      const constrainedWidth = Math.max(20, Math.min(80, newBusinessPlanWidth));
      setBusinessPlanWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Handle Next Section button click - send a user message to continue to next section
  const handleNextSection = async () => {
    if (!currentSessionId) return;
    
    try {
      // Send typing indicator
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'typing',
          isTyping: true,
          sessionId: currentSessionId
        }));
      }

      // Send the "Yes! Let's move onto the next section :)" message
      await apiRequest('POST', `/api/chat/sessions/${currentSessionId}/messages`, {
        content: "Yes! Let's move onto the next section :)"
      });

      // Stop typing indicator
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'typing',
          isTyping: false,
          sessionId: currentSessionId
        }));
      }

      // Refetch messages to show the new message and AI response
      refetchMessages();

      // Also open the Business Plan Canvas for the user to see progress
      if (activeCopilotType === 'business_plan_architect') {
        setShowBusinessPlan(true);
      }
    } catch (error) {
      console.error('Error sending next section message:', error);
    }
  };

  // Handle Edit Plan button click
  const handleEditPlan = () => {
    if (activeCopilotType === 'business_plan_architect') {
      setShowBusinessPlan(true);
    }
  };



  // WebSocket connection
  useEffect(() => {
    if (currentSessionId) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('WebSocket connected');
        socket.send(JSON.stringify({
          type: 'join',
          sessionId: currentSessionId,
          userId: 'current-user'
        }));
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'typing') {
          setIsTyping(data.isTyping);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
      };

      setWs(socket);

      return () => {
        socket.close();
      };
    }
  }, [currentSessionId]);



  // Business plan progress tracking - only count explicit section completions
  useEffect(() => {
    if (activeCopilotType === 'business_plan_architect' && messages.length > 0) {
      const BUSINESS_PLAN_SECTIONS = [
        'executive_summary', 'company_description', 'market_analysis', 
        'organization_management', 'service_products', 'marketing_sales',
        'funding_request', 'financial_projections', 'appendix'
      ];
      
      // Detect when AI moves to next section by looking for section headers/transitions
      const SECTION_INDICATORS = [
        'executive summary', 'business description', 'market analysis', 
        'products & services', 'marketing plan', 'operations plan',
        'financial projections', 'funding request', 'owner bio'
      ];
      
      const assistantMessages = messages.filter((msg: ChatMessageType) => msg.role === 'assistant');
      
      // Track unique sections that have been started/generated
      const sectionsStarted = new Set<string>();
      
      assistantMessages.forEach((msg: ChatMessageType) => {
        const content = msg.content.toLowerCase();
        
        // Look for section headers or substantial content about specific sections
        SECTION_INDICATORS.forEach(section => {
          // Check for section headers (with ** or # formatting)
          const hasHeader = content.includes(`**${section}**`) || 
                           content.includes(`# ${section}`) ||
                           content.includes(`## ${section}`);
          
          // Check for substantial content about this section (300+ chars mentioning the section)
          const hasSubstantialContent = content.includes(section) && 
                                       msg.content.length > 300 &&
                                       content.split(section).length > 2; // Multiple mentions
          
          if (hasHeader || hasSubstantialContent) {
            sectionsStarted.add(section);
          }
        });
      });

      let completedCount = Math.min(sectionsStarted.size, BUSINESS_PLAN_SECTIONS.length);

      // Don't let it exceed total sections
      completedCount = Math.min(completedCount, BUSINESS_PLAN_SECTIONS.length);

      setBusinessPlanSections({
        completed: completedCount,
        total: BUSINESS_PLAN_SECTIONS.length,
        isComplete: completedCount === BUSINESS_PLAN_SECTIONS.length
      });
    }
  }, [messages, activeCopilotType]);

  const handleClearChat = async () => {
    if (!currentSessionId) return;
    
    if (confirm('Are you sure you want to clear this chat history?')) {
      try {
        await fetch(`/api/chat/sessions/${currentSessionId}/messages`, {
          method: 'DELETE',
          credentials: 'include',
        });
        refetchMessages();
      } catch (error) {
        console.error('Error clearing chat:', error);
      }
    }
  };

  const handleExportPDF = () => {
    // Trigger PDF export from BusinessPlanDocument
    setShowBusinessPlan(true);
    
    // If complete, show completion message and offer funding transition
    if (businessPlanSections.isComplete) {
      setTimeout(() => {
        // Add system message suggesting funding transition
        const completionMessage = {
          role: 'assistant',
          content: `🎉 **Congratulations!** Your comprehensive business plan is now complete and exported as PDF. 

You've successfully developed all 9 sections of your business plan with the guidance of our Business Plan Builder. 

**What's Next?**
Now that you have a solid business foundation, it's time to secure the capital you need to bring your vision to life. 

Ready to explore funding options? I can seamlessly connect you with our **Capital Architect** - our elite funding strategist who will analyze your business plan and design the optimal funding strategy using every capital source available (SBA loans, VC, grants, revenue-based financing, and more).

Would you like to transition to funding strategy now?`
        };
        
        // This would typically be sent through the API, but for now just suggest the transition
        console.log('Business plan complete - suggesting funding transition');
      }, 2000);
    }
  };

  const handleSwitchToFunding = async () => {
    // Auto-save current session before switching
    if (currentSessionId && messages.length > 0) {
      try {
        await apiRequest(`/api/chat/sessions/${currentSessionId}/auto-save`, 'POST', { 
          copilotType: activeCopilotType, 
          timestamp: new Date().toISOString() 
        });
        console.log('[AUTO-SAVE] Session saved before copilot switch');
      } catch (error) {
        console.error('[AUTO-SAVE] Failed to save session before switch:', error);
      }
    }
    
    // Switch to funding navigator and preserve session context
    setActiveCopilotType('funding_navigator');
    // Don't reset session ID - let it continue or create new one naturally
    setShowBusinessPlan(false);
  };



  const handleWelcomeOptionSelect = async (option: 'new_plan' | 'existing_plan') => {
    if (option === 'existing_plan') {
      // Redirect directly to financial analysis page for plan upload
      window.location.href = '/financial-analysis';
      return;
    }

    setShowWelcome(false);
    setActiveCopilotType('business_plan_architect'); // Always start with business plan architect
    
    // Import the welcome prompts
    const { getInitialMessage } = await import('@/lib/welcomePrompts');
    const initialPrompt = getInitialMessage(option === 'new_plan' ? 'new_plan' : 'upload_plan');

    // Create a new chat session with the enhanced context
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          copilotType: 'business_plan_architect',
          welcomeFlow: option, // Pass the welcome flow type to the backend
        }),
      });

      if (response.ok) {
        const newSession = await response.json();
        setCurrentSessionId(newSession.id);
        setShowWelcome(false); // Hide welcome screen immediately
        
        // The AI initial response is now generated on the backend with OpenAI
        // Trigger a refresh of messages to show the conversation that started
        setTimeout(() => {
          refetchMessages();
        }, 500); // Slightly longer delay to ensure AI response is generated
      }
    } catch (error) {
      console.error('Error creating welcome session:', error);
      // Fallback - just show the interface without initial message
      setActiveCopilotType('business_plan_architect');
    }
  };

  return (
    <div className="h-screen w-full flex bg-gray-50 dark:bg-gray-900 mobile-safe-area relative overflow-hidden">
      {/* Collapsible Toolbar - Top Right Corner */}
      <div className="fixed top-4 sm:top-6 right-3 sm:right-4 z-50">
        {/* Collapsed State - Small Icon */}
        {!isToolbarExpanded && (
          <Button
            onClick={() => setIsToolbarExpanded(true)}
            className="bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-2xl w-14 h-14 sm:w-12 sm:h-12 flex items-center justify-center hover:scale-105 transition-all touch-manipulation"
            size="sm"
            data-testid="button-expand-toolbar"
          >
            <Settings className="w-6 h-6 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
          </Button>
        )}

        {/* Expanded State - Full Toolbar */}
        {isToolbarExpanded && (
          <div className="bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 rounded-2xl p-4 min-w-[300px] sm:min-w-[280px] max-w-[95vw] sm:max-w-sm w-[90vw] sm:w-auto max-h-[85vh] overflow-y-auto">
            {/* Header with Close Button */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <img 
                  src={fidoLogo} 
                  alt="Fido Financial Logo" 
                  className="w-6 h-6 object-contain"
                />
                <span className="font-semibold text-gray-900 dark:text-white">Fido</span>
              </div>
              <Button
                onClick={() => setIsToolbarExpanded(false)}
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Copilot Selector */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                Active Copilot
              </label>
              <div className="space-y-2">
                {[
                  { type: 'business_plan_architect', name: 'Business Builder', icon: '📋', color: 'from-mint-400 to-mint-600' },
                  { type: 'funding_navigator', name: 'Capital Architect', icon: '💰', color: 'from-green-600 to-emerald-600' },
                  { type: 'growth_engine', name: 'Growth Engine', icon: '🚀', color: 'from-purple-600 to-pink-600' }
                ].map(copilot => (
                  <button
                    key={copilot.type}
                    onClick={async () => {
                      // Auto-save current session before switching
                      if (currentSessionId && messages.length > 0 && activeCopilotType !== copilot.type) {
                        try {
                          await apiRequest(`/api/chat/sessions/${currentSessionId}/auto-save`, 'POST', { 
                              copilotType: activeCopilotType, 
                              timestamp: new Date().toISOString(),
                              switchingTo: copilot.type 
                            });
                          console.log('[AUTO-SAVE] Session saved before copilot switch');
                        } catch (error) {
                          console.error('[AUTO-SAVE] Failed to save session before switch:', error);
                        }
                      }
                      
                      setActiveCopilotType(copilot.type);
                      setIsToolbarExpanded(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                      activeCopilotType === copilot.type
                        ? `bg-gradient-to-r ${copilot.color} text-white`
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span className="text-lg">{copilot.icon}</span>
                    <span className="font-medium text-sm">{copilot.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Button
                onClick={async () => {
                  // Auto-save current session before creating new one
                  if (currentSessionId && messages.length > 0) {
                    try {
                      await apiRequest(`/api/chat/sessions/${currentSessionId}/auto-save`, 'POST', { 
                          copilotType: activeCopilotType, 
                          timestamp: new Date().toISOString(),
                          action: 'new_chat'
                        });
                      console.log('[AUTO-SAVE] Session saved before creating new chat');
                    } catch (error) {
                      console.error('[AUTO-SAVE] Failed to save session before new chat:', error);
                    }
                  }
                  
                  setCurrentSessionId(null);
                  setIsToolbarExpanded(false);
                }}
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
              
              {activeCopilotType === 'business_plan_architect' && (
                <>
                  <Button
                    onClick={() => {
                      setShowBusinessPlan(!showBusinessPlan);
                      setIsToolbarExpanded(false);
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    {showBusinessPlan ? 'Hide' : 'Show'} Business Plan
                  </Button>
                  
                  <Button
                    onClick={() => {
                      window.location.href = '/business-plans';
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900"
                  >
                    <FolderOpen className="w-4 h-4" />
                    My Business Plans
                  </Button>
                </>
              )}



              <Button
                onClick={() => {
                  setShowSettings(true);
                  setIsToolbarExpanded(false);
                }}
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>

              {currentSessionId && (
                <Button
                  onClick={() => {
                    handleClearChat();
                    setIsToolbarExpanded(false);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Chat
                </Button>
              )}

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => {
                    window.location.href = '/api/logout';
                  }}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-gray-600 dark:text-gray-400"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Full Width Chat Area */}
      <div className="flex h-screen w-full">
        
        {/* Chat Area */}
        <div 
          className="flex flex-col transition-all duration-300"
          style={{
            width: activeCopilotType === 'business_plan_architect' && showBusinessPlan 
              ? `${100 - businessPlanWidth}%` 
              : '100%'
          }}
        >
        





        {/* Maximized Chat Messages Container */}
        <div className="flex-1 overflow-y-auto mobile-scroll responsive-container chat-dot-grid">
          <div className="space-y-3 sm:space-y-4 max-width-container py-2 sm:py-4 min-h-0">
            <ChatDisclaimer />
            {showWelcome && activeCopilotType === 'business_plan_architect' ? (
              <WelcomeScreen onOptionSelect={handleWelcomeOptionSelect} />
            ) : !currentSessionId ? (
              <div className="flex items-center justify-center min-h-[50vh] sm:min-h-[60vh]">
                <div className="text-center max-w-md px-4">
                  <div className="pixel-gradient-orb w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl font-semibold mx-auto mb-4 sm:mb-6 neo-brutal-card">
                    {getCopilotIcon(activeCopilotType)}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                    {getCopilotTitle(activeCopilotType)}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed">
                    {getCopilotDescription(activeCopilotType)}
                  </p>
                </div>
              </div>
          ) : (
            <>
              {/* Chat Category Filter - Contemporary AI Style */}


              {loadingMessages ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
                </div>
              ) : (
                (() => {
                  // Filter messages by selected category
                  const filteredMessages = selectedCategory === 'all' ? messages : messages.filter((message) => {
                    if (message.role === 'user') return true; // Always show user messages
                    
                    // Check if message belongs to selected category
                    const content = message.content.toLowerCase();
                    const category = BUSINESS_PLAN_CATEGORIES.find(cat => cat.id === selectedCategory);
                    
                    if (!category || category.id === 'all') return true;
                    
                    // Define keywords for each category (same as in ChatMessage component)
                    const categoryKeywords: Record<string, string[]> = {
                      'executive_summary': ['executive summary', 'overview', 'mission statement', 'company vision', 'business goals', 'key objectives'],
                      'market_analysis': ['market analysis', 'target market', 'market size', 'competition', 'competitors', 'market research', 'customer demographics', 'market trends'],
                      'business_description': ['business description', 'company description', 'business model', 'company history', 'business structure', 'business type'],
                      'products_services': ['products', 'services', 'offerings', 'features', 'benefits', 'product development', 'service delivery'],
                      'marketing_plan': ['marketing plan', 'marketing strategy', 'promotion', 'advertising', 'customer acquisition', 'marketing channels', 'brand strategy'],
                      'operations_plan': ['operations', 'operational plan', 'processes', 'staffing', 'suppliers', 'location', 'logistics', 'supply chain'],
                      'financial_projections': ['financial projections', 'revenue', 'profit', 'cash flow', 'budget', 'financial forecast', 'income statement', 'financial planning'],
                      'funding_request': ['funding', 'investment', 'capital', 'loan', 'financing', 'investor', 'venture capital', 'angel investor'],
                      'owner_bio': ['owner bio', 'management team', 'leadership', 'background', 'experience', 'qualifications', 'team members']
                    };
                    
                    const keywords = categoryKeywords[selectedCategory] || [];
                    return keywords.some(keyword => content.includes(keyword)) && message.content.length > 100;
                  });
                  
                  return filteredMessages.map((message, index) => (
                    <ChatMessage 
                      key={message.id} 
                      message={message} 
                      isLatest={index === filteredMessages.length - 1 && message.role === 'assistant'}
                      copilotType={activeCopilotType}
                      onNextSection={() => handleNextSection()}
                      onEditPlan={() => handleEditPlan()}
                    />
                  ));
                })()
              )}
              
              {isTyping && (
                <div className="flex items-start gap-3">
                  <div className="pixel-gradient-orb w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {getCopilotIcon(activeCopilotType)}
                  </div>
                  <div className="ai-message-bubble px-4 py-3 max-w-xs">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
          </div>
        </div>

          {/* Message Input - Hidden during welcome screen */}
          {!showWelcome && (
            <ChatInput
              currentSessionId={currentSessionId}
              onSessionCreated={setCurrentSessionId}
              onMessageSent={refetchMessages}
              websocket={ws}
              copilotType={activeCopilotType}
              showBusinessPlan={showBusinessPlan}
              onToggleBusinessPlan={() => setShowBusinessPlan(!showBusinessPlan)}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          )}
        </div>





        {/* Resize Handle */}
        {activeCopilotType === 'business_plan_architect' && showBusinessPlan && (
          <div
            className={`w-2 bg-gray-200 dark:bg-gray-700 hover:bg-blue-400 dark:hover:bg-blue-500 cursor-col-resize flex-shrink-0 relative group transition-all duration-200 ${
              isResizing ? 'bg-blue-500 dark:bg-blue-400 w-3' : ''
            }`}
            onMouseDown={handleResizeStart}
            title="Drag to resize business plan panel"
          >
            {/* Active resize indicator */}
            <div className={`absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-1 bg-blue-500 dark:bg-blue-400 transition-opacity duration-200 ${
              isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}></div>
            
            {/* Resize grip dots */}
            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200 ${
              isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
              <div className="flex flex-col gap-1">
                <div className="w-1 h-1 bg-blue-600 dark:bg-blue-300 rounded-full"></div>
                <div className="w-1 h-1 bg-blue-600 dark:bg-blue-300 rounded-full"></div>
                <div className="w-1 h-1 bg-blue-600 dark:bg-blue-300 rounded-full"></div>
              </div>
            </div>

            {/* Resize tooltip */}
            <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap transition-opacity duration-200 pointer-events-none ${
              isResizing ? 'opacity-100' : 'opacity-0'
            }`}>
              {businessPlanWidth.toFixed(0)}% width
            </div>
          </div>
        )}

        {/* Business Plan Document Canvas - Only for Business Plan Architect */}
        {activeCopilotType === 'business_plan_architect' && showBusinessPlan && (
          <div 
            className="border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-all duration-300"
            style={{ width: `${businessPlanWidth}%` }}
          >
            <BusinessPlanDocument
              sessionId={currentSessionId}
              messages={messages}
              isOpen={showBusinessPlan}
              onToggle={() => setShowBusinessPlan(!showBusinessPlan)}
              onProgressChange={(completed, total, isComplete) => {
                setBusinessPlanSections({ completed, total, isComplete });
              }}
              onExportPDF={() => {
                console.log('PDF exported from business plan document');
              }}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <DataCollectionModal
        isOpen={showDataCollection}
        onClose={() => setShowDataCollection(false)}
      />

      {/* Beta Welcome Popup */}
      <BetaWelcomePopup 
        isVisible={showBetaWelcome} 
        onClose={handleCloseBetaWelcome} 
      />
    </div>
  );
}
