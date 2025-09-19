import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          Terms of Service
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Last updated: July 30, 2025
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-blue-800 dark:text-blue-200">
          <p className="font-semibold">AI Assistant Notice</p>
          <p className="text-sm mt-1">Fido provides AI-generated business guidance for informational purposes. AI can make mistakes - please verify important information and consult qualified professionals for critical business decisions.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-8 space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-blue-600">1. Acceptance of Terms</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>By accessing or using Fido, you agree to be bound by these Terms of Service and our Privacy Policy. If you disagree with any part of these terms, you cannot use our service.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-blue-600">2. Description of Service</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>Fido is an AI-powered business development platform that provides:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Business Plan Architect: AI-generated business plans and strategic guidance</li>
                <li>Loan Navigator: SBA loan guidance and lender matching</li>
                <li>Operations Specialist: Operational recommendations and growth strategies</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-blue-600">3. Acceptable Use</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p><strong>You agree NOT to:</strong></p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Use the platform for fraudulent or illegal activities</li>
                <li>Impersonate another person or entity</li>
                <li>Upload malicious content or attempt to harm our systems</li>
                <li>Share your account credentials with others</li>
                <li>Use our AI outputs to deceive lenders or investors</li>
                <li>Attempt to reverse engineer our AI models</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-blue-600">4. AI Assistant and Content Accuracy</h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
              <p className="font-semibold text-blue-800 dark:text-blue-200">Understanding AI Assistance:</p>
              <ul className="list-disc ml-6 space-y-2 text-blue-700 dark:text-blue-300">
                <li><strong>AI Can Make Mistakes:</strong> Our AI assistant strives for accuracy but may occasionally provide incorrect or outdated information. Please double-check important details.</li>
                <li><strong>Informational Purpose:</strong> All AI-generated content is designed to inform and guide, not replace professional advice</li>
                <li><strong>Verify Important Information:</strong> For critical business decisions, we recommend consulting qualified professionals</li>
                <li><strong>No Guarantees:</strong> While our AI provides valuable insights, business success depends on many factors beyond our recommendations</li>
                <li><strong>Not a Financial Institution:</strong> Fido is a business guidance platform, not a lender or financial advisor</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-blue-600">5. Limitation of Liability</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p><strong>Fido and its affiliates are NOT responsible for:</strong></p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Business losses resulting from decisions based on AI-generated advice</li>
                <li>Loan rejections or funding failures</li>
                <li>Inaccuracies in AI-generated business plans or recommendations</li>
                <li>Third-party lender decisions or policies</li>
                <li>Technical outages or data loss (though we maintain backups)</li>
              </ul>
              <p className="mt-4 font-semibold">Maximum liability is limited to the amount you paid for Fido services in the past 12 months.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-blue-600">6. Intellectual Property</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p><strong>Your Content:</strong> You retain ownership of business plans and documents you create using Fido</p>
              <p><strong>Our Platform:</strong> Fido's AI models, algorithms, and platform code remain our property</p>
              <p><strong>Usage Rights:</strong> We may use aggregated, anonymized data to improve our services</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-blue-600">7. Account Termination</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p><strong>We may suspend or terminate accounts for:</strong></p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Violation of these Terms of Service</li>
                <li>Fraudulent or illegal activity</li>
                <li>Abuse of our platform or other users</li>
                <li>Non-payment of fees (for premium features)</li>
              </ul>
              <p><strong>You may delete your account at any time</strong> through your profile settings or by contacting support.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-blue-600">8. Governing Law</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>These Terms are governed by the laws of the State of Delaware, United States. Any disputes will be resolved in the courts of Delaware.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-blue-600">9. Changes to Terms</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>We reserve the right to modify these Terms of Service at any time. Users will be notified of significant changes via email or platform notification. Continued use after changes constitutes acceptance.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-blue-600">10. Contact Information</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>Questions about these Terms of Service:</p>
              <p><strong>Email:</strong> founders@fidofinancial.ai</p>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}