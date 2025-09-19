import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { getChatCompletion, generateChatTitle, buildSystemPrompt } from "./openai";
import { insertChatSessionSchema, insertChatMessageSchema, chatSessions } from "@shared/schema";
import { z } from "zod";
import { setupEnterpriseSecurity, encryptSensitiveData, decryptSensitiveData, DataSubjectRights } from "./security";
import { BusinessContextManager } from "./businessContextManager";
import { CopilotAgents } from "./copilotAgents";
import { generateAIFinancialProjections, refreshAIFinancialProjections, exportFinancialProjectionsToCSV } from './aiFinancialService';
import { analyticsMiddleware } from './middleware/analytics';
import { registerAnalyticsRoutes } from './routes/analytics';
import { CollaborationService } from './collaborationService';
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import RedisClient from "./redis";
import SessionManager from "./sessionManager";

/**
 * Auto-extracts and saves business plan content from AI responses
 */
async function autoSaveBusinessPlanContent(userId: string, sessionId: string, aiContent: string): Promise<void> {
  try {
    const { BusinessPlanExtractor } = await import('./lib/businessPlanExtractor');
    
    // Check if the AI response contains business plan content
    if (!BusinessPlanExtractor.containsBusinessPlanContent(aiContent)) {
      return;
    }

    console.log(`[AI-EXTRACT] Detecting business plan content in session ${sessionId}`);
    
    // Extract structured business plan content
    const extractedPlan = BusinessPlanExtractor.extractBusinessPlanContent(aiContent);
    
    if (Object.keys(extractedPlan.sections).length === 0) {
      return; // No sections extracted
    }

    console.log(`[AI-EXTRACT] Extracted ${Object.keys(extractedPlan.sections).length} business plan sections`);

    // Find existing business plan for this session or create new one
    let businessPlan = await storage.getBusinessPlanBySessionId(sessionId);
    
    if (!businessPlan) {
      // Create new business plan linked to this session
      businessPlan = await storage.createBusinessPlan({
        userId,
        sessionId: sessionId,
        title: extractedPlan.title || 'AI-Generated Business Plan',
        businessName: extractedPlan.businessName,
        status: 'in_progress',
        sections: extractedPlan.sections,
        lastAutoSave: new Date()
      });
      
      console.log(`[AI-EXTRACT] Created new business plan ${businessPlan.id} for session ${sessionId}`);
    } else {
      // Merge with existing sections
      const existingSections = businessPlan.sections || businessPlan.contentJson || {};
      const mergedSections = BusinessPlanExtractor.mergeSections(existingSections, extractedPlan.sections);
      
      // Update existing business plan
      await storage.updateBusinessPlan(businessPlan.id, {
        sections: mergedSections,
        businessName: extractedPlan.businessName || businessPlan.businessName,
        lastAutoSave: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`[AI-EXTRACT] Updated business plan ${businessPlan.id} with new AI-generated content`);
    }

    // Update the chat session to link to the business plan
    await storage.updateChatSession(sessionId, {
      businessPlanId: businessPlan.id
    });

  } catch (error) {
    console.error('[AI-EXTRACT] Error auto-saving business plan content:', error);
    // Don't throw - this shouldn't break the chat flow
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup enterprise security measures (SOC 2 Type II compliance)
  setupEnterpriseSecurity(app);
  
  // Auth middleware setup will handle authentication
  // No development fallbacks - all access requires proper authentication
  
  // Auth middleware
  await setupAuth(app);
  
  // Analytics middleware for user behavior and performance monitoring
  app.use(analyticsMiddleware);
  
  // Register analytics routes
  registerAnalyticsRoutes(app);

  // Enhanced health check endpoint for deployment monitoring
  app.get('/api/health', async (req, res) => {
    try {
      // Basic server health
      const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || '5000',
        host: process.env.HOST || '0.0.0.0',
        domain: process.env.REPLIT_DEV_DOMAIN || 'localhost',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      };

      // Test database connection
      try {
        // Simple database test - try to get demo user
        const testUser = await storage.getUser('demo-user-1');
        (healthData as any).database = 'connected';
        (healthData as any).databaseStats = { demoUserExists: !!testUser };
      } catch (dbError: any) {
        (healthData as any).database = 'error';
        (healthData as any).status = 'degraded';
        (healthData as any).databaseError = dbError?.message || 'Unknown database error';
      }

      // Check OpenAI configuration
      (healthData as any).openai = process.env.OPENAI_API_KEY ? 'configured' : 'missing';
      
      // Check Redis connection
      try {
        const redis = RedisClient.getInstance();
        (healthData as any).redis = RedisClient.isConnected() ? 'connected' : 'disconnected';
      } catch (error: any) {
        (healthData as any).redis = 'error';
      }

      // Check PDF processing capability
      try {
        const { DocumentProcessor } = await import('./documentProcessor');
        const processor = new DocumentProcessor();
        const pdfStatus = processor.getPdfProcessingStatus();
        (healthData as any).pdfProcessing = pdfStatus;
      } catch (error: any) {
        (healthData as any).pdfProcessing = { 
          available: false, 
          error: `Failed to load document processor: ${error.message}` 
        };
      }
      
      res.json(healthData);
    } catch (error: any) {
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error?.message || 'Unknown error'
      });
    }
  });

  // Chat Memory Cleanup API - helps free memory by cleaning old chat data
  app.post('/api/admin/cleanup-memory', isAuthenticated, async (req: any, res) => {
    try {
      // Only allow authenticated users to run cleanup
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Clean old chat messages (older than 7 days by default)
      const daysOld = req.body.daysOld || 7;
      
      console.log(`[CLEANUP] Starting chat memory cleanup - removing data older than ${daysOld} days`);
      
      // Delete old chat messages
      const messagesResult = await db.execute(
        sql`DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '${daysOld} days'`
      );
      
      // Delete orphaned chat sessions (sessions with no messages)
      const sessionsResult = await db.execute(
        sql`DELETE FROM chat_sessions WHERE id NOT IN (SELECT DISTINCT session_id FROM chat_messages WHERE session_id IS NOT NULL)`
      );
      
      // Delete expired browser sessions
      const browserSessionsResult = await db.execute(
        sql`DELETE FROM sessions WHERE expire < NOW()`
      );
      
      // Get current data counts for reporting
      const remainingMessages = await db.execute(sql`SELECT COUNT(*) as count FROM chat_messages`);
      const remainingSessions = await db.execute(sql`SELECT COUNT(*) as count FROM chat_sessions`);
      
      const cleanupResults = {
        chatMessagesDeleted: messagesResult.rowCount || 0,
        chatSessionsDeleted: sessionsResult.rowCount || 0, 
        expiredSessionsDeleted: browserSessionsResult.rowCount || 0,
        remainingMessages: (remainingMessages.rows[0] as any)?.count || 0,
        remainingSessions: (remainingSessions.rows[0] as any)?.count || 0,
        cleanupDate: new Date().toISOString()
      };

      console.log(`[CLEANUP] Memory cleanup completed:`, cleanupResults);
      
      res.json({
        success: true,
        message: "Memory cleanup completed successfully",
        results: cleanupResults
      });
      
    } catch (error: any) {
      console.error('[CLEANUP] Error during memory cleanup:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to complete memory cleanup",
        error: error?.message || 'Unknown error'
      });
    }
  });

  // AI Financial Projections endpoint
  app.post('/api/ai/financial-projections', isAuthenticated, async (req, res) => {
    const { businessPlanContent, timeHorizon, projectionYears, assumptions } = req.body;
    
    try {
      const prompt = `Based on this business plan content, generate realistic financial projections:

${businessPlanContent}

Parameters:
- Time horizon: ${timeHorizon}
- Projection years: ${projectionYears}
- Current assumptions: ${JSON.stringify(assumptions)}

Please analyze the business model and provide:
1. Refined assumptions based on the business plan (initial revenue, growth rates, cost structure)
2. Multiple revenue streams with individual growth projections
3. Realistic cost of goods sold percentages
4. Operating expense projections
5. Seasonal factors if applicable

Respond with JSON in this exact format:
{
  "assumptions": {
    "initialRevenue": number,
    "growthRate": number,
    "cogsPercentage": number,
    "operatingExpenseBase": number,
    "operatingExpenseGrowth": number
  },
  "revenueStreams": [
    {
      "name": "string",
      "baseAmount": number,
      "growthRate": number,
      "seasonality": [12 monthly multipliers]
    }
  ],
  "projections": [
    {
      "period": "string",
      "revenue": number,
      "cogs": number,
      "grossProfit": number,
      "operatingExpenses": number,
      "netIncome": number,
      "cashFlow": number
    }
  ]
}

Make projections realistic and conservative, considering industry standards and the specific business model described.`;

      const aiResponse = await getChatCompletion(
        [{ role: 'user', content: prompt }],
        {
          temperature: 0.3,
          model: 'gpt-4o'
        }
      );

      let financialData;
      try {
        financialData = JSON.parse(aiResponse);
      } catch (parseError) {
        throw new Error('Failed to parse AI response');
      }

      // Validate the response structure
      if (!financialData.assumptions || !financialData.projections) {
        throw new Error('Invalid AI response structure');
      }

      res.json(financialData);
    } catch (error) {
      console.error('Error generating financial projections:', error);
      res.status(500).json({ 
        message: 'Failed to generate financial projections',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Business Plan Section Save Route
  app.post('/api/business-plans/:businessPlanId/sections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let { businessPlanId } = req.params;
      const { sectionId, content } = req.body;

      if (!sectionId || !content) {
        return res.status(400).json({ message: 'Section ID and content are required' });
      }

      let businessPlan;

      // If businessPlanId is "default" or invalid, create a new business plan
      if (businessPlanId === 'default') {
        businessPlan = await storage.createBusinessPlan({
          userId,
          title: 'Business Plan',
          status: 'draft',
          contentJson: {}
        });
        businessPlanId = businessPlan.id;
      } else {
        // Try to get existing business plan
        businessPlan = await storage.getBusinessPlan(businessPlanId);
        
        if (!businessPlan) {
          // Create new business plan if not found
          businessPlan = await storage.createBusinessPlan({
            userId,
            title: 'Business Plan',
            status: 'draft',
            contentJson: {}
          });
          businessPlanId = businessPlan.id;
        }
      }

      // Update the specific section in contentJson
      const currentContent = businessPlan.contentJson || {};
      const updatedContent = {
        ...currentContent,
        [sectionId]: content
      };

      // Update business plan with new section content
      await storage.updateBusinessPlan(businessPlan.id, {
        contentJson: updatedContent,
        updatedAt: new Date()
      });

      res.json({ 
        success: true, 
        message: 'Section saved successfully',
        businessPlanId: businessPlan.id 
      });
    } catch (error) {
      console.error('Error saving business plan section:', error);
      res.status(500).json({ message: 'Failed to save section' });
    }
  });

  // Get User's Current Business Plan (or create one)
  app.get('/api/business-plans/current', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Get user's most recent business plan
      const businessPlans = await storage.getBusinessPlans(userId);
      let businessPlan = businessPlans[0]; // Most recent

      if (!businessPlan) {
        // Create new business plan if none exists
        businessPlan = await storage.createBusinessPlan({
          userId,
          title: 'My Business Plan',
          status: 'draft',
          contentJson: {},
        });
      }

      res.json(businessPlan);
    } catch (error) {
      console.error('Error fetching current business plan:', error);
      res.status(500).json({ message: 'Failed to fetch business plan' });
    }
  });

  // Get All Business Plans for User
  app.get('/api/business-plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const businessPlans = await storage.getBusinessPlans(userId);
      res.json(businessPlans);
    } catch (error) {
      console.error('Error fetching business plans:', error);
      res.status(500).json({ message: 'Failed to fetch business plans' });
    }
  });

  // Get Business Plan Route
  app.get('/api/business-plans/:businessPlanId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { businessPlanId } = req.params;

      const businessPlan = await storage.getBusinessPlan(businessPlanId);
      
      if (!businessPlan || businessPlan.userId !== userId) {
        return res.status(404).json({ message: 'Business plan not found' });
      }

      res.json(businessPlan);
    } catch (error) {
      console.error('Error fetching business plan:', error);
      res.status(500).json({ message: 'Failed to fetch business plan' });
    }
  });

  // Update Business Plan Section Route
  app.put('/api/business-plans/:businessPlanId/sections/:sectionId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { businessPlanId, sectionId } = req.params;
      const { content } = req.body;

      const businessPlan = await storage.getBusinessPlan(businessPlanId);
      
      if (!businessPlan || businessPlan.userId !== userId) {
        return res.status(404).json({ message: 'Business plan not found' });
      }

      const updatedPlan = await storage.updateBusinessPlanSection(businessPlanId, sectionId, content);
      res.json(updatedPlan);
    } catch (error) {
      console.error('Error updating business plan section:', error);
      res.status(500).json({ message: 'Failed to update business plan section' });
    }
  });

  // Update Business Plan Title Route
  app.put('/api/business-plans/:businessPlanId/title', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { businessPlanId } = req.params;
      const { title } = req.body;

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ message: 'Title is required' });
      }

      const businessPlan = await storage.getBusinessPlan(businessPlanId);
      
      if (!businessPlan || businessPlan.userId !== userId) {
        return res.status(404).json({ message: 'Business plan not found' });
      }

      const updatedPlan = await storage.updateBusinessPlan(businessPlanId, { 
        title: title.trim(), 
        updatedAt: new Date() 
      });
      
      res.json(updatedPlan);
    } catch (error) {
      console.error('Error updating business plan title:', error);
      res.status(500).json({ message: 'Failed to update business plan title' });
    }
  });

  // Delete Business Plan Route
  app.delete('/api/business-plans/:businessPlanId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { businessPlanId } = req.params;

      const businessPlan = await storage.getBusinessPlan(businessPlanId);
      
      if (!businessPlan || businessPlan.userId !== userId) {
        return res.status(404).json({ message: 'Business plan not found' });
      }

      await storage.deleteBusinessPlan(businessPlanId);
      res.json({ message: 'Business plan deleted successfully' });
    } catch (error) {
      console.error('Error deleting business plan:', error);
      res.status(500).json({ message: 'Failed to delete business plan' });
    }
  });

  // Auto-save business plan sections
  app.post('/api/business-plans/:planId/auto-save', isAuthenticated, async (req: any, res) => {
    try {
      const { planId } = req.params;
      const { sections } = req.body;
      const userId = req.user.claims.sub;

      // Verify ownership
      const plan = await storage.getBusinessPlan(planId);
      if (!plan || plan.userId !== userId) {
        return res.status(404).json({ message: "Business plan not found" });
      }

      const updatedPlan = await storage.autoSaveBusinessPlan(planId, sections);
      
      console.log(`[AUTO-SAVE] Business plan ${planId} auto-saved for user ${userId}`);
      
      // Broadcast the update to WebSocket clients
      setTimeout(() => {
        if ((app as any).broadcastBusinessPlanUpdate) {
          (app as any).broadcastBusinessPlanUpdate(planId, sections, 'auto_save');
        }
      }, 100); // Small delay to ensure WebSocket clients are ready
      
      res.json({ success: true, plan: updatedPlan });
    } catch (error) {
      console.error("Error auto-saving business plan:", error);
      res.status(500).json({ message: "Failed to auto-save business plan" });
    }
  });

  // Update specific business plan section
  app.put('/api/business-plans/:planId/sections/:sectionId', isAuthenticated, async (req: any, res) => {
    try {
      const { planId, sectionId } = req.params;
      const { content } = req.body;
      const userId = req.user.claims.sub;

      // Verify ownership
      const plan = await storage.getBusinessPlan(planId);
      if (!plan || plan.userId !== userId) {
        return res.status(404).json({ message: "Business plan not found" });
      }

      const updatedPlan = await storage.updateBusinessPlanSection(planId, sectionId, content);
      
      console.log(`[SECTION-UPDATE] Section ${sectionId} updated in plan ${planId} for user ${userId}`);
      res.json({ success: true, plan: updatedPlan });
    } catch (error) {
      console.error("Error updating business plan section:", error);
      res.status(500).json({ message: "Failed to update business plan section" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Enhanced Session Restoration API
  app.get('/api/session/restore-data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const copilotType = req.query.copilotType as string;
      
      // Get comprehensive restore data
      const restoreData = await SessionManager.getRestoreData(userId);
      
      // Find the best session to restore
      const restorableSession = await SessionManager.findRestorableSession({
        userId,
        copilotType,
        maxHours: 24
      });
      
      res.json({
        ...restoreData,
        restorableSession,
        canRestore: !!restorableSession,
        source: 'hybrid' // Redis + PostgreSQL
      });
      
    } catch (error) {
      console.error("Error getting session restore data:", error);
      res.status(500).json({ message: "Failed to get restore data" });
    }
  });

  // Mark Session as Restored
  app.post('/api/session/mark-restored', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId } = req.body;
      
      await SessionManager.markSessionRestored(userId, sessionId);
      res.json({ success: true });
      
    } catch (error) {
      console.error("Error marking session restored:", error);
      res.status(500).json({ message: "Failed to mark session restored" });
    }
  });

  // Consent management endpoint
  app.post('/api/consent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const consentData = req.body;

      // Record consent in database
      await storage.recordUserConsent(userId, {
        ...consentData,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent')
      });

      // Update user consent status
      await storage.updateUserConsentStatus(userId, 'accepted');

      res.json({ 
        success: true, 
        message: 'Consent recorded successfully' 
      });
    } catch (error) {
      console.error('Error recording consent:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to record consent' 
      });
    }
  });

  // Legacy development endpoint
  app.get('/api/auth/user-dev', async (req: any, res) => {
    try {
      if (process.env.NODE_ENV !== 'production') {
        // Development mode - ensure user exists
        const mockUser = {
          id: 'dev-user-1',
          email: 'dev@example.com',
          firstName: 'Dev',
          lastName: 'User',
          profileImageUrl: null,
          businessType: null,
          companySize: null,
          loanNeeds: [],
          monthlyRevenue: null,
          primaryGoals: null,
          aiModel: 'gpt-4o',
          responseStyle: 'professional',
          temperature: '0.7',
          saveHistory: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await storage.upsertUser(mockUser);
        const user = await storage.getUser('dev-user-1');
        res.json(user);
        return;
      }
      
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Auth middleware helper
  const getUserId = (req: any) => {
    if (process.env.NODE_ENV !== 'production' && req.user.id === 'dev-user-1') {
      return 'dev-user-1';
    }
    return req.user?.id;
  };

  // GDPR/CCPA Data Subject Rights endpoints
  app.post('/api/user/export-data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userData = await DataSubjectRights.exportUserData(userId, storage);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="fido-data-export-${userId}-${Date.now()}.json"`);
      res.json(userData);
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ message: "Failed to export user data" });
    }
  });

  app.delete('/api/user/delete-account', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await DataSubjectRights.deleteUserData(userId, storage);
      
      res.json({ message: "Account and all associated data have been permanently deleted" });
    } catch (error) {
      console.error("Error deleting user data:", error);
      res.status(500).json({ message: "Failed to delete user data" });
    }
  });

  app.post('/api/user/anonymize-data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await DataSubjectRights.anonymizeUserData(userId, storage);
      
      res.json({ message: "User data has been anonymized" });
    } catch (error) {
      console.error("Error anonymizing user data:", error);
      res.status(500).json({ message: "Failed to anonymize user data" });
    }
  });

  // Business Context APIs
  app.get('/api/context/business', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const businessContext = await BusinessContextManager.getUserBusinessContext(userId);
      res.json(businessContext);
    } catch (error) {
      console.error("Error fetching business context:", error);
      res.status(500).json({ message: "Failed to fetch business context" });
    }
  });

  // Copilot Session APIs
  app.get('/api/copilot/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getChatSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching copilot sessions:", error);
      res.status(500).json({ message: "Failed to fetch copilot sessions" });
    }
  });

  app.post('/api/copilot/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { copilotType, sessionData, parentSessionId } = req.body;
      
      const session = await BusinessContextManager.createCopilotSession(
        userId,
        copilotType,
        sessionData,
        parentSessionId
      );
      
      res.json(session);
    } catch (error) {
      console.error("Error creating copilot session:", error);
      res.status(500).json({ message: "Failed to create copilot session" });
    }
  });

  // User preferences routes
  app.patch('/api/user/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      const user = await storage.updateUserPreferences(userId, updates);
      res.json(user);
    } catch (error) {
      console.error("Error updating preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Chat session routes
  app.get('/api/chat/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getChatSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      res.status(500).json({ message: "Failed to fetch chat sessions" });
    }
  });

  app.post('/api/chat/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { welcomeFlow, ...requestBody } = req.body;
      
      const sessionData = insertChatSessionSchema.parse({
        title: `${requestBody.copilotType || 'business_plan_architect'} Session`,
        copilotType: requestBody.copilotType || 'business_plan_architect',
        userId,
      });
      
      const session = await storage.createChatSession(sessionData);
      
      // Generate immediate AI welcome message when user clicks welcome button
      if (welcomeFlow && sessionData.copilotType === 'business_plan_architect') {
        // Get the enhanced system prompt for this welcome flow
        const { getWelcomePrompt } = await import('./lib/welcomePrompts');
        const systemPrompt = getWelcomePrompt(welcomeFlow);
        
        // Create a simple trigger message based on the welcome flow
        let triggerMessage = '';
        switch (welcomeFlow) {
          case 'new_plan':
            triggerMessage = "I want to start creating a business plan from scratch.";
            break;
          case 'business_idea':
            triggerMessage = "I have a business idea but need help developing it into a plan.";
            break;
          case 'existing_plan':
            triggerMessage = "I have an existing business plan that I want to improve and optimize. I'm ready to upload my plan for your analysis.";
            break;
        }
        
        // Generate AI welcome response immediately using OpenAI
        const chatHistory = [{ role: 'user' as const, content: triggerMessage }];
        
        const aiWelcomeResponse = await getChatCompletion(chatHistory, {
          model: "gpt-4o",
          temperature: 0.7,
          systemPrompt,
          userId: userId,
          copilotType: 'business_plan_architect'
        });
        
        // Save only the AI welcome message (no user message needed)
        await storage.createChatMessage({
          sessionId: session.id.toString(),
          role: 'assistant',
          content: aiWelcomeResponse,
        });
        
        // Extract business context from the initial conversation
        await BusinessContextManager.extractAndStoreContext(
          userId,
          aiWelcomeResponse,
          `business_plan_architect_welcome_${welcomeFlow}`,
          session.id.toString()
        );

        // NEW: Auto-extract business plan content from welcome response
        await autoSaveBusinessPlanContent(userId, session.id.toString(), aiWelcomeResponse);
      }
      
      // Store welcome flow context in session contextData if provided
      if (welcomeFlow) {
        await storage.updateChatSession(session.id.toString(), {
          contextData: { welcomeFlow }
        });
      }
      
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid session data", errors: error.errors });
        return;
      }
      console.error("Error creating chat session:", error);
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  app.delete('/api/chat/sessions/:sessionId', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      await storage.deleteChatSession(sessionId.toString());
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting chat session:", error);
      res.status(500).json({ message: "Failed to delete chat session" });
    }
  });

  // Chat message routes
  app.get('/api/chat/sessions/:sessionId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const messages = await storage.getChatMessages(sessionId.toString());
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/chat/sessions/:sessionId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const userId = req.user.claims.sub;
      const { content, message, role } = req.body;

      // Support both content field and message/role pattern for direct assistant messages
      const messageContent = content || message;
      const messageRole = role || 'user';

      if (!messageContent || typeof messageContent !== 'string') {
        res.status(400).json({ message: "Message content is required" });
        return;
      }

      // If this is a direct assistant message (like welcome message), just save it
      if (messageRole === 'assistant') {
        const assistantMessage = await storage.createChatMessage({
          sessionId: sessionId.toString(),
          role: 'assistant',
          content: messageContent,
        });
        
        res.json({ assistantMessage });
        return;
      }

      // Save user message
      const userMessage = await storage.createChatMessage({
        sessionId: sessionId.toString(),
        role: 'user',
        content: messageContent,
      });

      // Get user for personalized system prompt
      const user = await storage.getUser(userId);
      
      // Get session contextData to check for welcome flow context
      const sessionDetails = await storage.getChatSession(sessionId.toString());
      const welcomeFlow = (sessionDetails?.contextData as any)?.welcomeFlow;
      
      // Get enhanced system prompt based on copilot type and context
      const copilotType = req.body.copilotType || sessionDetails?.copilotType || 'business_plan_architect';
      let systemPrompt;
      
      if (welcomeFlow && copilotType === 'business_plan_architect') {
        // Use enhanced welcome flow prompt
        const { getWelcomePrompt } = await import('./lib/welcomePrompts');
        systemPrompt = getWelcomePrompt(welcomeFlow);
      } else {
        // Use regular system prompt
        systemPrompt = await CopilotAgents.getSystemPrompt(copilotType, userId);
      }

      // Get chat history for context
      const messages = await storage.getChatMessages(sessionId.toString());
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Generate AI response with business context and correct copilot type
      const aiResponse = await getChatCompletion(chatHistory, {
        model: user?.aiModel || "gpt-4o",
        temperature: parseFloat(user?.temperature || "0.7"),
        systemPrompt,
        userId: userId,
        copilotType: copilotType
      });

      // Save AI response
      const assistantMessage = await storage.createChatMessage({
        sessionId: sessionId.toString(),
        role: 'assistant',
        content: aiResponse,
      });

      // NEW: Auto-extract and save business plan content from AI responses
      if (copilotType === 'business_plan_architect') {
        await autoSaveBusinessPlanContent(userId, sessionId.toString(), aiResponse);
      }

      // Generate title if this is the first exchange
      if (messages.length <= 2) {
        const title = await generateChatTitle(chatHistory);
        await storage.updateChatSession(sessionId.toString(), { title });
      }



      res.json({
        userMessage,
        assistantMessage,
      });
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  app.delete('/api/chat/sessions/:sessionId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = req.params.sessionId; // Keep as string since it's a UUID
      await storage.deleteChatMessages(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing messages:", error);
      res.status(500).json({ message: "Failed to clear messages" });
    }
  });

  // Auto-save session endpoint to preserve progress during copilot switches
  app.post('/api/chat/sessions/:sessionId/auto-save', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = req.params.sessionId; // Keep as string since it's a UUID
      const userId = req.user?.claims?.sub;
      const { copilotType, timestamp, switchingTo, action } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get current session context
      const currentSession = await db.select().from(chatSessions).where(eq(chatSessions.id, sessionId)).limit(1);
      const currentContextData = currentSession[0]?.contextData || {};

      // Update session with auto-save timestamp and context
      const [updatedSession] = await db
        .update(chatSessions)
        .set({
          lastAutoSave: new Date(timestamp),
          updatedAt: new Date(),
          contextData: {
            ...currentContextData,
            lastCopilotType: copilotType,
            switchingTo: switchingTo || null,
            autoSaveAction: action || 'switch'
          }
        })
        .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
        .returning();

      if (!updatedSession) {
        return res.status(404).json({ error: 'Session not found' });
      }

      console.log(`[AUTO-SAVE] Session ${sessionId} saved for user ${userId} - ${action || 'copilot switch'}`);
      res.json({ 
        message: 'Session auto-saved successfully', 
        savedAt: timestamp,
        action: action || 'switch'
      });
    } catch (error: any) {
      console.error('Error auto-saving session:', error);
      res.status(500).json({ error: 'Failed to auto-save session' });
    }
  });

  // Business plan upload and analysis routes
  app.post('/api/business-plans/upload', isAuthenticated, async (req, res) => {
    try {
      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getBusinessPlanUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  // Special route to handle business plan analysis and immediate chat integration
  app.post('/api/chat/sessions/:sessionId/business-plan', isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const userId = (req.user as any).claims.sub;
      const { filePath, fileName, analysis } = req.body;

      // Create a special message that includes the business plan analysis
      const analysisMessage = `I've uploaded my business plan: "${fileName}". Here's what I'd like you to analyze:

**Business Plan Content:**
${analysis.extractedContent}

**Key Sections Identified:**
${Object.keys(analysis.analysis.sections).join(', ')}

**Key Insights:**
${analysis.analysis.keyInsights.join(', ')}

Please review my plan and provide your expert analysis and recommendations for improvement.`;

      // Create the user message with business plan content
      const userMessage = await storage.createChatMessage({
        sessionId: sessionId.toString(),
        role: 'user',
        content: analysisMessage,
      });

      // Get the session details for context
      const sessionDetails = await storage.getChatSession(sessionId.toString());
      const welcomeFlow = (sessionDetails?.contextData as any)?.welcomeFlow;
      
      // Get enhanced system prompt for business plan analysis
      let systemPrompt;
      if (welcomeFlow && sessionDetails?.copilotType === 'business_plan_architect') {
        const { getWelcomePrompt } = await import('./lib/welcomePrompts');
        systemPrompt = getWelcomePrompt(welcomeFlow);
      } else {
        systemPrompt = await CopilotAgents.getSystemPrompt('business_plan_architect', userId);
      }

      // Get chat history
      const messages = await storage.getChatMessages(sessionId.toString());
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Generate AI response with business plan analysis
      const { getChatCompletion } = await import('./openai');
      const aiResponse = await getChatCompletion(chatHistory, {
        model: "gpt-4o",
        temperature: 0.7,
        systemPrompt: systemPrompt + `\n\nThe user has uploaded their business plan. Provide a comprehensive analysis with specific recommendations for improvement. Focus on strengths, weaknesses, and strategic opportunities.`,
        userId: userId,
        copilotType: 'business_plan_architect'
      });

      // Save AI response
      const assistantMessage = await storage.createChatMessage({
        sessionId: sessionId.toString(),
        role: 'assistant',
        content: aiResponse,
      });

      res.json({ userMessage, assistantMessage });
    } catch (error) {
      console.error("Error processing business plan:", error);
      res.status(500).json({ message: "Failed to process business plan" });
    }
  });

  app.post('/api/business-plans/analyze', isAuthenticated, async (req, res) => {
    try {
      const { filePath, fileName } = req.body;
      const userId = (req.user as any).claims.sub;
      
      if (!filePath || !fileName) {
        res.status(400).json({ message: "File path and name are required" });
        return;
      }

      const { ObjectStorageService } = await import('./objectStorage');
      const { FileAnalyzer } = await import('./fileAnalyzer');
      
      const objectStorageService = new ObjectStorageService();
      
      // Normalize the file path from upload URL
      const normalizedPath = objectStorageService.normalizeBusinessPlanPath(filePath);
      
      // Get the file object
      const file = await objectStorageService.getBusinessPlanFile(normalizedPath);
      
      // Extract structured content using file analyzer
      const extractedContent = await FileAnalyzer.extractTextContent(file, fileName);
      
      // Analyze the business plan content
      const analysis = FileAnalyzer.analyzeBusinessPlanContent(extractedContent);
      
      // Generate AI insights about the business plan
      const { getChatCompletion } = await import('./openai');
      
      const aiInsights = await getChatCompletion([
        {
          role: 'user',
          content: `Analyze this business plan and provide key insights:\n\n${extractedContent.substring(0, 8000)}`
        }
      ], {
        model: "gpt-4o",
        temperature: 0.3,
        systemPrompt: `You are a business plan expert. Analyze the provided business plan and give:
1. Overall assessment and strengths
2. Areas needing improvement
3. Key financial insights
4. Market positioning observations
5. Strategic recommendations

Be concise but thorough in your analysis.`,
        userId: userId,
        copilotType: 'business_plan_architect'
      });
      
      res.json({ 
        filePath: normalizedPath,
        fileName,
        extractedContent: extractedContent.substring(0, 5000), // First 5000 chars for preview
        analysis,
        aiInsights,
        message: "Business plan uploaded and comprehensively analyzed"
      });
    } catch (error) {
      console.error("Error analyzing business plan:", error);
      res.status(500).json({ message: "Failed to analyze business plan" });
    }
  });



  const httpServer = createServer(app);

  // WebSocket setup for real-time chat and business plan updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Broadcast function for business plan updates
  const broadcastBusinessPlanUpdate = (planId: string, sections: any, source: string = 'update') => {
    wss.clients.forEach((client: WebSocketClient) => {
      if (client.readyState === client.OPEN && client.planId === planId) {
        client.send(JSON.stringify({
          type: 'business_plan_update',
          planId,
          sections,
          timestamp: new Date().toISOString(),
          source
        }));
        console.log(`[WEBSOCKET] Broadcasted business plan update to client for plan ${planId}`);
      }
    });
  };

  // Attach broadcast function to app for use in routes
  (app as any).broadcastBusinessPlanUpdate = broadcastBusinessPlanUpdate;

  interface WebSocketClient extends WebSocket {
    userId?: string;
    sessionId?: number;
    planId?: string;
  }

  wss.on('connection', (ws: WebSocketClient, req) => {
    console.log('WebSocket connection established');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'join') {
          ws.userId = message.userId;
          ws.sessionId = message.sessionId;
        } else if (message.type === 'subscribe_business_plan') {
          ws.userId = message.userId || ws.userId;
          ws.sessionId = message.sessionId;
          ws.planId = message.planId;
          console.log(`[WEBSOCKET] Client subscribed to business plan ${message.planId} updates`);
        } else if (message.type === 'typing') {
          // Broadcast typing indicator to other clients in the same session
          wss.clients.forEach((client: WebSocketClient) => {
            if (client !== ws && 
                client.readyState === WebSocket.OPEN && 
                client.sessionId === ws.sessionId) {
              client.send(JSON.stringify({
                type: 'typing',
                userId: ws.userId,
                isTyping: message.isTyping
              }));
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Financial Projections AI Routes
  app.get('/api/financial-projections/current', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const existingData = await storage.getFinancialProjections(userId);
      res.json(existingData || {});
    } catch (error) {
      console.error('Error fetching financial projections:', error);
      res.status(500).json({ message: 'Failed to fetch financial projections' });
    }
  });

  app.post('/api/financial-projections/ai-generate', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { assumptions, businessContext } = req.body;

      // Generate AI-powered financial projections
      const aiResponse = await generateAIFinancialProjections(assumptions, businessContext);
      
      // Save to storage
      await storage.saveFinancialProjections(userId, {
        projections: aiResponse.projections,
        assumptions,
        aiInsights: aiResponse.aiInsights,
        lastUpdated: new Date()
      });

      res.json(aiResponse);
    } catch (error) {
      console.error('Error generating AI financial projections:', error);
      res.status(500).json({ message: 'Failed to generate financial projections' });
    }
  });

  app.post('/api/financial-projections/refresh', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { currentProjections, assumptions } = req.body;

      // Refresh projections with latest AI insights
      const refreshedResponse = await refreshAIFinancialProjections(currentProjections, assumptions);
      
      // Save updated data
      await storage.saveFinancialProjections(userId, {
        projections: refreshedResponse.projections,
        assumptions,
        aiInsights: refreshedResponse.aiInsights,
        lastUpdated: new Date()
      });

      res.json(refreshedResponse);
    } catch (error) {
      console.error('Error refreshing financial projections:', error);
      res.status(500).json({ message: 'Failed to refresh financial projections' });
    }
  });

  app.post('/api/financial-projections/export', isAuthenticated, async (req, res) => {
    try {
      const { projections, assumptions, aiInsights } = req.body;
      const csvData = exportFinancialProjectionsToCSV(projections, assumptions, aiInsights);
      res.json({ csvData });
    } catch (error) {
      console.error('Error exporting financial projections:', error);
      res.status(500).json({ message: 'Failed to export financial projections' });
    }
  });

  // AI Financial Calculator route
  app.post('/api/ai/financial-calculator', isAuthenticated, async (req: any, res) => {
    try {
      const { businessProfile } = req.body;
      
      if (!businessProfile || !businessProfile.businessType) {
        return res.status(400).json({ 
          error: 'Business profile with business type is required' 
        });
      }

      // Import and use the financial calculator
      const { generateFinancialProjections } = await import('./lib/financialCalculator.js');
      const result = await generateFinancialProjections(businessProfile);
      
      res.json(result);
    } catch (error) {
      console.error('Error generating financial projections:', error);
      res.status(500).json({ 
        error: 'Failed to generate financial projections',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Financial Analysis Routes - New Feature
  const multer = (await import('multer')).default;
  const path = await import('path');
  const crypto = await import('crypto');

  // Configure multer for file uploads
  const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
    fileFilter: (req: any, file: any, cb: any) => {
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PDF, Word, Excel, and text files are allowed.'));
      }
    }
  });

  // File upload endpoint
  app.post('/api/financial-analysis/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { fileId } = req.body;
      const uploadPath = req.file.path;

      res.json({
        message: 'File uploaded successfully',
        fileId,
        uploadPath,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype
      });
    } catch (error: any) {
      console.error('File upload error:', error);
      res.status(500).json({ error: 'File upload failed' });
    }
  });

  // Analysis endpoint
  app.post('/api/financial-analysis/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const { fileId, fileName, fileType, uploadPath } = req.body;
      const userId = req.user?.claims?.sub;

      if (!userId || !fileId || !fileName || !fileType || !uploadPath) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Create initial analysis record
      const analysisId = crypto.randomUUID();
      await storage.createFinancialAnalysis({
        id: analysisId,
        userId,
        fileName,
        filePath: uploadPath,
        fileType,
        status: 'processing'
      });

      // Start analysis in background
      setTimeout(async () => {
        try {
          console.log(`[AI-ANALYSIS] Starting financial analysis for ${fileName} (${analysisId})`);
          
          if (!process.env.OPENAI_API_KEY) {
            throw new Error('OpenAI API key not configured');
          }
          
          const { FinancialAnalysisService } = await import('./financialAnalysisService');
          const analysisService = new FinancialAnalysisService();
          
          console.log(`[AI-ANALYSIS] Processing document: ${uploadPath}`);
          const analysisResult = await analysisService.analyzeFinancialPlan(uploadPath, fileType, fileName);
          
          console.log(`[AI-ANALYSIS] Analysis completed with score: ${analysisResult.overallScore}`);
          
          // Update analysis with results
          await storage.updateFinancialAnalysis(analysisId, {
            status: 'completed',
            overallScore: analysisResult.overallScore,
            analysisData: analysisResult,
            updatedAt: new Date()
          });

          // Create action items
          for (const actionItem of analysisResult.actionItems) {
            await storage.createFinancialAnalysisActionItem({
              analysisId,
              title: actionItem.title,
              description: actionItem.description,
              priority: actionItem.priority,
              category: actionItem.category,
              estimatedImpact: actionItem.estimatedImpact
            });
          }
          
          console.log(`[AI-ANALYSIS] Successfully completed analysis ${analysisId}`);
        } catch (error: any) {
          console.error('Analysis processing error:', error);
          console.error('Error stack:', error.stack);
          await storage.updateFinancialAnalysis(analysisId, {
            status: 'error',
            updatedAt: new Date()
          });
        }
      }, 1000); // Start processing after 1 second

      res.json({
        analysisId,
        message: 'Analysis started successfully'
      });
    } catch (error: any) {
      console.error('Analysis start error:', error);
      res.status(500).json({ error: 'Failed to start analysis' });
    }
  });

  // Get analysis results endpoint
  app.get('/api/financial-analysis/:analysisId', isAuthenticated, async (req: any, res) => {
    try {
      const { analysisId } = req.params;
      const userId = req.user?.claims?.sub;

      const analysis = await storage.getFinancialAnalysis(analysisId, userId);
      
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }

      // Get action items
      const actionItems = await storage.getFinancialAnalysisActionItems(analysisId);

      // If analysis data exists, merge it with database record
      if (analysis.analysisData) {
        const analysisData = analysis.analysisData as any;
        res.json({
          id: analysis.id,
          fileName: analysis.fileName,
          uploadedAt: analysis.createdAt,
          status: analysis.status,
          overallScore: analysis.overallScore || analysisData.overallScore || 0,
          keyFindings: analysisData.keyFindings || {
            strengths: [],
            weaknesses: [],
            opportunities: [],
            risks: []
          },
          sectionAnalysis: analysisData.sectionAnalysis || [],
          financialMetrics: analysisData.financialMetrics || [],
          actionItems: actionItems.map(item => ({
            id: item.id,
            title: item.title,
            description: item.description,
            priority: item.priority,
            category: item.category,
            estimatedImpact: item.estimatedImpact || '',
            completed: item.completed || false
          }))
        });
      } else {
        res.json({
          id: analysis.id,
          fileName: analysis.fileName,
          uploadedAt: analysis.createdAt,
          status: analysis.status,
          overallScore: 0,
          keyFindings: { strengths: [], weaknesses: [], opportunities: [], risks: [] },
          sectionAnalysis: [],
          financialMetrics: [],
          actionItems: []
        });
      }
    } catch (error: any) {
      console.error('Analysis retrieval error:', error);
      res.status(500).json({ error: 'Failed to retrieve analysis' });
    }
  });

  // Initialize collaboration service with WebSocket support
  const collaborationService = new CollaborationService(httpServer);

  // Collaboration API endpoints
  app.post('/api/collaboration/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const { analysisId, sessionName } = req.body;
      const userId = req.user?.claims?.sub;

      if (!userId || !analysisId || !sessionName) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Verify user owns the analysis or has access
      const analysis = await storage.getFinancialAnalysis(analysisId, userId);
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found or access denied' });
      }

      const sessionId = await collaborationService.createCollaborationSession(
        analysisId, 
        userId, 
        sessionName
      );

      res.json({ sessionId, message: 'Collaboration session created successfully' });
    } catch (error: any) {
      console.error('[COLLABORATION] Error creating session:', error);
      res.status(500).json({ error: 'Failed to create collaboration session' });
    }
  });

  app.post('/api/collaboration/sessions/:sessionId/invite', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const { userEmail } = req.body;
      const currentUserId = req.user?.claims?.sub;

      if (!currentUserId || !userEmail) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Find user by email
      const inviteUser = await storage.getUserByEmail(userEmail);
      if (!inviteUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      await collaborationService.inviteUserToSession(sessionId, inviteUser.id);

      res.json({ message: 'User invited to collaboration session successfully' });
    } catch (error: any) {
      console.error('[COLLABORATION] Error inviting user:', error);
      res.status(500).json({ error: 'Failed to invite user to session' });
    }
  });

  app.get('/api/collaboration/sessions/:analysisId', isAuthenticated, async (req: any, res) => {
    try {
      const { analysisId } = req.params;
      const userId = req.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get active collaboration sessions for analysis
      const sessions = await storage.getCollaborationSessionsForAnalysis(analysisId, userId);
      
      res.json({ sessions });
    } catch (error: any) {
      console.error('[COLLABORATION] Error getting sessions:', error);
      res.status(500).json({ error: 'Failed to retrieve collaboration sessions' });
    }
  });

  app.get('/api/collaboration/stats', isAuthenticated, async (req: any, res) => {
    try {
      const stats = {
        activeSessions: collaborationService.getActiveSessionsCount(),
        activeUsers: collaborationService.getActiveUsersCount(),
        timestamp: new Date().toISOString()
      };

      res.json(stats);
    } catch (error: any) {
      console.error('[COLLABORATION] Error getting stats:', error);
      res.status(500).json({ error: 'Failed to retrieve collaboration stats' });
    }
  });

  console.log('[COLLABORATION] Real-time collaboration service initialized');

  // SPA fallback handled by Vite middleware - removed redirect to prevent loops

  return httpServer;
}
