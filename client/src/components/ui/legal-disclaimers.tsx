import React, { useState } from "react";
import { AlertTriangle, Info, Shield, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function ChatDisclaimer() {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  return (
    <Alert className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 relative">
      <Button
        onClick={() => setIsDismissed(true)}
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/40"
      >
        <X className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </Button>
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm pr-8">
        <strong>AI Assistant Notice:</strong> AI can make mistakes. Please double-check the accuracy of responses, especially for important business decisions. This is for informational purposes and not professional financial, legal, or business advice.
      </AlertDescription>
    </Alert>
  );
}

export function BusinessPlanDisclaimer() {
  return (
    <Alert className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
        <strong>Document Notice:</strong> This AI-generated business plan is for informational purposes. AI can make mistakes - please verify important details and consider consulting qualified professionals for business decisions.
      </AlertDescription>
    </Alert>
  );
}

export function LoanMatchingDisclaimer() {
  return (
    <Alert className="mb-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
      <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
        <strong>Lending Notice:</strong> Fido is not a lender or financial advisor. AI suggestions can make mistakes - please verify loan information and consult financial professionals. Loan approval depends on lender criteria.
      </AlertDescription>
    </Alert>
  );
}

export function SecurityNotice() {
  return (
    <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
      <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
      <span>Fido uses encrypted databases and industry-standard security practices. <a href="/privacy" className="text-green-600 hover:text-green-800 underline">Learn more</a></span>
    </div>
  );
}

export function FooterLegalLinks() {
  return (
    <div className="text-center text-sm text-gray-600 dark:text-gray-400 space-x-4">
      <a href="/privacy" className="hover:text-blue-600 underline">Privacy Policy</a>
      <span>•</span>
      <a href="/terms" className="hover:text-blue-600 underline">Terms of Service</a>
      <span>•</span>
      <a href="mailto:legal@fido.ai" className="hover:text-blue-600 underline">Legal</a>
      <span>•</span>
      <a href="mailto:privacy@fido.ai" className="hover:text-blue-600 underline">Data Rights</a>
    </div>
  );
}