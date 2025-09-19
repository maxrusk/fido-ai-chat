import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, Upload } from "lucide-react";
import fidoLogo from "@assets/fido_logo-full-stacked-black@4x_1754950685097.png";


interface WelcomeScreenProps {
  onOptionSelect: (option: 'new_plan' | 'existing_plan') => void;
}

export default function WelcomeScreen({ onOptionSelect }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Welcome Message */}
        <div className="space-y-4">
          <div className="w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <img 
              src={fidoLogo} 
              alt="Fido Financial Logo" 
              className="w-20 h-20 object-contain"
            />
          </div>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Welcome to Fido!
          </h1>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <p className="text-lg text-green-800 dark:text-green-200 font-medium">
              Ready to build your business? Start here.
            </p>
            <p className="text-green-700 dark:text-green-300 mt-2">
              Professional guidance. Strategic insights. Results that matter.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            How can I help you today?
          </h2>
          
          <div className="grid gap-6">
            {/* Create Business Plan From Scratch - Combined Option */}
            <Button
              onClick={() => onOptionSelect('new_plan')}
              variant="outline"
              className="h-auto p-4 sm:p-6 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800 w-full min-h-[80px] touch-target"
              data-testid="button-create-new-plan"
            >
              <div className="flex items-center sm:items-start space-x-3 sm:space-x-4 w-full">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                    Create Business Plan From Scratch
                  </h3>
                </div>
              </div>
            </Button>

            {/* Upload Pre-existing Business Plan */}
            <Button
              onClick={() => onOptionSelect('existing_plan')}
              variant="outline"
              className="h-auto p-4 sm:p-6 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 border-purple-200 dark:border-purple-800 w-full min-h-[80px] touch-target"
              data-testid="button-upload-existing-plan"
            >
              <div className="flex items-center sm:items-start space-x-3 sm:space-x-4 w-full">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                    Upload Your Pre-existing Business Plan
                  </h3>
                </div>
              </div>
            </Button>

          </div>
        </div>

        {/* Footer Note */}
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-8">
          <p>Choose your path. Expert guidance starts now.</p>
        </div>
      </div>
    </div>
  );
}