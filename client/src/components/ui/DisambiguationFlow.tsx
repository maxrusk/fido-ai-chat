import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Check, X, Lightbulb, Target } from 'lucide-react';

interface DisambiguationOption {
  id: string;
  title: string;
  description: string;
  confidence?: number;
  preview?: string;
  category?: string;
}

interface DisambiguationFlowProps {
  prompt: string;
  options: DisambiguationOption[];
  onSelect: (option: DisambiguationOption) => void;
  onRefine: (refinement: string) => void;
  onReject: () => void;
  isVisible: boolean;
  className?: string;
}

export default function DisambiguationFlow({
  prompt,
  options,
  onSelect,
  onRefine,
  onReject,
  isVisible,
  className = ''
}: DisambiguationFlowProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showRefinement, setShowRefinement] = useState(false);
  const [refinementInput, setRefinementInput] = useState('');

  if (!isVisible) return null;

  const handleOptionSelect = (option: DisambiguationOption) => {
    setSelectedOption(option.id);
    onSelect(option);
  };

  const handleRefinement = () => {
    if (refinementInput.trim()) {
      onRefine(refinementInput);
      setRefinementInput('');
      setShowRefinement(false);
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'bg-gray-100 dark:bg-gray-800';
    if (confidence >= 80) return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300';
    if (confidence >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300';
    return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
              Let's clarify your request
            </CardTitle>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            I found multiple ways to interpret: <em>"{prompt}"</em>
          </p>
        </CardHeader>
      </Card>

      <div className="grid gap-3">
        {options.map((option) => (
          <Card
            key={option.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedOption === option.id
                ? 'ring-2 ring-blue-500 border-blue-500'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => handleOptionSelect(option)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {option.title}
                    </h3>
                    {option.category && (
                      <Badge variant="outline" className="text-xs">
                        {option.category}
                      </Badge>
                    )}
                    {option.confidence && (
                      <Badge className={`text-xs ${getConfidenceColor(option.confidence)}`}>
                        {option.confidence}% match
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {option.description}
                  </p>
                  {option.preview && (
                    <div className="text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 p-2 rounded italic">
                      Preview: {option.preview}
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  {selectedOption === option.id ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRefinement(!showRefinement)}
            className="flex items-center gap-2"
          >
            <Lightbulb className="w-4 h-4" />
            Refine request
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReject}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
            None of these
          </Button>
        </div>
      </div>

      {showRefinement && (
        <Card className="border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              How can I better understand your request?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={refinementInput}
                onChange={(e) => setRefinementInput(e.target.value)}
                placeholder="Provide more specific details..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleRefinement()}
              />
              <Button size="sm" onClick={handleRefinement}>
                Refine
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}