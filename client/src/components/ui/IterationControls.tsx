import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, ThumbsUp, ThumbsDown, Edit, Sparkles, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface IterationControlsProps {
  onRegenerate?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  onImprove?: () => void;
  onAlternatives?: () => void;
  isGenerating?: boolean;
  showApproval?: boolean;
  showEdit?: boolean;
  showImprove?: boolean;
  className?: string;
}

export default function IterationControls({
  onRegenerate,
  onApprove,
  onReject,
  onEdit,
  onImprove,
  onAlternatives,
  isGenerating = false,
  showApproval = true,
  showEdit = true,
  showImprove = true,
  className = ''
}: IterationControlsProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Primary actions */}
      <div className="flex items-center gap-1">
        {showApproval && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onApprove}
              disabled={isGenerating}
              className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
            >
              <ThumbsUp className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReject}
              disabled={isGenerating}
              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
            >
              <ThumbsDown className="w-4 h-4" />
            </Button>
          </>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onRegenerate}
          disabled={isGenerating}
          className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Secondary actions in dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isGenerating}
            className="h-8 px-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {showEdit && onEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit content
            </DropdownMenuItem>
          )}
          {showImprove && onImprove && (
            <DropdownMenuItem onClick={onImprove}>
              <Sparkles className="w-4 h-4 mr-2" />
              Improve quality
            </DropdownMenuItem>
          )}
          {onAlternatives && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onAlternatives}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Show alternatives
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}