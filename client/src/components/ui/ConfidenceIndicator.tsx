import React from 'react';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface ConfidenceIndicatorProps {
  confidence: number; // 0-100
  label?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ConfidenceIndicator({ 
  confidence, 
  label,
  showIcon = true,
  size = 'md',
  className = ''
}: ConfidenceIndicatorProps) {
  const getConfidenceLevel = () => {
    if (confidence >= 80) return 'high';
    if (confidence >= 60) return 'medium';
    return 'low';
  };

  const getConfidenceColor = () => {
    const level = getConfidenceLevel();
    switch (level) {
      case 'high':
        return 'text-green-600 dark:text-green-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'text-red-600 dark:text-red-400';
    }
  };

  const getConfidenceIcon = () => {
    const level = getConfidenceLevel();
    const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
    
    switch (level) {
      case 'high':
        return <CheckCircle className={iconSize} />;
      case 'medium':
        return <Shield className={iconSize} />;
      case 'low':
        return <AlertTriangle className={iconSize} />;
    }
  };

  const getConfidenceText = () => {
    if (label) return label;
    const level = getConfidenceLevel();
    return `${confidence}% confidence`;
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  return (
    <div className={`inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full ${sizeClasses[size]} ${className}`}>
      {showIcon && (
        <span className={getConfidenceColor()}>
          {getConfidenceIcon()}
        </span>
      )}
      <span className={`font-medium ${getConfidenceColor()}`}>
        {getConfidenceText()}
      </span>
    </div>
  );
}