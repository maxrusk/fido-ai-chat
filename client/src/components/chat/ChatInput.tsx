import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, FileText, Wrench, PanelRight, PanelRightClose, Loader2, Filter, Tag, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import BusinessPlanToolkit from "./BusinessPlanToolkit";
import FundingToolkit from "./FundingToolkit";
import GrowthToolkit from "./GrowthToolkit";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


interface ChatInputProps {
  currentSessionId: number | null;
  onSessionCreated: (sessionId: number) => void;
  onMessageSent: () => void;
  websocket: WebSocket | null;
  copilotType?: string;
  showBusinessPlan?: boolean;
  onToggleBusinessPlan?: () => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
}

// Business plan categories for filtering
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

export default function ChatInput({ 
  currentSessionId, 
  onSessionCreated, 
  onMessageSent,
  websocket,
  copilotType = 'business_plan_architect',
  showBusinessPlan = false,
  onToggleBusinessPlan,
  selectedCategory = 'all',
  onCategoryChange
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const createSessionMutation = useMutation({
    mutationFn: async (title: string) => {
      console.log('Creating session with:', { title, copilotType });
      const response = await apiRequest('POST', '/api/chat/sessions', { 
        title, 
        copilotType 
      });
      console.log('Session creation response:', response);
      return response;
    },
    onError: (error) => {
      console.error('Session creation error:', error);
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
        description: `Failed to create chat session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ sessionId, content }: { sessionId: number; content: string }) => {
      const response = await apiRequest('POST', `/api/chat/sessions/${sessionId}/messages`, { 
        content,
        copilotType 
      });
      return response;
    },
    onSuccess: () => {
      onMessageSent();
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
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
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const messageContent = message.trim();
    setMessage("");

    try {
      let sessionId = currentSessionId;
      
      if (!sessionId) {
        // Create new session with copilot type
        console.log('Creating new session with copilot type:', copilotType);
        const session = await createSessionMutation.mutateAsync(
          messageContent.length > 50 
            ? messageContent.substring(0, 50) + "..." 
            : messageContent
        );
        sessionId = session.id;
        console.log('New session created with ID:', sessionId);
        console.log('Full session object:', session);
        if (sessionId) {
          onSessionCreated(sessionId);
        }
        
        // If sessionId is still null/undefined, there's an issue with the response
        if (!sessionId) {
          console.error('Session creation failed - no ID returned');
          throw new Error('Failed to create session');
        }
      }

      console.log('Sending message to session:', sessionId);
      
      // Send typing indicator
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
          type: 'typing',
          isTyping: true,
          sessionId
        }));
      }

      // Send message with copilot type
      await sendMessageMutation.mutateAsync({
        sessionId,
        content: messageContent,
      });

      // Stop typing indicator
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
          type: 'typing',
          isTyping: false,
          sessionId
        }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTemplateSelect = async (templatePrompt: string) => {
    try {
      let sessionId = currentSessionId;
      
      if (!sessionId) {
        // Create new session with template title
        const session = await createSessionMutation.mutateAsync(
          templatePrompt.length > 50 
            ? templatePrompt.substring(0, 50) + "..." 
            : templatePrompt
        );
        sessionId = session.id;
        console.log('Template session created with ID:', sessionId);
        if (sessionId) {
          onSessionCreated(sessionId);
        }
        
        if (!sessionId) {
          console.error('Template session creation failed - no ID returned');
          throw new Error('Failed to create session');
        }
      }

      // Send typing indicator
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
          type: 'typing',
          isTyping: true
        }));
      }

      // Send template prompt as message
      await sendMessageMutation.mutateAsync({
        sessionId,
        content: templatePrompt,
      });

      // Stop typing indicator
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
          type: 'typing',
          isTyping: false
        }));
      }
    } catch (error) {
      console.error('Error sending template message:', error);
    }
  };

  return (
    <div className="border-t border-gray-200/20 dark:border-gray-700/30 safe-area-inset-bottom bg-white dark:bg-gray-900 sticky bottom-0 z-10">      
      {/* Mobile-Optimized Message Input Container */}
      <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
        <div className="max-w-4xl mx-auto">
          {/* Mobile-Friendly Chat Input Box */}
          <div className="relative bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
            {/* Input Field */}
            <div className="flex items-end px-3 sm:px-4 py-3 gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <Textarea
                  ref={textareaRef}
                  placeholder="Talk to Fido..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full min-h-[44px] max-h-[120px] sm:max-h-[150px] resize-none text-base sm:text-sm bg-transparent border-none outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 leading-relaxed touch-manipulation"
                  disabled={sendMessageMutation.isPending}
                  rows={1}
                  data-testid="input-chat-message"
                />
              </div>
              
              {/* Mobile-Optimized Action Buttons */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Agent-Specific Toolkit Button */}
                {copilotType === 'business_plan_architect' && (
                <BusinessPlanToolkit
                  onTemplateSelect={handleTemplateSelect}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 sm:h-8 sm:w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors touch-manipulation"
                      data-testid="button-business-plan-toolkit"
                    >
                      <Wrench className="h-5 w-5 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400 hover:text-mint-600 dark:hover:text-mint-400" />
                    </Button>
                  }
                />
              )}
              
              {copilotType === 'funding_navigator' && (
                <FundingToolkit
                  onTemplateSelect={handleTemplateSelect}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 sm:h-8 sm:w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors touch-manipulation"
                      data-testid="button-funding-toolkit"
                    >
                      <svg className="h-5 w-5 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </Button>
                  }
                />
              )}
              
              {copilotType === 'growth_engine' && (
                <GrowthToolkit
                  onTemplateSelect={handleTemplateSelect}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 sm:h-8 sm:w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors touch-manipulation"
                      data-testid="button-growth-toolkit"
                    >
                      <svg className="h-5 w-5 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </Button>
                  }
                />
              )}
              
              {/* Filter Button - Only for Business Plan Architect */}
              {copilotType === 'business_plan_architect' && onCategoryChange && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 sm:h-8 sm:w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors touch-manipulation"
                      data-testid="button-filter-category"
                    >
                      <Filter className={`h-5 w-5 sm:h-4 sm:w-4 ${selectedCategory !== 'all' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {BUSINESS_PLAN_CATEGORIES.map((category) => (
                      <DropdownMenuItem
                        key={category.id}
                        onClick={() => onCategoryChange(category.id)}
                        className={`flex items-center gap-2 ${selectedCategory === category.id ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                      >
                        <span className="text-sm">{category.icon}</span>
                        <span className={`text-sm ${category.color}`}>{category.label}</span>
                        {selectedCategory === category.id && (
                          <Tag className="h-3 w-3 ml-auto text-purple-600" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {/* Business Plan Canvas Toggle - Only for Business Plan Architect */}
              {copilotType === 'business_plan_architect' && onToggleBusinessPlan && (
                <Button
                  onClick={onToggleBusinessPlan}
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 sm:h-8 sm:w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors touch-manipulation"
                  data-testid="button-toggle-business-plan"
                >
                  {showBusinessPlan ? (
                    <PanelRightClose className="h-5 w-5 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400" />
                  ) : (
                    <PanelRight className="h-5 w-5 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400" />
                  )}
                </Button>
              )}
              
              {/* Mobile-Optimized Send Button */}
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
                variant="ghost"
                size="sm"
                className="h-11 w-11 sm:h-8 sm:w-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                data-testid="button-send-message"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <Send className="h-5 w-5 sm:h-4 sm:w-4" />
                )}
              </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
