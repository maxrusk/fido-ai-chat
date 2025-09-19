import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LegalConsent, type ConsentData } from "@/components/legal/LegalConsent";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function ConsentPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if already consented or not authenticated
  if (!isLoading && (!user || user.consentStatus === 'accepted')) {
    setLocation('/');
    return null;
  }

  const handleAcceptConsent = async (consents: ConsentData) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(consents),
      });

      if (response.ok) {
        toast({
          title: "Consent Recorded",
          description: "Thank you for accepting our terms. Welcome to Fido!",
        });
        
        // Redirect to chat or intended destination
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect') || '/chat';
        setLocation(redirectTo);
      } else {
        throw new Error('Failed to record consent');
      }
    } catch (error) {
      console.error('Error recording consent:', error);
      toast({
        title: "Error",
        description: "Failed to record your consent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineConsent = () => {
    toast({
      title: "Consent Required",
      description: "You must accept our Terms of Service to use Fido.",
      variant: "destructive",
    });
    
    // Redirect to logout
    window.location.href = '/api/logout';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <LegalConsent
      onAccept={handleAcceptConsent}
      onDecline={handleDeclineConsent}
    />
  );
}