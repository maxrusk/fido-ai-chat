import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Shield, FileText, Database } from "lucide-react";
import { Link } from "wouter";

interface LegalConsentProps {
  onAccept: (consents: ConsentData) => void;
  onDecline: () => void;
}

export interface ConsentData {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  dataProcessingConsent: boolean;
  aiTrainingConsent: boolean;
  timestamp: string;
}

export function LegalConsent({ onAccept, onDecline }: LegalConsentProps) {
  const [consents, setConsents] = useState({
    termsAccepted: false,
    privacyAccepted: false,
    dataProcessingConsent: false,
    aiTrainingConsent: false,
  });

  const handleConsentChange = (key: keyof typeof consents, checked: boolean) => {
    setConsents(prev => ({ ...prev, [key]: checked }));
  };

  const canProceed = consents.termsAccepted && consents.privacyAccepted && consents.dataProcessingConsent;

  const handleAccept = () => {
    if (canProceed) {
      onAccept({
        ...consents,
        timestamp: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Fido</CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            Before we begin, we need your consent for data processing and AI assistance
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-amber-800 dark:text-amber-200">
              <p className="font-semibold">AI-Powered Business Assistance</p>
              <p className="text-sm mt-1">Fido uses artificial intelligence to provide business advice. This is not professional financial, legal, or lending advice.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>Required Agreements</span>
            </h3>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id="terms"
                  checked={consents.termsAccepted}
                  onCheckedChange={(checked) => handleConsentChange('termsAccepted', checked as boolean)}
                />
                <div className="flex-1">
                  <label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                    I agree to the <Link href="/terms" className="text-blue-600 hover:text-blue-800 underline">Terms of Service</Link>
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Includes disclaimers about AI-generated content and liability limitations
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id="privacy"
                  checked={consents.privacyAccepted}
                  onCheckedChange={(checked) => handleConsentChange('privacyAccepted', checked as boolean)}
                />
                <div className="flex-1">
                  <label htmlFor="privacy" className="text-sm font-medium cursor-pointer">
                    I agree to the <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline">Privacy Policy</Link>
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    How we collect, use, and protect your business data
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id="processing"
                  checked={consents.dataProcessingConsent}
                  onCheckedChange={(checked) => handleConsentChange('dataProcessingConsent', checked as boolean)}
                />
                <div className="flex-1">
                  <label htmlFor="processing" className="text-sm font-medium cursor-pointer">
                    I consent to data processing for AI-powered business assistance
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Process your business information to generate plans, funding advice, and operational recommendations
                  </p>
                </div>
              </div>
            </div>

            <h3 className="font-semibold text-lg flex items-center space-x-2 mt-6">
              <Database className="h-5 w-5 text-green-600" />
              <span>Optional Enhancements</span>
            </h3>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
                <Checkbox
                  id="training"
                  checked={consents.aiTrainingConsent}
                  onCheckedChange={(checked) => handleConsentChange('aiTrainingConsent', checked as boolean)}
                />
                <div className="flex-1">
                  <label htmlFor="training" className="text-sm font-medium cursor-pointer">
                    Help improve Fido by allowing anonymized data for AI training
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Your business data will be anonymized and used to make Fido smarter for all users. You can opt-out anytime.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Your Data Rights</h4>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Access and download your data anytime</li>
              <li>• Request data deletion (right to be forgotten)</li>
              <li>• Modify your consent preferences in settings</li>
              <li>• Contact privacy@fido.ai for data requests</li>
            </ul>
          </div>

          <div className="flex space-x-4 pt-4">
            <Button
              variant="outline"
              onClick={onDecline}
              className="flex-1"
            >
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!canProceed}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Accept & Continue
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            By clicking "Accept & Continue", you acknowledge that you understand Fido provides AI-generated business guidance for informational purposes only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}