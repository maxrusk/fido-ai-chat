import React from 'react';
import { Brain, Search, FileText, Calculator, Target } from 'lucide-react';

interface AIThinkingIndicatorProps {
  stage?: 'analyzing' | 'researching' | 'generating' | 'calculating' | 'optimizing' | 'thinking';
  description?: string;
  progress?: number;
  className?: string;
}

export default function AIThinkingIndicator({ 
  stage = 'thinking', 
  description,
  progress,
  className = ''
}: AIThinkingIndicatorProps) {
  const getStageIcon = () => {
    switch (stage) {
      case 'analyzing':
        return <Brain className="w-4 h-4" />;
      case 'researching':
        return <Search className="w-4 h-4" />;
      case 'generating':
        return <FileText className="w-4 h-4" />;
      case 'calculating':
        return <Calculator className="w-4 h-4" />;
      case 'optimizing':
        return <Target className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getStageMessage = () => {
    if (description) return description;
    
    switch (stage) {
      case 'analyzing':
        return 'Analyzing your business context...';
      case 'researching':
        return 'Researching market insights...';
      case 'generating':
        return 'Generating strategic content...';
      case 'calculating':
        return 'Running financial projections...';
      case 'optimizing':
        return 'Optimizing recommendations...';
      default:
        return 'Processing your request...';
    }
  };

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
        <div className="animate-pulse">
          {getStageIcon()}
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 max-w-md flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getStageMessage()}
          </div>
        </div>
        
        {/* Progress bar if provided */}
        {progress !== undefined && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
        
        {/* Animated thinking dots */}
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}