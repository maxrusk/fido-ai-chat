import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Building, 
  Target, 
  DollarSign,
  Users,
  Clock,
  X
} from 'lucide-react';

interface ContextItem {
  id: string;
  type: 'business_info' | 'market_data' | 'financial' | 'user_goal' | 'session_history';
  title: string;
  content: string;
  confidence?: number;
  lastUpdated?: Date;
}

interface ContextPanelProps {
  contexts: ContextItem[];
  isVisible: boolean;
  onToggle: () => void;
  onUpdateContext?: (id: string, content: string) => void;
  onRemoveContext?: (id: string) => void;
  className?: string;
}

export default function ContextPanel({
  contexts,
  isVisible,
  onToggle,
  onUpdateContext,
  onRemoveContext,
  className = ''
}: ContextPanelProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getContextIcon = (type: ContextItem['type']) => {
    switch (type) {
      case 'business_info':
        return <Building className="w-4 h-4" />;
      case 'market_data':
        return <Users className="w-4 h-4" />;
      case 'financial':
        return <DollarSign className="w-4 h-4" />;
      case 'user_goal':
        return <Target className="w-4 h-4" />;
      case 'session_history':
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getContextColor = (type: ContextItem['type']) => {
    switch (type) {
      case 'business_info':
        return 'text-blue-600 dark:text-blue-400';
      case 'market_data':
        return 'text-green-600 dark:text-green-400';
      case 'financial':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'user_goal':
        return 'text-purple-600 dark:text-purple-400';
      case 'session_history':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 w-80 flex-shrink-0 ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Context & Memory</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          AI is grounded in this context
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {contexts.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No context loaded yet. Start a conversation to build context.
            </p>
          </div>
        ) : (
          contexts.map((context) => (
            <div
              key={context.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleExpanded(context.id)}
                  className="flex items-center gap-2 text-left flex-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 -m-1"
                >
                  {expandedItems.has(context.id) ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={getContextColor(context.type)}>
                    {getContextIcon(context.type)}
                  </span>
                  <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {context.title}
                  </span>
                </button>
                {onRemoveContext && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveContext(context.id)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>

              {expandedItems.has(context.id) && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {context.content}
                  </p>
                  
                  {context.confidence && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Confidence</span>
                        <span>{context.confidence}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                        <div 
                          className="bg-blue-500 h-1 rounded-full transition-all"
                          style={{ width: `${context.confidence}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {context.lastUpdated && (
                    <p className="text-xs text-gray-500 mt-2">
                      Updated {context.lastUpdated.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}