import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, X, PanelRightClose, PanelRight, Edit3, Save, Undo2, CheckCircle, Cloud, Check } from 'lucide-react';
import jsPDF from 'jspdf';
import fidoLogo from '@assets/fido_logo-full-stacked-black@4x_1754950685097.png';
// Financial projections now handled by separate AI calculator
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface BusinessPlanSection {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  keywords: string[];
}

interface BusinessPlanDocumentProps {
  sessionId: number | null;
  messages: any[];
  isOpen: boolean;
  onToggle: () => void;
  onProgressChange?: (completed: number, total: number, isComplete: boolean) => void;
  onExportPDF?: () => void;
}

const BUSINESS_PLAN_TEMPLATE: BusinessPlanSection[] = [
  {
    id: 'executive_summary',
    title: 'Executive Summary',
    content: '',
    completed: false,
    keywords: ['executive summary', 'overview', 'mission', 'vision', 'key points']
  },
  {
    id: 'business_description',
    title: 'Business Description',
    content: '',
    completed: false,
    keywords: ['business', 'description', 'company', 'what we do', 'industry', 'model']
  },
  {
    id: 'market_analysis',
    title: 'Market Analysis',
    content: '',
    completed: false,
    keywords: ['market', 'industry', 'target market', 'competition', 'analysis', 'customers']
  },
  {
    id: 'products_services',
    title: 'Products & Services',
    content: '',
    completed: false,
    keywords: ['products', 'services', 'offering', 'features', 'benefits', 'development']
  },
  {
    id: 'marketing_plan',
    title: 'Marketing Plan',
    content: '',
    completed: false,
    keywords: ['marketing', 'plan', 'strategy', 'promotion', 'advertising', 'customers']
  },
  {
    id: 'operations_plan',
    title: 'Operations Plan',
    content: '',
    completed: false,
    keywords: ['operations', 'plan', 'processes', 'staffing', 'suppliers', 'location']
  },
  {
    id: 'funding_request',
    title: 'Funding Request',
    content: '',
    completed: false,
    keywords: ['funding', 'investment', 'capital', 'loan', 'money', 'financing']
  },
  {
    id: 'financial_projections',
    title: 'Financial Projections',
    content: '',
    completed: false,
    keywords: ['financial', 'projections', 'revenue', 'profit', 'cash flow', 'budget']
  },
  {
    id: 'owner_bio',
    title: 'Owner Bio',
    content: '',
    completed: false,
    keywords: ['owner', 'bio', 'background', 'experience', 'qualifications', 'leadership']
  }
];

