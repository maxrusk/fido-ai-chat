import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import fidoLogo from "@assets/fido_logo-full-stacked-black@4x_1754950685097.png";

interface BetaWelcomePopupProps {
  isVisible: boolean;
  onClose: () => void;
}

export function BetaWelcomePopup({ isVisible, onClose }: BetaWelcomePopupProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-300 p-4">
      <div className="relative max-w-lg w-full max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 z-10"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-center mb-4">
            <img 
              src={fidoLogo} 
              alt="Fido Financial Logo" 
              className="h-12 w-auto object-contain"
            />
          </div>

          <h2 className="text-xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Welcome to Fido Financial Private Beta!
          </h2>

          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>
              Thanks for being part of our Fido Financial private beta! Max and I founded Fido to improve the odds for small business owners everywhere. Too many entrepreneurs have the drive but run into the same roadblocks: unclear plans, execution challenges, and limited access to funding.
            </p>

            <p>
              Fido is your AI-powered business co-pilot, built with the wisdom of legendary founders and the speed of agentic AI, here to help you:
            </p>

            <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-3 space-y-2">
              <div className="flex items-start space-x-2">
                <span className="text-green-600 dark:text-green-400 font-semibold text-xs">•</span>
                <span className="font-medium text-xs">Create a lender-ready business plan in hours, not weeks</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">•</span>
                <span className="font-medium text-xs">Find and secure the right funding faster, with less friction</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-purple-600 dark:text-purple-400 font-semibold text-xs">•</span>
                <span className="font-medium text-xs">Stay on track with proactive, personalized guidance</span>
              </div>
            </div>

            <p>
              In this private beta, you're not just simply trying out software, you're helping shape a platform that could redefine how small businesses are started, funded, and grown. We'll work alongside you, listening to your unfiltered feedback and building Fido into the most powerful ally an entrepreneur can have. Together, we can turn the dream of business ownership into reality for millions.
            </p>

            <p>
              It's a great honor to have you among the very first people to test Fido. You're pioneers in helping us chart this new territory. We also want to be clear: <span className="font-semibold">this is very beta!</span> We're still in the early, experimental phases. You may run into hiccups, bugs, or moments when things don't work exactly as planned. That's part of the process, and your patience (and candor) will help us make Fido faster, smarter, and more useful for every entrepreneur who comes after you.
            </p>

            <p>
              We can't wait to build the future of small business together.
            </p>

            <div className="text-center pt-3">
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                – Max and Bradley, Co-founders of Fido Financial
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <Button 
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BetaWelcomePopup;