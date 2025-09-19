import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info } from "lucide-react";

export function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          Privacy Policy
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Last updated: July 30, 2025
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-blue-800 dark:text-blue-200">
          <p className="font-semibold">AI Assistant Notice</p>
          <p className="text-sm mt-1">Our AI assistant strives to provide accurate information but can make mistakes. Please verify important details and consider consulting qualified professionals for critical decisions.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-8 space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-blue-600">1. Data We Collect</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p><strong>Account Information:</strong> Email address, name, profile picture when you authenticate through Replit</p>
              <p><strong>Business Information:</strong> Company details, business type, revenue, goals, and preferences you provide</p>
              <p><strong>Chat Data:</strong> All conversations with our AI copilots including business plans, funding requests, and operational advice</p>
              <p><strong>Generated Documents:</strong> Business plans, loan applications, and recommendations created through our platform</p>
              <p><strong>Usage Analytics:</strong> How you interact with different features, time spent, and platform performance data</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-blue-600">2. How We Use Your Data</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p><strong>AI Analysis:</strong> To provide personalized business guidance through our AI assistant (remembering that AI can make mistakes and recommendations should be verified)</p>
              <p><strong>Funding Recommendations:</strong> To suggest appropriate lenders and funding opportunities based on your business profile</p>
              <p><strong>Service Improvement:</strong> To enhance our AI assistant accuracy and add helpful features (with your consent)</p>
              <p><strong>Cross-Copilot Intelligence:</strong> To maintain business context across our specialized AI assistants for consistent guidance</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-blue-600">3. Data Sharing</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p><strong>OpenAI:</strong> Chat conversations are processed through OpenAI's API to generate AI responses (please verify important AI-generated information)</p>
              <p><strong>Replit:</strong> Authentication and hosting infrastructure for secure platform access</p>
              <p><strong>Potential Lenders:</strong> Only basic business information and only when you explicitly request loan matching services</p>
              <p><strong>No Training Data:</strong> Your personal business data is never used to train AI models without your explicit consent</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-blue-600">4. Data Retention</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p><strong>Account Data:</strong> Retained while your account is active</p>
              <p><strong>Chat History:</strong> Stored indefinitely to maintain business context across sessions</p>
              <p><strong>Business Plans:</strong> Kept permanently as they are your intellectual property</p>
              <p><strong>Analytics:</strong> Aggregated data retained for 2 years for service improvement</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-blue-600">5. Your Rights (GDPR/CCPA)</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p><strong>Access:</strong> Request a copy of all your data</p>
              <p><strong>Deletion:</strong> Request complete removal of your account and data</p>
              <p><strong>Correction:</strong> Update any incorrect personal information</p>
              <p><strong>Portability:</strong> Export your business plans and chat history</p>
              <p><strong>Opt-out:</strong> Stop data processing for AI training or analytics</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-blue-600">6. Security Measures</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p><strong>Encryption:</strong> All data encrypted in transit and at rest using AES-256</p>
              <p><strong>SOC 2 Compliance:</strong> Enterprise-grade security controls and audit trails</p>
              <p><strong>Access Controls:</strong> Strict employee access limits and monitoring</p>
              <p><strong>Regular Audits:</strong> Third-party security assessments and penetration testing</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-blue-600">7. Contact Information</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>For privacy questions or data requests:</p>
              <p><strong>Email:</strong> founders@fidofinancial.ai</p>
              <p><strong>Data Protection Officer:</strong> founders@fidofinancial.ai</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-blue-600">8. Changes to This Policy</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>We may update this Privacy Policy periodically. Users will be notified of significant changes via email or platform notification. Continued use of Fido after changes constitutes acceptance of the updated policy.</p>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}