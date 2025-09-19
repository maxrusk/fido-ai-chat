import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import AuthCallback from "@/pages/AuthCallback";

import { ChatPage } from "@/pages/chat";
import FinancialProjectionsPage from "@/pages/FinancialProjections";
import FinancialCalculatorPage from "@/pages/financial-calculator";
import FinancialAnalysisPage from "@/pages/financial-analysis";
import ConsentPage from "@/pages/consent";
import AnalyticsPage from "./pages/analytics";
import BusinessPlansPage from "@/pages/business-plans";
import BusinessPlanViewPage from "@/pages/business-plan-view";
import { PrivacyPolicy } from "@/components/legal/PrivacyPolicy";
import { TermsOfService } from "@/components/legal/TermsOfService";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/landing" component={Landing} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/" component={isAuthenticated ? ChatPage : Landing} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/ai-chat" component={ChatPage} />
      <Route path="/consent" component={ConsentPage} />
      <Route path="/business-plans" component={BusinessPlansPage} />
      <Route path="/business-plans/:planId" component={BusinessPlanViewPage} />
      <Route path="/financial-projections" component={FinancialProjectionsPage} />
      <Route path="/financial-calculator" component={FinancialCalculatorPage} />
      <Route path="/financial-analysis" component={FinancialAnalysisPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
