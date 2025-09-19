import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Settings, Zap } from 'lucide-react';

interface ProgressiveDisclosureProps {
  title: string;
  level: 'basic' | 'advanced' | 'expert';
  isOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  description?: string;
}

export default function ProgressiveDisclosure({
  title,
  level,
  isOpen = false,
  children,
  className = '',
  icon,
  description
}: ProgressiveDisclosureProps) {
  const [expanded, setExpanded] = useState(isOpen);

  const getLevelColor = () => {
    switch (level) {
      case 'basic':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'advanced':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'expert':
        return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20';
    }
  };

  const getLevelIcon = () => {
    switch (level) {
      case 'basic':
        return null;
      case 'advanced':
        return <Settings className="w-3 h-3" />;
      case 'expert':
        return <Zap className="w-3 h-3" />;
    }
  };

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-t-lg"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          
          {icon && <span className="text-gray-600 dark:text-gray-400">{icon}</span>}
          
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">{title}</span>
              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getLevelColor()}`}>
                {getLevelIcon()}
                {level}
              </span>
            </div>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
            )}
          </div>
        </div>
      </button>
      
      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
          {children}
        </div>
      )}
    </div>
  );
}