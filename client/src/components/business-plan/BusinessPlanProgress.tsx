import React from 'react';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BusinessPlanProgressProps {
  completedSections: number;
  totalSections: number;
  onExportPDF: () => void;
  onSwitchToFunding: () => void;
  isComplete: boolean;
}

export default function BusinessPlanProgress({ 
  completedSections, 
  totalSections, 
  onExportPDF,
  onSwitchToFunding,
  isComplete 
}: BusinessPlanProgressProps) {
  const completionPercentage = Math.round((completedSections / totalSections) * 100);
  
  return (
    <div className="border-b border-gray-200/20 dark:border-gray-700/30 px-3 sm:px-6 py-2 sm:py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">Business Plan</h3>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                  {completionPercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2 mt-1">
                <div 
                  className="bg-indigo-600 h-1.5 sm:h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button
              onClick={onExportPDF}
              disabled={completedSections === 0}
              variant="outline"
              size="sm"
              className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 min-w-[80px] sm:min-w-[90px] whitespace-nowrap"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="ml-1.5">Export</span>
            </Button>
            
            {isComplete && (
              <Button
                onClick={onSwitchToFunding}
                size="sm"
                className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white min-w-[80px] sm:min-w-[90px] whitespace-nowrap"
              >
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="ml-1.5">Funding</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}