export default function BusinessPlanDocument({ 
  sessionId, 
  messages, 
  isOpen, 
  onToggle,
  onProgressChange,
  onExportPDF
}: BusinessPlanDocumentProps) {
  const [sections, setSections] = useState<BusinessPlanSection[]>(BUSINESS_PLAN_TEMPLATE);
  const [extractedData, setExtractedData] = useState<{[key: string]: string}>({});
  const [currentlyTyping, setCurrentlyTyping] = useState<string | null>(null);
  const [liveContent, setLiveContent] = useState<string>('');
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());
  const [animatingCompletion, setAnimatingCompletion] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevMessageCountRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: async ({ planId, sections }: { planId: string; sections: any }) => {
      return await apiRequest('POST', `/api/business-plans/${planId}/auto-save`, { sections });
    },
    onSuccess: () => {
      setLastSaved(new Date());
      setIsAutoSaving(false);
    },
    onError: (error) => {
      console.error('Auto-save failed:', error);
      setIsAutoSaving(false);
      toast({
        title: "Auto-save failed",
        description: "Your changes weren't saved automatically. Please save manually.",
        variant: "destructive",
      });
    }
  });

  // Load saved business plan content on mount
  useEffect(() => {
    const loadSavedContent = async () => {
      try {
        // Get user's current business plan (or create one)
        const response = await fetch('/api/business-plans/current', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const businessPlan = await response.json();
          
          // Store the business plan ID for future requests and auto-save
          setCurrentPlanId(businessPlan.id);
          sessionStorage.setItem('currentBusinessPlanId', businessPlan.id);
          
          if (businessPlan.contentJson) {
            setExtractedData(businessPlan.contentJson);
            
            // Update sections with saved content
            setSections(prevSections => 
              prevSections.map(section => ({
                ...section,
                content: businessPlan.contentJson[section.id] || section.content,
                completed: businessPlan.contentJson[section.id] && businessPlan.contentJson[section.id].length > 100
              }))
            );
            
            // Set last saved timestamp if business plan has auto-save data
            if (businessPlan.lastAutoSave) {
              setLastSaved(new Date(businessPlan.lastAutoSave));
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved business plan:', error);
      }
    };

    loadSavedContent();
  }, []);

  // WebSocket connection for real-time business plan updates
  useEffect(() => {
    if (!sessionId || !currentPlanId) return;

    // Connect to WebSocket for real-time updates
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WEBSOCKET] Connected for business plan updates');
      // Subscribe to business plan updates for current session
      ws.send(JSON.stringify({
        type: 'subscribe_business_plan',
        sessionId,
        planId: currentPlanId
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'business_plan_update' && data.planId === currentPlanId) {
          console.log('[WEBSOCKET] Received business plan update:', data);
          
          // Update sections with new content from WebSocket
          if (data.sections) {
            const updatedSections = sections.map(section => {
              const newContent = data.sections[section.id];
              if (newContent && newContent !== section.content) {
                // Trigger visual highlight for updated section
                setTimeout(() => {
                  const sectionElement = document.getElementById(`section-${section.id}`);
                  if (sectionElement) {
                    sectionElement.classList.add('animate-pulse', 'border-indigo-500', 'border-2', 'rounded-lg', 'bg-indigo-50', 'dark:bg-indigo-950');
                    setTimeout(() => {
                      sectionElement.classList.remove('animate-pulse', 'border-indigo-500', 'border-2', 'rounded-lg', 'bg-indigo-50', 'dark:bg-indigo-950');
                    }, 3000);
                  }
                }, 100);
                
                return {
                  ...section,
                  content: newContent,
                  completed: newContent.length > 100
                };
              }
              return section;
            });
            
            setSections(updatedSections);
          }
        }
      } catch (error) {
        console.error('[WEBSOCKET] Error parsing message:', error);
      }
    };

    ws.onclose = () => {
      console.log('[WEBSOCKET] Disconnected');
    };

    ws.onerror = (error) => {
      console.error('[WEBSOCKET] Connection error:', error);
    };

    // Cleanup WebSocket on unmount or dependencies change
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [sessionId, currentPlanId, sections]);

  // Auto-save functionality
  const triggerAutoSave = () => {
    if (!currentPlanId || editingSection) return; // Don't auto-save during manual edits
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save (3 seconds after last change)
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (editingSection) return; // Double-check before actually saving
      
      setIsAutoSaving(true);
      const sectionsData = sections.reduce((acc, section) => {
        acc[section.id] = section.content;
        return acc;
      }, {} as any);
      
      autoSaveMutation.mutate({ planId: currentPlanId, sections: sectionsData });
    }, 3000);
  }; // Only run on mount

  // Real-time content extraction from chat messages with enhanced dynamic updates
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const assistantMessages = messages.filter(msg => msg.role === 'assistant');
    const newExtractedData: {[key: string]: string} = {};
    
    // Track if this is an update (modification) vs new content
    const isUpdate = messages.length <= prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;
    
    // Get the latest message to check if AI is currently generating content
    const latestMessage = messages[messages.length - 1];
    const isLatestFromAssistant = latestMessage && latestMessage.role === 'assistant';
    
    // Clear typing indicator if latest message is from user
    if (latestMessage && latestMessage.role === 'user') {
      setCurrentlyTyping(null);
      setLiveContent('');
    }
    
    // If latest message is from assistant, it might be streaming or updating
    if (isLatestFromAssistant) {
      const content = latestMessage.content;
      
      // Check if this content belongs to a specific section
      const currentSection = detectCurrentSection(content);
      if (currentSection) {
        setCurrentlyTyping(currentSection);
        setLiveContent(content);
        
        // For updates/modifications, immediately extract content to show dynamic changes
        if (isUpdate) {
          extractSectionContent(content, newExtractedData);
        }
      }
    }

    // Process all assistant messages to extract business plan content
    assistantMessages.forEach(message => {
      const content = message.content;
      extractSectionContent(content, newExtractedData);
    });

    // Enhanced section update logic with manual edit preservation
    const updatedSections = sections.map(section => {
      const extractedContent = newExtractedData[section.id] || '';
      const previousContent = section.content;
      
      // CRITICAL FIX: Preserve manually edited content during AI extraction
      // If the user is currently editing this section, don't overwrite it
      if (editingSection === section.id) {
        return section; // Keep existing section unchanged during manual edit
      }
      
      // If we have manually saved content that's longer than AI extracted content,
      // prioritize the manual content (user has directly edited)
      const hasManualContent = section.content && section.content.length > 50;
      const aiContentIsLonger = extractedContent.length > section.content.length;
      
      // Only update with AI content if:
      // 1. No manual content exists, OR
      // 2. AI content is substantially longer (user hasn't manually edited), OR  
      // 3. Section was just completed by AI
      const shouldUpdateWithAI = !hasManualContent || aiContentIsLonger || extractedContent.length > 500;
      
      const finalContent = shouldUpdateWithAI ? extractedContent : section.content;
      const isCompleted = finalContent.length > 100;
      const hasContentChanged = finalContent !== previousContent;
      
      // Check if this section just became completed (for animation)
      if (isCompleted && !section.completed && !recentlyCompleted.has(section.id)) {
        setRecentlyCompleted(prev => new Set(prev).add(section.id));
        setAnimatingCompletion(section.id);
        
        // Clear animation state after animation completes
        setTimeout(() => {
          setAnimatingCompletion(null);
        }, 2000);
      }
      
      // Highlight sections that have been modified
      if (hasContentChanged && finalContent.length > 0) {
        console.log(`[DYNAMIC UPDATE] Section ${section.id} content modified`);
        // Trigger a brief visual highlight for the modified section
        setTimeout(() => {
          const sectionElement = document.getElementById(`section-${section.id}`);
          if (sectionElement) {
            sectionElement.classList.add('animate-pulse', 'border-blue-500', 'border-2');
            setTimeout(() => {
              sectionElement.classList.remove('animate-pulse', 'border-blue-500', 'border-2');
            }, 2000);
          }
        }, 100);
      }
      
      return {
        ...section,
        content: finalContent,
        completed: isCompleted
      };
    });

    setSections(updatedSections);
    setExtractedData(newExtractedData);

    // Trigger auto-save if there's new or modified content (but not during manual edits)
    if (Object.keys(newExtractedData).length > 0 && !editingSection) {
      triggerAutoSave();
    }

    // Update progress
    const completedCount = updatedSections.filter(s => s.completed).length;
    if (onProgressChange) {
      onProgressChange(completedCount, BUSINESS_PLAN_TEMPLATE.length, completedCount === BUSINESS_PLAN_TEMPLATE.length);
    }
  }, [messages, onProgressChange, editingSection]);

  const detectCurrentSection = (content: string): string | null => {
    const sectionPatterns = [
      { 
        id: 'executive_summary', 
        patterns: ['## executive summary', '**executive summary**', '# executive summary'],
        keywords: ['executive summary', 'overview', 'mission statement']
      },
      { 
        id: 'business_description', 
        patterns: ['## business description', '**business description**', '# business description'],
        keywords: ['business description', 'company description', 'what we do']
      },
      { 
        id: 'market_analysis', 
        patterns: ['## market analysis', '**market analysis**', '# market analysis'],
        keywords: ['market analysis', 'industry analysis', 'target market']
      },
      { 
        id: 'products_services', 
        patterns: ['## products & services', '**products & services**', '# products & services'],
        keywords: ['products', 'services', 'offering']
      },
      { 
        id: 'marketing_plan', 
        patterns: ['## marketing plan', '**marketing plan**', '# marketing plan'],
        keywords: ['marketing plan', 'marketing strategy']
      },
      { 
        id: 'operations_plan', 
        patterns: ['## operations plan', '**operations plan**', '# operations plan'],
        keywords: ['operations plan', 'operational plan']
      },
      { 
        id: 'financial_projections', 
        patterns: ['## financial projections', '**financial projections**', '# financial projections'],
        keywords: ['financial projections', 'revenue projections']
      },
      { 
        id: 'funding_request', 
        patterns: ['## funding request', '**funding request**', '# funding request'],
        keywords: ['funding request', 'investment needed']
      },
      { 
        id: 'owner_bio', 
        patterns: ['## owner bio', '**owner bio**', '# owner bio'],
        keywords: ['owner bio', 'founder background']
      }
    ];

    const contentLower = content.toLowerCase();
    
    // First check for explicit section headers
    for (const { id, patterns } of sectionPatterns) {
      if (patterns.some(pattern => contentLower.includes(pattern))) {
        return id;
      }
    }
    
    // Then check for keywords only if we have substantial content
    if (content.length > 200) {
      for (const { id, keywords } of sectionPatterns) {
        if (keywords.some(keyword => contentLower.includes(keyword))) {
          return id;
        }
      }
    }
    
    return null;
  };

  const extractSectionContent = (content: string, extractedData: {[key: string]: string}) => {
    const sectionPatterns = [
      { 
        id: 'executive_summary', 
        patterns: ['## Executive Summary', '**Executive Summary**', '# Executive Summary'],
        keywords: ['executive summary', 'overview', 'mission statement', 'company vision', 'key objectives', 'business goals']
      },
      { 
        id: 'business_description', 
        patterns: ['## Business Description', '**Business Description**', '# Business Description'],
        keywords: ['business description', 'company description', 'what we do', 'business model', 'company history']
      },
      { 
        id: 'market_analysis', 
        patterns: ['## Market Analysis', '**Market Analysis**', '# Market Analysis'],
        keywords: ['market analysis', 'target market', 'market size', 'competition', 'competitors', 'market research', 'customer demographics']
      },
      { 
        id: 'products_services', 
        patterns: ['## Products & Services', '**Products & Services**', '# Products & Services'],
        keywords: ['products', 'services', 'offerings', 'features', 'benefits', 'product development']
      },
      { 
        id: 'marketing_plan', 
        patterns: ['## Marketing Plan', '**Marketing Plan**', '# Marketing Plan'],
        keywords: ['marketing plan', 'marketing strategy', 'promotion', 'advertising', 'customer acquisition']
      },
      { 
        id: 'operations_plan', 
        patterns: ['## Operations Plan', '**Operations Plan**', '# Operations Plan'],
        keywords: ['operations', 'operational plan', 'processes', 'staffing', 'suppliers', 'location']
      },
      { 
        id: 'financial_projections', 
        patterns: ['## Financial Projections', '**Financial Projections**', '# Financial Projections'],
        keywords: ['financial projections', 'revenue', 'profit', 'cash flow', 'budget', 'financial forecast']
      },
      { 
        id: 'funding_request', 
        patterns: ['## Funding Request', '**Funding Request**', '# Funding Request'],
        keywords: ['funding', 'investment', 'capital', 'loan', 'financing', 'investor']
      },  
      { 
        id: 'owner_bio', 
        patterns: ['## Owner Bio', '**Owner Bio**', '# Owner Bio'],
        keywords: ['owner bio', 'management team', 'leadership', 'background', 'experience']
      }
    ];

    // Enhanced extraction with keyword fallback for better content detection
    sectionPatterns.forEach(({ id, patterns, keywords }) => {
      let bestMatch = '';
      let bestMatchScore = 0;
      
      // First, try explicit header patterns (highest priority)
      patterns.forEach(pattern => {
        const patternIndex = content.toLowerCase().indexOf(pattern.toLowerCase());
        if (patternIndex !== -1) {
          // Extract content from this header until the next header or end of message
          const afterHeader = content.substring(patternIndex + pattern.length);
          
          // Find where this section ends (next ## or ** header, or end of message)
          const nextHeaderMatch = afterHeader.match(/(\n\n##[^#]|\n\*\*[A-Z][^*]+\*\*)/);
          const sectionContent = nextHeaderMatch 
            ? afterHeader.substring(0, nextHeaderMatch.index || 0).trim()
            : afterHeader.trim();

          if (sectionContent && sectionContent.length > 20) {
            bestMatch = sectionContent;
            bestMatchScore = 100; // Explicit headers get highest score
          }
        }
      });
      
      // If no explicit header found, try keyword-based extraction
      if (bestMatchScore === 0) {
        const contentLower = content.toLowerCase();
        let keywordMatches = 0;
        
        keywords.forEach(keyword => {
          if (contentLower.includes(keyword.toLowerCase())) {
            keywordMatches++;
          }
        });
        
        // If multiple keywords match, this content likely belongs to this section
        if (keywordMatches >= 2) {
          // Extract paragraphs that contain the keywords
          const paragraphs = content.split(/\n\s*\n/);
          const relevantParagraphs = paragraphs.filter(paragraph => {
            const paraLower = paragraph.toLowerCase();
            return keywords.some(keyword => paraLower.includes(keyword.toLowerCase()));
          });
          
          if (relevantParagraphs.length > 0) {
            bestMatch = relevantParagraphs.join('\n\n');
            bestMatchScore = keywordMatches * 10; // Keyword matches get lower score
          }
        }
      }

      // Process the best match found
      if (bestMatch && bestMatchScore > 0) {
        // Clean up the content - remove instructional text and keep only business content
        let cleanContent = bestMatch
          .replace(/\*\*/g, '') // Remove bold markdown
          .replace(/#{1,6}\s/g, '') // Remove header markdown
          .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
          .trim();

        // Filter out instructional/meta text that shouldn't be in business plan
        const instructionalPhrases = [
          'section will help us understand',
          'to tailor this section',
          'here are a few questions',
          'let me know if you',
          'would you like me to',
          'would you like anything',
          'shall we move on',
          'does this capture',
          'let me craft',
          'let me develop',
          'i\'ll create',
          'based on our conversation',
          'now let\'s move to',
          'next section',
          'moving forward',
          'here\'s what i recommend',
          'let\'s dive into',
          'welcome small business owner',
          'what\'s your name',
          'great to meet you',
          'nice to meet you',
          'pleasure to meet you'
        ];

        // Split content into sentences and filter out instructional ones
        const sentences = cleanContent.split(/[.!?]+/).filter(sentence => {
          const lowerSentence = sentence.toLowerCase().trim();
          if (lowerSentence.length < 10) return false;
          
          // Check if sentence contains instructional phrases
          const isInstructional = instructionalPhrases.some(phrase => 
            lowerSentence.includes(phrase.toLowerCase())
          );
          
          // Check if sentence is a question (likely instructional)
          const isQuestion = lowerSentence.includes('?') || 
                           lowerSentence.startsWith('what') ||
                           lowerSentence.startsWith('how') ||
                           lowerSentence.startsWith('would you') ||
                           lowerSentence.startsWith('do you') ||
                           lowerSentence.startsWith('should we') ||
                           lowerSentence.startsWith('can you') ||
                           lowerSentence.startsWith('could you');
          
          // Filter out blue command text patterns
          const isCommandText = lowerSentence.includes('would you like anything') ||
                              lowerSentence.includes('let me know if') ||
                              lowerSentence.includes('shall we') ||
                              lowerSentence.includes('ready to move');
          
          return !isInstructional && !isQuestion && !isCommandText;
        });

        // Rejoin filtered sentences
        const businessContent = sentences.join('.').trim();
        
        // Only update if we have substantial business content (not just instructional text)
        if (businessContent.length > 50 && businessContent.split(' ').length > 10) {
          extractedData[id] = businessContent + (businessContent.endsWith('.') ? '' : '.');
        }
      }
    });
  };

  // Function to extract business name from conversation
  // Editing functionality
  const startEditing = (sectionId: string, currentContent: string) => {
    setEditingSection(sectionId);
    setEditingContent(currentContent);
    setOriginalContent(currentContent);
  };

  const saveEdit = async () => {
    if (!editingSection) return;
    
    try {
      // Get business plan ID from session storage
      const businessPlanId = sessionStorage.getItem('currentBusinessPlanId');
      
      if (!businessPlanId) {
        throw new Error('No business plan ID found. Please refresh the page.');
      }
      
      // Save to backend first
      const response = await fetch(`/api/business-plans/${businessPlanId}/sections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          sectionId: editingSection,
          content: editingContent
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save section to server');
      }

      const result = await response.json();
      
      // Store the business plan ID for future requests
      if (result.businessPlanId) {
        sessionStorage.setItem('currentBusinessPlanId', result.businessPlanId);
      }

      // Update the section content locally
      setSections(prevSections => 
        prevSections.map(section => 
          section.id === editingSection 
            ? { 
                ...section, 
                content: editingContent,
                completed: editingContent.length > 100
              }
            : section
        )
      );

      // Update extracted data immediately for export synchronization
      setExtractedData(prev => ({
        ...prev,
        [editingSection]: editingContent
      }));

      // Manual save triggers immediate auto-save to ensure backend sync
      setTimeout(() => {
        triggerAutoSave();
      }, 100); // Small delay to ensure state updates are processed

      // Clear editing state
      setEditingSection(null);
      setEditingContent('');
      setOriginalContent('');

      // Show success toast
      toast({
        title: "Section Saved",
        description: "Your business plan section has been saved successfully.",
        variant: "default",
      });

      // Update progress
      const updatedSections = sections.map(section => 
        section.id === editingSection 
          ? { ...section, content: editingContent, completed: editingContent.length > 100 }
          : section
      );
      const completedCount = updatedSections.filter(s => s.completed).length;
      if (onProgressChange) {
        onProgressChange(completedCount, BUSINESS_PLAN_TEMPLATE.length, completedCount === BUSINESS_PLAN_TEMPLATE.length);
      }
    } catch (error) {
      console.error('Error saving section:', error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setEditingContent('');
    setOriginalContent('');
  };

  const extractBusinessName = (): string => {
    if (!messages || messages.length === 0) return 'Business Plan';
    
    const allContent = messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => msg.content)
      .join(' ');
    
    // Look for common business name patterns
    const businessNamePatterns = [
      /(?:business name is|company name is|called|named)\s+([A-Za-z0-9\s&]+?)(?:\.|,|\?|!|\s*$)/i,
      /(?:my business|our company|my company)\s+([A-Za-z0-9\s&]+?)(?:\s+is|\s+will|\s+specializes|\s+focuses|\.|,)/i,
      /([A-Za-z0-9\s&]+?)\s+(?:LLC|Inc|Corporation|Corp|Company|Co\.)/i,
      /^([A-Za-z0-9\s&]+?)\s+(?:business plan|company|enterprise)/i
    ];
    
    for (const pattern of businessNamePatterns) {
      const match = allContent.match(pattern);
      if (match && match[1]) {
        const businessName = match[1].trim()
          .replace(/\b(the|a|an)\b/gi, '') // Remove articles
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();
        
        if (businessName.length > 2 && businessName.length < 50) {
          return businessName;
        }
      }
    }
    
    return 'Business Plan';
  };

  // Helper function to fetch financial projections from localStorage or API
  const getFinancialProjections = async () => {
    try {
      // Try to get from localStorage first (modular projections)
      const savedAssumptions = localStorage.getItem('financial_assumptions');
      if (savedAssumptions) {
        const assumptions = JSON.parse(savedAssumptions);
        
        // Calculate projections from saved assumptions
        const projections = [];
        const currentYear = new Date().getFullYear();
        
        for (let year = 0; year < 5; year++) {
          const yearData = currentYear + year;
          let totalRevenue = 0;
          let totalOpex = 0;
          
          // Calculate revenue from all streams
          assumptions.revenueStreams?.forEach((stream: any) => {
            if (stream.yearOneRevenue && stream.growthRate !== undefined) {
              const yearRevenue = stream.yearOneRevenue * Math.pow(1 + (stream.growthRate / 100), year);
              const seasonalRevenue = yearRevenue * (stream.seasonalityFactor || 1);
              totalRevenue += seasonalRevenue;
            }
          });
          
          // Calculate COGS
          const cogs = totalRevenue * ((assumptions.cogsPercentage || 0) / 100);
          const grossProfit = totalRevenue - cogs;
          const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0.0';
          
          // Calculate operating expenses
          assumptions.keyExpenses?.forEach((expense: any) => {
            if (expense.yearOneAmount) {
              if (expense.isFixed) {
                // Fixed expense grows at its own rate
                totalOpex += expense.yearOneAmount * Math.pow(1 + ((expense.growthRate || 0) / 100), year);
              } else {
                // Variable expense - can be percentage of revenue or grows independently
                if (expense.percentageOfRevenue > 0) {
                  totalOpex += totalRevenue * (expense.percentageOfRevenue / 100);
                } else {
                  totalOpex += expense.yearOneAmount * Math.pow(1 + ((expense.growthRate || 0) / 100), year);
                }
              }
            }
          });
          
          const ebitda = grossProfit - totalOpex;
          const ebitdaMargin = totalRevenue > 0 ? ((ebitda / totalRevenue) * 100).toFixed(1) : '0.0';
          
          // Account for depreciation and taxes
          const depreciation = assumptions.depreciation || 0;
          const ebit = ebitda - depreciation;
          const taxes = Math.max(0, ebit * ((assumptions.taxRate || 0) / 100));
          const netIncome = ebit - taxes;
          const netMargin = totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(1) : '0.0';
          
          projections.push({
            year: yearData,
            revenue: Math.round(totalRevenue),
            cogs: Math.round(cogs),
            grossProfit: Math.round(grossProfit),
            grossMargin,
            operatingExpenses: Math.round(totalOpex),
            ebitda: Math.round(ebitda),
            ebitdaMargin,
            depreciation: Math.round(depreciation),
            netIncome: Math.round(netIncome),
            netMargin
          });
        }
        
        return { projections, assumptions };
      }
      
      // Fallback: No financial data available
      return null;
    } catch (error) {
      console.error('Error fetching financial projections:', error);
      return null;
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const exportToPDF = async () => {
    // Call parent export handler if provided
    if (onExportPDF) {
      onExportPDF();
    }
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    let currentY = 40;
    
    // Get business name
    const businessName = extractBusinessName();
    const isBusinessNameDetected = businessName !== 'Business Plan';
    
    // Function to load image as base64
    const loadImageAsBase64 = (src: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.onerror = reject;
        img.src = src;
      });
    };
    
    // Header with Fido logo and branding
    try {
      const logoBase64 = await loadImageAsBase64(fidoLogo);
      pdf.addImage(logoBase64, 'JPEG', 15, 12, 15, 15);
    } catch (logoError) {
      console.log('Logo loading failed, using text fallback');
      // Fallback to text logo
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(29, 78, 216);
      pdf.text('FIDO', 15, 24);
    }
    
    // "Generated by Fido" branding text
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text('Generated by Fido - Digital Superintelligence For Your Business', 35, 20);
    
    // Business name title (or "Business Plan" if not detected)
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    if (isBusinessNameDetected) {
      pdf.text(businessName.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
      currentY += 12;
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'normal');
      pdf.text('BUSINESS PLAN', pageWidth / 2, currentY, { align: 'center' });
    } else {
      pdf.text('BUSINESS PLAN', pageWidth / 2, currentY, { align: 'center' });
    }
    currentY += 20;
    
    // Date and professional details
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    pdf.text(`Prepared on: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;
    
    // Professional separator line
    pdf.setDrawColor(29, 78, 216); // Electric Blue
    pdf.setLineWidth(0.5);
    pdf.line(40, currentY, pageWidth - 40, currentY);
    currentY += 25;
    
    // Table of Contents
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('TABLE OF CONTENTS', 20, currentY);
    currentY += 15;
    
    const completedSectionsList = sections.filter(s => s.content);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    completedSectionsList.forEach((section, index) => {
      const pageNum = Math.floor(index / 2) + 2; // Rough page estimation
      pdf.text(`${index + 1}. ${section.title}`, 25, currentY);
      pdf.text(`${pageNum}`, pageWidth - 30, currentY);
      
      // Dotted line
      const dots = '.'.repeat(Math.floor((pageWidth - 85) / 3));
      pdf.setTextColor(180, 180, 180);
      pdf.text(dots, 85, currentY);
      pdf.setTextColor(0, 0, 0);
      
      currentY += 8;
    });
    
    currentY += 20;
    
    // Start new page for content
    pdf.addPage();
    currentY = 40;
    
    // Add watermark function
    const addWatermark = () => {
      pdf.setGState(pdf.GState({ opacity: 0.1 }));
      pdf.setFontSize(40);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(29, 78, 216);
      pdf.text('FIDO', pageWidth / 2, pageHeight / 2, { 
        align: 'center', 
        angle: 45 
      });
      pdf.setGState(pdf.GState({ opacity: 1 }));
    };
    
    // Get financial projections data
    const financialData = await getFinancialProjections();
    
    // Business plan sections with improved formatting
    sections.forEach((section, sectionIndex) => {
      // Check if we need a new page
      if (currentY > pageHeight - 60) {
        addWatermark();
        pdf.addPage();
        currentY = 40;
      }
      
      // Section number and title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(29, 78, 216); // Electric Blue
      pdf.text(`${sectionIndex + 1}. ${section.title.toUpperCase()}`, 20, currentY);
      
      // Underline
      const titleWidth = pdf.getTextWidth(`${sectionIndex + 1}. ${section.title.toUpperCase()}`);
      pdf.setDrawColor(29, 78, 216);
      pdf.setLineWidth(0.3);
      pdf.line(20, currentY + 2, 20 + titleWidth, currentY + 2);
      
      currentY += 15;
      
      // Section content
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      
      if (section.content && section.content.trim()) {
        // Format content with better line spacing and justification
        const lines = pdf.splitTextToSize(section.content, pageWidth - 40);
        
        lines.forEach((line: string, lineIndex: number) => {
          if (currentY > pageHeight - 30) {
            addWatermark();
            pdf.addPage();
            currentY = 40;
          }
          
          pdf.text(line, 20, currentY);
          currentY += 6; // Better line spacing
        });
        
        currentY += 12; // Section spacing
      } else {
        // Placeholder for incomplete sections
        pdf.setTextColor(150, 150, 150);
        pdf.setFont('helvetica', 'italic');
        pdf.text('[This section will be completed as you continue working with Fido]', 20, currentY);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        currentY += 20;
      }
      
      // Add detailed financial projections spreadsheet for Financial Projections section
      if (section.id === 'financial_projections' && financialData && financialData.projections.length > 0) {
        // Check if we need a new page for the financial table
        if (currentY > pageHeight - 150) {
          addWatermark();
          pdf.addPage();
          currentY = 40;
        }
        
        currentY += 10;
        
        // Financial Projections Table Header
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(29, 78, 216);
        pdf.text('5-Year Financial Projections', 20, currentY);
        currentY += 20;
        
        // Table setup
        const colWidth = (pageWidth - 40) / 6; // 6 columns: Metric + 5 years
        const rowHeight = 8;
        
        // Table headers
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.setFillColor(29, 78, 216);
        
        // Header row background
        pdf.rect(20, currentY - 6, pageWidth - 40, rowHeight, 'F');
        
        // Header text
        pdf.text('Metric', 22, currentY);
        financialData.projections.forEach((proj: any, index: number) => {
          pdf.text(`Year ${index + 1} (${proj.year})`, 22 + colWidth * (index + 1), currentY);
        });
        
        currentY += rowHeight;
        
        // Table rows
        const financialMetrics = [
          { label: 'Total Revenue', key: 'revenue', format: 'currency' },
          { label: 'Cost of Goods Sold', key: 'cogs', format: 'currency' },
          { label: 'Gross Profit', key: 'grossProfit', format: 'currency' },
          { label: 'Gross Margin', key: 'grossMargin', format: 'percent' },
          { label: 'Operating Expenses', key: 'operatingExpenses', format: 'currency' },
          { label: 'EBITDA', key: 'ebitda', format: 'currency' },
          { label: 'EBITDA Margin', key: 'ebitdaMargin', format: 'percent' },
          { label: 'Net Income', key: 'netIncome', format: 'currency' },
          { label: 'Net Margin', key: 'netMargin', format: 'percent' },
        ];
        
        financialMetrics.forEach((metric, rowIndex) => {
          // Alternating row colors
          if (rowIndex % 2 === 0) {
            pdf.setFillColor(248, 249, 250);
            pdf.rect(20, currentY - 6, pageWidth - 40, rowHeight, 'F');
          }
          
          // Row text
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'normal');
          pdf.text(metric.label, 22, currentY);
          
          // Data columns
          financialData.projections.forEach((proj: any, index: number) => {
            const value = proj[metric.key];
            let formattedValue = '';
            
            if (metric.format === 'currency') {
              formattedValue = formatCurrency(value);
            } else if (metric.format === 'percent') {
              formattedValue = `${value}%`;
            } else {
              formattedValue = value?.toString() || '0';
            }
            
            pdf.text(formattedValue, 22 + colWidth * (index + 1), currentY);
          });
          
          currentY += rowHeight;
          
          // Check if we need a new page
          if (currentY > pageHeight - 40) {
            addWatermark();
            pdf.addPage();
            currentY = 40;
          }
        });
        
        // Add revenue streams breakdown if available
        if (financialData.assumptions.revenueStreams && financialData.assumptions.revenueStreams.length > 0) {
          currentY += 15;
          
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(29, 78, 216);
          pdf.text('Revenue Streams Breakdown', 20, currentY);
          currentY += 15;
          
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          
          financialData.assumptions.revenueStreams.forEach((stream: any, index: number) => {
            if (stream.name && stream.yearOneRevenue) {
              const streamText = `• ${stream.name}: ${formatCurrency(stream.yearOneRevenue)} (Year 1) - ${stream.growthRate || 0}% annual growth`;
              pdf.text(streamText, 22, currentY);
              currentY += 8;
              
              if (currentY > pageHeight - 30) {
                addWatermark();
                pdf.addPage();
                currentY = 40;
              }
            }
          });
        }
        
        // Add key assumptions
        if (financialData.assumptions) {
          currentY += 15;
          
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(29, 78, 216);
          pdf.text('Key Financial Assumptions', 20, currentY);
          currentY += 15;
          
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          
          const assumptions = [
            `• Cost of Goods Sold: ${financialData.assumptions.cogsPercentage || 0}% of revenue`,
            `• Tax Rate: ${financialData.assumptions.taxRate || 0}%`,
            `• Annual Depreciation: ${formatCurrency(financialData.assumptions.depreciation || 0)}`,
            `• Working Capital Rate: ${financialData.assumptions.workingCapitalRate || 0}% of revenue`,
          ];
          
          assumptions.forEach((assumption) => {
            pdf.text(assumption, 22, currentY);
            currentY += 8;
            
            if (currentY > pageHeight - 30) {
              addWatermark();
              pdf.addPage();
              currentY = 40;
            }
          });
        }
        
        currentY += 15;
      }
      
      // For Financial Projections section without configured financial data, provide guidance
      if (section.id === 'financial_projections' && (!financialData || !financialData.projections.length)) {
        currentY += 10;
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(29, 78, 216);
        pdf.text('Financial Projections Guide', 20, currentY);
        currentY += 15;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        
        const guidanceText = [
          'To create detailed financial projections for your business plan:',
          '',
          '1. Navigate to the Financial Projections tool in Fido',
          '2. Configure your revenue streams with growth rates',
          '3. Set up expense categories (fixed vs variable)',
          '4. Define key financial parameters (COGS, tax rates, etc.)',
          '5. Review the 5-year projections and export to CSV',
          '',
          'Once configured, re-export your business plan to include',
          'the complete financial spreadsheet with all calculations.'
        ];
        
        guidanceText.forEach((line) => {
          if (currentY > pageHeight - 30) {
            addWatermark();
            pdf.addPage();
            currentY = 40;
          }
          
          pdf.text(line, 22, currentY);
          currentY += 8;
        });
        
        currentY += 15;
      }
    });
    
    // Add Financial Projections Appendix if data is available
    if (financialData && financialData.projections.length > 0) {
      addWatermark();
      pdf.addPage();
      currentY = 40;
      
      // Appendix header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(29, 78, 216);
      pdf.text('APPENDIX: DETAILED FINANCIAL PROJECTIONS', pageWidth / 2, currentY, { align: 'center' });
      currentY += 30;
      
      // Business model summary
      if (financialData.assumptions.revenueStreams && financialData.assumptions.revenueStreams.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(29, 78, 216);
        pdf.text('Revenue Model Overview', 20, currentY);
        currentY += 15;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        
        financialData.assumptions.revenueStreams.forEach((stream: any, index: number) => {
          if (stream.name && stream.yearOneRevenue) {
            const streamDetails = [
              `Revenue Stream ${index + 1}: ${stream.name}`,
              `  • Year 1 Revenue: ${formatCurrency(stream.yearOneRevenue)}`,
              `  • Annual Growth Rate: ${stream.growthRate || 0}%`,
              `  • Seasonality Factor: ${stream.seasonalityFactor || 1.0}x`,
              `  • Recurring: ${stream.isRecurring ? 'Yes' : 'No'}`,
              ''
            ];
            
            streamDetails.forEach((detail) => {
              if (currentY > pageHeight - 30) {
                addWatermark();
                pdf.addPage();
                currentY = 40;
              }
              
              pdf.text(detail, 22, currentY);
              currentY += 8;
            });
          }
        });
        
        currentY += 10;
      }
      
      // Expense model summary
      if (financialData.assumptions.keyExpenses && financialData.assumptions.keyExpenses.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(29, 78, 216);
        pdf.text('Expense Model Overview', 20, currentY);
        currentY += 15;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        
        financialData.assumptions.keyExpenses.forEach((expense: any, index: number) => {
          if (expense.name && expense.yearOneAmount) {
            const expenseDetails = [
              `Expense Category ${index + 1}: ${expense.name}`,
              `  • Year 1 Amount: ${formatCurrency(expense.yearOneAmount)}`,
              `  • Growth Rate: ${expense.growthRate || 0}%`,
              `  • Type: ${expense.isFixed ? 'Fixed Cost' : 'Variable Cost'}`,
              expense.percentageOfRevenue > 0 ? `  • Revenue %: ${expense.percentageOfRevenue}%` : '',
              expense.description ? `  • Description: ${expense.description}` : '',
              ''
            ].filter(detail => detail !== '');
            
            expenseDetails.forEach((detail) => {
              if (currentY > pageHeight - 30) {
                addWatermark();
                pdf.addPage();
                currentY = 40;
              }
              
              pdf.text(detail, 22, currentY);
              currentY += 8;
            });
          }
        });
      }
    }
    
    // Add final watermark
    addWatermark();
    
    // Footer on all pages
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      
      // Footer line
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
      
      // Footer text
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      
      if (isBusinessNameDetected) {
        pdf.text(`${businessName} - Business Plan`, 20, pageHeight - 15);
      } else {
        pdf.text('Business Plan', 20, pageHeight - 15);
      }
      
      pdf.text(`Generated by Fido | Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 15, { align: 'right' });
    }
    
    // Save with business name if detected
    const fileName = isBusinessNameDetected 
      ? `${businessName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_Business_Plan.pdf`
      : 'Business_Plan.pdf';
    
    pdf.save(fileName);
  };

  const completedSections = sections.filter(s => s.completed).length;
  const totalSections = sections.length;
  const completionPercentage = Math.round((completedSections / totalSections) * 100);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Document Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Business Plan Canvas</h3>
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {completedSections}/{totalSections} sections complete ({completionPercentage}%)
              </p>
              {/* Auto-save status indicator */}
              {isAutoSaving ? (
                <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                  <Cloud className="w-3 h-3 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : lastSaved ? (
                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <Check className="w-3 h-3" />
                  <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={exportToPDF}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
          <Button
            onClick={onToggle}
            size="sm"
            variant="ghost"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 overflow-y-auto p-6" ref={documentRef}>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Document Title */}
          <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Business Plan
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Generated by Fido Business Plan Architect • {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Business Plan Sections */}
          {sections.map((section, index) => (
            <div 
              key={section.id} 
              id={`section-${section.id}`}
              className={`space-y-4 transition-all duration-500 ${
                animatingCompletion === section.id 
                  ? 'transform scale-[1.02] shadow-lg border-2 border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50/50 dark:bg-green-950/20' 
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500 ${
                    section.completed 
                      ? animatingCompletion === section.id
                        ? 'bg-green-500 text-white scale-110 shadow-lg animate-pulse'
                        : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : currentlyTyping === section.id
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 animate-pulse'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {section.completed ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <h2 className={`text-xl font-bold transition-colors duration-300 ${
                    section.completed 
                      ? 'text-green-800 dark:text-green-200' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {section.title}
                  </h2>
                  {currentlyTyping === section.id && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  )}
                  {animatingCompletion === section.id && (
                    <div className="flex items-center gap-2 animate-pulse">
                      <div className="text-green-600 dark:text-green-400 font-semibold text-sm">
                        ✨ Section Complete!
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Edit Controls */}
                {section.content && editingSection !== section.id && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => startEditing(section.id, section.content)}
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 min-w-[60px] whitespace-nowrap"
                    >
                      <Edit3 className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span>Edit</span>
                    </Button>
                  </div>
                )}
                
                {editingSection === section.id && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={saveEdit}
                      size="sm"
                      className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      onClick={cancelEdit}
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-xs"
                    >
                      <Undo2 className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="ml-11">
                {editingSection === section.id ? (
                  <div className="space-y-4">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          saveEdit();
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          cancelEdit();
                        }
                      }}
                      placeholder={`Enter content for ${section.title}...`}
                      className="min-h-[200px] resize-none border-indigo-200 dark:border-indigo-800 focus:border-indigo-400 dark:focus:border-indigo-600 focus:ring-indigo-400 dark:focus:ring-indigo-600"
                      autoFocus
                    />
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {editingContent.length} characters
                        {editingContent.length > 100 && (
                          <span className="ml-2 text-green-600 dark:text-green-400">
                            ✓ Sufficient content for completion
                          </span>
                        )}
                      </span>
                      <span className="text-gray-400">
                        Tip: Ctrl+Enter to save • Escape to cancel • Shift+Enter for new lines
                      </span>
                    </div>
                  </div>
                ) : section.content ? (
                  <div className={`space-y-6 transition-all duration-500 ${
                    animatingCompletion === section.id 
                      ? 'animate-fadeInUp' 
                      : ''
                  }`}>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                        {section.content}
                        {currentlyTyping === section.id && liveContent.length > section.content.length && (
                          <span className="text-indigo-600 dark:text-indigo-400 animate-pulse">
                            {liveContent.substring(section.content.length)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Add Financial Projections Spreadsheet for financial projections section */}
                    {section.id === 'financial_projections' && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="font-semibold text-blue-900 dark:text-blue-100">AI Financial Calculator</h3>
                                <p className="text-sm text-blue-700 dark:text-blue-300">Generate detailed financial projections with AI-powered analysis</p>
                              </div>
                            </div>
                            <Button
                              onClick={() => window.open('/financial-calculator', '_blank')}
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              Open Calculator
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`p-6 border-2 border-dashed rounded-lg text-center transition-all duration-300 ${
                    currentlyTyping === section.id
                      ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    <FileText className={`w-8 h-8 mx-auto mb-2 transition-colors duration-300 ${
                      currentlyTyping === section.id 
                        ? 'text-indigo-500 animate-pulse' 
                        : 'text-gray-400'
                    }`} />
                    <p className={`text-sm transition-colors duration-300 ${
                      currentlyTyping === section.id
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {currentlyTyping === section.id 
                        ? 'Fido is working on this section...' 
                        : 'This section will be filled as you work with Fido'
                      }
                    </p>
                    {!currentlyTyping && (
                      <Button
                        onClick={() => startEditing(section.id, '')}
                        size="sm"
                        variant="outline"
                        className="mt-4 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400"
                      >
                        <Edit3 className="w-3 h-3 mr-1" />
                        Add Content
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Progress Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Business Plan Progress: {completedSections} of {totalSections} sections
          </div>
          <div className="flex-1 mx-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-700 ease-out relative"
                style={{ width: `${completionPercentage}%` }}
              >
                {/* Animated shine effect when progress updates */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>
          <div className={`text-sm font-semibold transition-all duration-300 ${
            completionPercentage === 100 
              ? 'text-green-600 dark:text-green-400 animate-pulse' 
              : 'text-gray-900 dark:text-white'
          }`}>
            {completionPercentage}%
            {completionPercentage === 100 && (
              <span className="ml-2 text-xs">🎉 Complete!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}