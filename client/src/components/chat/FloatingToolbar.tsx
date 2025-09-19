import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Wrench, 
  PanelRight, 
  PanelRightClose, 
  ChevronUp, 
  ChevronDown,
  FileText,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import BusinessPlanToolkit from './BusinessPlanToolkit';
import FundingToolkit from './FundingToolkit';
import GrowthToolkit from './GrowthToolkit';

interface FloatingToolbarProps {
  copilotType: string;
  showBusinessPlan: boolean;
  onToggleBusinessPlan: () => void;
  onTemplateSelect: (template: string) => void;
}

export default function FloatingToolbar({ 
  copilotType, 
  showBusinessPlan, 
  onToggleBusinessPlan, 
  onTemplateSelect 
}: FloatingToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCopilotIcon = (type: string) => {
    switch (type) {
      case 'business_plan_architect':
        return <FileText className="h-5 w-5" />;
      case 'funding_navigator':
        return <DollarSign className="h-5 w-5" />;
      case 'growth_engine':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Wrench className="h-5 w-5" />;
    }
  };

  const getCopilotColor = (type: string) => {
    switch (type) {
      case 'business_plan_architect':
        return 'text-indigo-600 hover:text-indigo-700';
      case 'funding_navigator':
        return 'text-green-600 hover:text-green-700';
      case 'growth_engine':
        return 'text-purple-600 hover:text-purple-700';
      default:
        return 'text-gray-600 hover:text-gray-700';
    }
  };

  const getCopilotBg = (type: string) => {
    switch (type) {
      case 'business_plan_architect':
        return 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20';
      case 'funding_navigator':
        return 'hover:bg-green-50 dark:hover:bg-green-900/20';
      case 'growth_engine':
        return 'hover:bg-purple-50 dark:hover:bg-purple-900/20';
      default:
        return 'hover:bg-gray-50 dark:hover:bg-gray-700';
    }
  };

  return (
    <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 flex flex-col gap-3 max-w-sm">
      {/* Main Toolbar Container */}
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:shadow-2xl animate-slide-in-right">
        
        {/* Collapse/Expand Button */}
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="ghost"
          size="sm"
          className={`w-14 h-14 rounded-none border-b border-gray-200/30 dark:border-gray-700/30 ${getCopilotBg(copilotType)} ${getCopilotColor(copilotType)} transition-all duration-300 hover:scale-105 relative group`}
        >
          {getCopilotIcon(copilotType)}
          <div className={`absolute -bottom-px left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r ${
            copilotType === 'business_plan_architect' ? 'from-indigo-500 to-indigo-600' :
            copilotType === 'funding_navigator' ? 'from-green-500 to-green-600' :
            'from-purple-500 to-purple-600'
          } transition-all duration-300 group-hover:w-8`} />
        </Button>

        {/* Expandable Toolbar Content */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          
          {/* Agent-Specific Toolkit */}
          <div className="p-3 space-y-2">
            {copilotType === 'business_plan_architect' && (
              <BusinessPlanToolkit
                onTemplateSelect={onTemplateSelect}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full h-12 ${getCopilotBg(copilotType)} ${getCopilotColor(copilotType)} transition-all duration-300 hover:scale-105 flex items-center justify-center rounded-xl relative group`}
                  >
                    <Wrench className="h-5 w-5" />
                    <span className="absolute left-full ml-3 px-2 py-1 text-xs bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                      Business Plan Tools
                    </span>
                  </Button>
                }
              />
            )}
            
            {copilotType === 'funding_navigator' && (
              <FundingToolkit
                onTemplateSelect={onTemplateSelect}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full h-12 ${getCopilotBg(copilotType)} ${getCopilotColor(copilotType)} transition-all duration-300 hover:scale-105 flex items-center justify-center rounded-xl relative group`}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span className="absolute left-full ml-3 px-2 py-1 text-xs bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                      Funding Tools
                    </span>
                  </Button>
                }
              />
            )}
            
            {copilotType === 'growth_engine' && (
              <GrowthToolkit
                onTemplateSelect={onTemplateSelect}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full h-12 ${getCopilotBg(copilotType)} ${getCopilotColor(copilotType)} transition-all duration-300 hover:scale-105 flex items-center justify-center rounded-xl relative group`}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="absolute left-full ml-3 px-2 py-1 text-xs bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                      Growth Tools
                    </span>
                  </Button>
                }
              />
            )}
          </div>

          {/* Business Plan Canvas Toggle - Only for Business Plan Architect */}
          {copilotType === 'business_plan_architect' && (
            <div className="border-t border-gray-200/30 dark:border-gray-700/30 pt-2">
              <Button
                onClick={onToggleBusinessPlan}
                variant="ghost"
                size="sm"
                className={`w-full h-12 ${getCopilotBg(copilotType)} ${getCopilotColor(copilotType)} transition-all duration-300 hover:scale-105 flex items-center justify-center rounded-xl relative group`}
              >
                {showBusinessPlan ? (
                  <PanelRightClose className="h-5 w-5" />
                ) : (
                  <PanelRight className="h-5 w-5" />
                )}
                <span className="absolute left-full ml-3 px-2 py-1 text-xs bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  {showBusinessPlan ? 'Close Canvas' : 'Open Canvas'}
                </span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Canvas Toggle (Always Visible for Business Plan Architect) */}
      {copilotType === 'business_plan_architect' && (
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:shadow-2xl">
          <Button
            onClick={onToggleBusinessPlan}
            variant="ghost"
            size="sm"
            className={`w-14 h-14 ${getCopilotBg(copilotType)} ${getCopilotColor(copilotType)} transition-all duration-300 hover:scale-110 flex items-center justify-center relative group`}
          >
            {showBusinessPlan ? (
              <PanelRightClose className="h-5 w-5" />
            ) : (
              <PanelRight className="h-5 w-5" />
            )}
            {/* Visual indicator for canvas state */}
            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
              showBusinessPlan ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            } transition-all duration-300`} />
            
            {/* Tooltip */}
            <span className="absolute left-full ml-3 px-3 py-2 text-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
              Business Plan Canvas
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}