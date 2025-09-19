import React from 'react';
import { Button } from '@/components/ui/button';
import { Undo, Redo, RotateCcw, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UndoRedoState {
  canUndo: boolean;
  canRedo: boolean;
  lastAction?: string;
  changesCount?: number;
}

interface UndoRedoControlsProps {
  state: UndoRedoState;
  onUndo: () => void;
  onRedo: () => void;
  onResetToOriginal?: () => void;
  showResetWarning?: boolean;
  className?: string;
}

export default function UndoRedoControls({
  state,
  onUndo,
  onRedo,
  onResetToOriginal,
  showResetWarning = false,
  className = ''
}: UndoRedoControlsProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Changes indicator */}
      {state.changesCount && state.changesCount > 0 && (
        <Badge variant="outline" className="text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300">
          {state.changesCount} change{state.changesCount !== 1 ? 's' : ''}
        </Badge>
      )}

      {/* Undo button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onUndo}
        disabled={!state.canUndo}
        className="h-8 px-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800"
        title={state.lastAction ? `Undo: ${state.lastAction}` : 'Undo last action'}
      >
        <Undo className="w-4 h-4" />
      </Button>

      {/* Redo button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRedo}
        disabled={!state.canRedo}
        className="h-8 px-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800"
        title="Redo last undone action"
      >
        <Redo className="w-4 h-4" />
      </Button>

      {/* Reset to original */}
      {onResetToOriginal && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onResetToOriginal}
          disabled={!state.changesCount || state.changesCount === 0}
          className={`h-8 px-2 ${
            showResetWarning 
              ? 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20'
              : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800'
          }`}
          title="Reset to original content"
        >
          <RotateCcw className="w-4 h-4" />
          {showResetWarning && <AlertTriangle className="w-3 h-3 ml-1" />}
        </Button>
      )}

      {/* Last action indicator */}
      {state.lastAction && (
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
          Last: {state.lastAction}
        </span>
      )}
    </div>
  );
}