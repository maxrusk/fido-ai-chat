import React from 'react';
import AIFinancialCalculator from '@/components/financial/AIFinancialCalculator';

export default function FinancialProjectionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Financial Projections Calculator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Generate comprehensive financial forecasts using AI-powered analysis of your business profile
          </p>
        </div>
        
        <AIFinancialCalculator />
      </div>
    </div>
  );
}