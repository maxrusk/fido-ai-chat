import { useState, useEffect } from "react";
import { User, Bot, ArrowRight, Edit3, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@shared/schema";
import fidoLogo from "@assets/fido_logo-full-stacked-black@4x_1754950685097.png";

interface ChatMessageProps {
  message: ChatMessage;
  isLatest?: boolean;
  copilotType?: string;
  onNextSection?: () => void;
  onEditPlan?: () => void;
}

export default function ChatMessage({ 
  message, 
  isLatest = false, 
  copilotType,
  onNextSection,
  onEditPlan
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const [displayedContent, setDisplayedContent] = useState(isUser ? message.content : '');
  const [isTyping, setIsTyping] = useState(false);

  // Typewriter effect for assistant messages
  useEffect(() => {
    if (isAssistant && isLatest && message.content) {
      setIsTyping(true);
      setDisplayedContent('');
      
      let index = 0;
      const typewriterInterval = setInterval(() => {
        if (index < message.content.length) {
          setDisplayedContent(message.content.substring(0, index + 1));
          index++;
        } else {
          setIsTyping(false);
          clearInterval(typewriterInterval);
        }
      }, 15); // Fast typing speed like ChatGPT
      
      return () => clearInterval(typewriterInterval);
    } else if (isAssistant) {
      // For non-latest messages, show full content immediately
      setDisplayedContent(message.content || '');
      setIsTyping(false);
    }
  }, [message.content, isAssistant, isLatest]);

  // Function to detect and categorize message content by business plan section
  const detectMessageCategory = (content: string): { category: string; label: string; color: string } | null => {
    if (!content) return null;
    
    const contentLower = content.toLowerCase();
    
    const BUSINESS_PLAN_CATEGORIES = [
      {
        category: 'executive_summary',
        label: 'Executive Summary',
        color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
        keywords: ['executive summary', 'overview', 'mission statement', 'company vision', 'business goals', 'key objectives']
      },
      {
        category: 'market_analysis',
        label: 'Market Analysis',
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        keywords: ['market analysis', 'target market', 'market size', 'competition', 'competitors', 'market research', 'customer demographics', 'market trends']
      },
      {
        category: 'business_description',
        label: 'Business Description',
        color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        keywords: ['business description', 'company description', 'business model', 'company history', 'business structure', 'business type']
      },
      {
        category: 'products_services',
        label: 'Products & Services',
        color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
        keywords: ['products', 'services', 'offerings', 'features', 'benefits', 'product development', 'service delivery']
      },
      {
        category: 'marketing_plan',
        label: 'Marketing Plan',
        color: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
        keywords: ['marketing plan', 'marketing strategy', 'promotion', 'advertising', 'customer acquisition', 'marketing channels', 'brand strategy']
      },
      {
        category: 'operations_plan',
        label: 'Operations Plan',
        color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
        keywords: ['operations', 'operational plan', 'processes', 'staffing', 'suppliers', 'location', 'logistics', 'supply chain']
      },
      {
        category: 'financial_projections',
        label: 'Financial Projections',
        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
        keywords: ['financial projections', 'revenue', 'profit', 'cash flow', 'budget', 'financial forecast', 'income statement', 'financial planning']
      },
      {
        category: 'funding_request',
        label: 'Funding Request',
        color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
        keywords: ['funding', 'investment', 'capital', 'loan', 'financing', 'investor', 'venture capital', 'angel investor']
      },
      {
        category: 'owner_bio',
        label: 'Owner Bio',
        color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
        keywords: ['owner bio', 'management team', 'leadership', 'background', 'experience', 'qualifications', 'team members']
      }
    ];
    
    // Check for explicit section headers first
    for (const category of BUSINESS_PLAN_CATEGORIES) {
      const sectionName = category.label.toLowerCase();
      if (contentLower.includes(`**${sectionName}**`) || 
          contentLower.includes(`# ${sectionName}`) ||
          contentLower.includes(`## ${sectionName}`)) {
        return category;
      }
    }
    
    // Then check for keyword matches with sufficient content
    if (content.length > 100) {
      for (const category of BUSINESS_PLAN_CATEGORIES) {
        const keywordMatches = category.keywords.filter(keyword => 
          contentLower.includes(keyword)
        ).length;
        
        // If 2+ keywords match, categorize the message
        if (keywordMatches >= 2) {
          return category;
        }
      }
    }
    
    return null;
  };

  // Function to render markdown-style text formatting as HTML
  const renderMessageContent = (content: string) => {
    let formattedText = content;
    
    // Replace **text** with <strong>text</strong> (bold)
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Replace *text* with <em>text</em> (emphasis/italic)
    formattedText = formattedText.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');
    
    return { __html: formattedText };
  };

  // Calculate message category for display
  const messageCategory = detectMessageCategory(message.content || '');
  const showBusinessPlanControls = copilotType === 'business_plan_architect' && isAssistant && !isTyping;

  return (
    <div className={`flex items-start gap-3 sm:gap-3 animate-slide-up px-4 sm:px-6 lg:px-8 ${isUser ? 'justify-end' : ''}`}>
      {isAssistant && (
        <div className="flex flex-col items-center">
          <div className="w-9 h-9 sm:w-8 sm:h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-md flex-shrink-0 flex items-center justify-center">
            <img 
              src={fidoLogo} 
              alt="Fido Logo" 
              className="w-6 h-6 sm:w-6 sm:h-6"
            />
          </div>
          {!isTyping && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
            </div>
          )}
        </div>
      )}
      
      <div className={`flex-1 min-w-0 ${isUser ? 'flex justify-end' : ''}`}>
        <div className={`px-4 py-3 sm:px-4 sm:py-3 max-w-[85%] sm:max-w-2xl group relative ${
          isUser 
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white ml-8 sm:ml-12 rounded-2xl shadow-md' 
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm text-gray-900 dark:text-gray-100'
        }`}>
          {/* Business Plan Section Category */}
          {messageCategory && isAssistant && !isTyping && (
            <div className="flex items-center mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Tag className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${messageCategory.color}`}>
                  {messageCategory.label}
                </span>
              </div>
            </div>
          )}
          
          <div 
            className="whitespace-pre-wrap text-base sm:text-base leading-relaxed message-content touch-manipulation select-text"
            dangerouslySetInnerHTML={renderMessageContent(displayedContent)}
            data-testid="text-message-content"
          />
          {isTyping && (
            <span className="inline-block w-0.5 h-5 bg-current animate-pulse ml-1" />
          )}
          

          
          {/* Business Plan Section Action Buttons */}
          {!isTyping && showBusinessPlanControls && (
            <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
              <Button
                onClick={onNextSection}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs sm:text-sm font-semibold px-3 py-2.5 sm:px-4 sm:py-2 rounded-lg touch-target w-full sm:w-auto hover:scale-105 transition-all flex items-center justify-center gap-2 min-h-[44px] whitespace-nowrap"
                size="sm"
              >
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Next Section</span>
              </Button>
              <Button
                onClick={onEditPlan}
                variant="outline"
                size="sm"
                className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs sm:text-sm font-semibold px-3 py-2.5 sm:px-4 sm:py-2 rounded-lg touch-target w-full sm:w-auto hover:scale-105 transition-all flex items-center justify-center gap-2 min-h-[44px] whitespace-nowrap"
              >
                <Edit3 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Edit Plan</span>
              </Button>
            </div>
          )}
          
          <div className={`text-xs mt-2 opacity-60 ${
            isUser ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {new Date(message.createdAt!).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>

      {isUser && (
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 flex-shrink-0">
          <User className="h-3 w-3 sm:h-4 sm:w-4" />
        </div>
      )}
    </div>
  );
}
