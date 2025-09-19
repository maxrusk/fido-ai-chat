import {
  users,
  chatSessions,
  chatMessages,
  businessContext,
  businessPlans,
  loanApplications,
  operationalSuggestions,
  aiActionsLog,
  financialAnalyses,
  financialAnalysisActionItems,

  type User,
  type UpsertUser,
  type ChatSession,
  type InsertChatSession,
  type ChatMessage,
  type InsertChatMessage,
  type BusinessContext,
  type InsertBusinessContext,
  type BusinessPlan,
  type InsertBusinessPlan,
  type LoanApplication,
  type InsertLoanApplication,
  type OperationalSuggestion,
  type InsertOperationalSuggestion,
  type AiActionLog,
  type InsertAiActionLog,
  type FinancialAnalysis,
  type InsertFinancialAnalysis,
  type FinancialAnalysisActionItem,
  type InsertFinancialAnalysisActionItem,

} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { encryptSensitiveData, decryptSensitiveData, hashPII } from "./security";
import { BusinessContextManager } from "./businessContextManager";
import RedisClient from "./redis";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserPreferences(userId: string, preferences: Partial<User>): Promise<User>;
  
  // Chat session operations
  getChatSessions(userId: string): Promise<ChatSession[]>;
  getChatSession(sessionId: string): Promise<ChatSession | undefined>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession>;
  deleteChatSession(sessionId: string): Promise<void>;
  
  // Chat message operations
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  deleteChatMessages(sessionId: string): Promise<void>;
  
  // Multi-agent business operations
  getBusinessPlans(userId: string): Promise<BusinessPlan[]>;
  getBusinessPlan(planId: string): Promise<BusinessPlan | undefined>;
  getBusinessPlanBySessionId(sessionId: string): Promise<BusinessPlan | undefined>;
  getCurrentBusinessPlan(userId: string): Promise<BusinessPlan | undefined>;
  createBusinessPlan(plan: InsertBusinessPlan): Promise<BusinessPlan>;
  updateBusinessPlan(planId: string, updates: Partial<BusinessPlan>): Promise<BusinessPlan>;
  updateBusinessPlanSection(planId: string, sectionId: string, content: string): Promise<BusinessPlan>;
  autoSaveBusinessPlan(planId: string, sections: any): Promise<BusinessPlan>;
  deleteBusinessPlan(planId: string): Promise<void>;
  
  getLoanApplications(userId: string): Promise<LoanApplication[]>;
  createLoanApplication(application: InsertLoanApplication): Promise<LoanApplication>;
  updateLoanApplication(applicationId: string, updates: Partial<LoanApplication>): Promise<LoanApplication>;
  
  getOperationalSuggestions(userId: string): Promise<OperationalSuggestion[]>;
  createOperationalSuggestion(suggestion: InsertOperationalSuggestion): Promise<OperationalSuggestion>;
  updateOperationalSuggestion(suggestionId: string, updates: Partial<OperationalSuggestion>): Promise<OperationalSuggestion>;
  
  logAiAction(action: InsertAiActionLog): Promise<AiActionLog>;
  
  // GDPR/CCPA compliance operations
  deleteAllChatSessions(userId: string): Promise<void>;
  deleteAllChatMessages(userId: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  anonymizeUser(userId: string, anonymousId: string): Promise<void>;

  // Business context operations
  getBusinessContext(userId: string): Promise<BusinessContext[]>;
  createBusinessContext(context: InsertBusinessContext): Promise<BusinessContext>;
  updateBusinessContext(id: string, updates: Partial<BusinessContext>): Promise<BusinessContext>;

  // Consent management operations
  recordUserConsent(userId: string, consentData: any): Promise<void>;
  updateUserConsentStatus(userId: string, status: string): Promise<void>;
  getUserConsentStatus(userId: string): Promise<string | null>;

  // Financial Analysis operations
  getFinancialAnalysis(analysisId: string, userId: string): Promise<FinancialAnalysis | undefined>;
  createFinancialAnalysis(analysis: InsertFinancialAnalysis): Promise<FinancialAnalysis>;
  updateFinancialAnalysis(analysisId: string, updates: Partial<FinancialAnalysis>): Promise<FinancialAnalysis>;
  getFinancialAnalysisActionItems(analysisId: string): Promise<FinancialAnalysisActionItem[]>;
  createFinancialAnalysisActionItem(actionItem: InsertFinancialAnalysisActionItem): Promise<FinancialAnalysisActionItem>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Handle both legacy ID format and new authId format
    const userToInsert = {
      ...userData,
      authId: userData.authId || userData.id, // Support both formats
    };

    const [user] = await db
      .insert(users)
      .values(userToInsert)
      .onConflictDoUpdate({
        target: users.authId, // Use authId for conflict resolution
        set: {
          ...userToInsert,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserPreferences(userId: string, preferences: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...preferences,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Chat session operations
  async getChatSessions(userId: string): Promise<ChatSession[]> {
    // Get recent session IDs from Redis if available
    const recentSessionIds = await RedisClient.getRecentSessions(userId);
    
    const sessions = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt));
    
    // Store user state in Redis for faster access
    if (sessions.length > 0) {
      await RedisClient.storeUserState(userId, {
        lastActivity: new Date(),
        totalSessions: sessions.length,
        recentSessions: sessions.slice(0, 5).map(s => s.id)
      });
    }
    
    return sessions;
  }

  async getChatSession(sessionId: string): Promise<ChatSession | undefined> {
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId));
    return session;
  }

  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const [newSession] = await db
      .insert(chatSessions)
      .values(session)
      .returning();
    return newSession as ChatSession;
  }

  async updateChatSession(sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession> {
    const [session] = await db
      .update(chatSessions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(chatSessions.id, sessionId))
      .returning();
    return session;
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId));
    await db.delete(chatSessions).where(eq(chatSessions.id, sessionId));
  }

  // Chat message operations
  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    // Try Redis first for faster retrieval
    const session = await this.getChatSession(sessionId);
    if (session) {
      const cachedMessages = await RedisClient.getChatMemory(session.userId, sessionId);
      if (cachedMessages && cachedMessages.length > 0) {
        console.log(`[REDIS] Retrieved ${cachedMessages.length} messages from cache for session ${sessionId}`);
        return cachedMessages;
      }
    }

    // Fallback to PostgreSQL
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);
    
    // Cache in Redis for future requests
    if (session && messages.length > 0) {
      await RedisClient.storeChatMemory(session.userId, sessionId, messages);
    }
    
    return messages;
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    // Store messages directly (encryption disabled for now)
    let processedMessage = { ...message };
    
    const [newMessage] = await db
      .insert(chatMessages)
      .values(processedMessage)
      .returning();

    // Update Redis cache with new message
    if (message.sessionId) {
      const session = await this.getChatSession(message.sessionId);
      if (session) {
        const allMessages = await db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.sessionId, message.sessionId))
          .orderBy(chatMessages.createdAt);
        
        // Update Redis cache
        await RedisClient.storeChatMemory(session.userId, message.sessionId, allMessages);
      }
    }

    // Extract business context from the message for cross-copilot continuity
    if (message.role === 'user' && message.sessionId) {
      try {
        // Get session info to determine user
        const session = await db
          .select()
          .from(chatSessions)
          .where(eq(chatSessions.id, message.sessionId))
          .limit(1);
        
        if (session.length > 0) {
          await BusinessContextManager.extractAndStoreContext(
            session[0].userId,
            message.content,
            `chat_session_${message.sessionId}`,
            message.sessionId
          );
        }
      } catch (error) {
        console.error('[CONTEXT] Failed to extract business context:', error);
      }
    }
    
    return newMessage;
  }

  async deleteChatMessages(sessionId: string): Promise<void> {
    await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId));
  }

  // GDPR/CCPA compliance operations
  async deleteAllChatSessions(userId: string): Promise<void> {
    // First get all session IDs for this user
    const userSessions = await db
      .select({ id: chatSessions.id })
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId));

    // Delete all messages for these sessions
    for (const session of userSessions) {
      await db.delete(chatMessages).where(eq(chatMessages.sessionId, session.id));
    }

    // Delete all sessions for this user
    await db.delete(chatSessions).where(eq(chatSessions.userId, userId));
    
    console.log(`[DATA-DELETION] Deleted ${userSessions.length} chat sessions for user: ${userId}`);
  }

  async deleteAllChatMessages(userId: string): Promise<void> {
    // Get all session IDs for this user
    const userSessions = await db
      .select({ id: chatSessions.id })
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId));

    // Delete all messages for these sessions
    for (const session of userSessions) {
      await db.delete(chatMessages).where(eq(chatMessages.sessionId, session.id));
    }
    
    console.log(`[DATA-DELETION] Deleted chat messages for user: ${userId}`);
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete all associated data first
    await this.deleteAllChatSessions(userId);
    
    // Delete the user record
    await db.delete(users).where(eq(users.id, userId));
    
    console.log(`[DATA-DELETION] Deleted user record: ${userId}`);
  }

  async anonymizeUser(userId: string, anonymousId: string): Promise<void> {
    // Replace user ID with anonymous hash in all records
    const hashedId = hashPII(anonymousId);
    
    // Update user record with anonymized data
    await db
      .update(users)
      .set({
        id: hashedId,
        email: `anonymous-${hashedId.slice(0, 8)}@anonymized.local`,
        firstName: 'Anonymous',
        lastName: 'User',
        profileImageUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Update chat sessions
    await db
      .update(chatSessions)
      .set({
        userId: hashedId,
        updatedAt: new Date(),
      })
      .where(eq(chatSessions.userId, userId));
    
    console.log(`[DATA-ANONYMIZATION] Anonymized user: ${userId} -> ${hashedId}`);
  }

  // Business context operations
  async getBusinessContext(userId: string): Promise<BusinessContext[]> {
    return await db
      .select()
      .from(businessContext)
      .where(eq(businessContext.userId, userId))
      .orderBy(desc(businessContext.updatedAt));
  }

  async createBusinessContext(context: InsertBusinessContext): Promise<BusinessContext> {
    const [newContext] = await db
      .insert(businessContext)
      .values(context)
      .returning();
    return newContext;
  }

  async updateBusinessContext(id: string, updates: Partial<BusinessContext>): Promise<BusinessContext> {
    const [context] = await db
      .update(businessContext)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(businessContext.id, id))
      .returning();
    return context;
  }

  // Note: CopilotSession functionality is handled through regular ChatSessions with copilotType field


  // Multi-Agent Business Operations

  // Business Plans (BusinessPlanArchitect)
  async getBusinessPlans(userId: string): Promise<BusinessPlan[]> {
    const plans = await db
      .select()
      .from(businessPlans)
      .where(eq(businessPlans.userId, userId))
      .orderBy(desc(businessPlans.updatedAt));
    return plans as BusinessPlan[];
  }

  async getBusinessPlan(planId: string): Promise<BusinessPlan | undefined> {
    const [plan] = await db
      .select()
      .from(businessPlans)
      .where(eq(businessPlans.id, planId))
      .limit(1);
    
    return plan as BusinessPlan | undefined;
  }

  async getBusinessPlanBySessionId(sessionId: string): Promise<BusinessPlan | undefined> {
    const [plan] = await db
      .select()
      .from(businessPlans)
      .where(eq(businessPlans.sessionId, sessionId))
      .limit(1);
    
    return plan as BusinessPlan | undefined;
  }

  async getCurrentBusinessPlan(userId: string): Promise<BusinessPlan | undefined> {
    const [plan] = await db
      .select()
      .from(businessPlans)
      .where(and(
        eq(businessPlans.userId, userId),
        eq(businessPlans.status, 'in_progress')
      ))
      .orderBy(desc(businessPlans.updatedAt))
      .limit(1);
    
    return plan as BusinessPlan | undefined;
  }

  async createBusinessPlan(plan: InsertBusinessPlan): Promise<BusinessPlan> {
    const [newPlan] = await db
      .insert(businessPlans)
      .values(plan)
      .returning();
    return newPlan as BusinessPlan;
  }

  async updateBusinessPlan(planId: string, updates: Partial<BusinessPlan>): Promise<BusinessPlan> {
    const [updated] = await db
      .update(businessPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(businessPlans.id, planId))
      .returning();
    
    if (!updated) {
      throw new Error('Business plan not found');
    }
    
    return updated as BusinessPlan;
  }

  async updateBusinessPlanSection(planId: string, sectionId: string, content: string): Promise<BusinessPlan> {
    // Get current plan
    const [currentPlan] = await db
      .select()
      .from(businessPlans)
      .where(eq(businessPlans.id, planId));
    
    if (!currentPlan) {
      throw new Error('Business plan not found');
    }

    // Update the specific section
    const currentSections = (currentPlan.sections as any) || {};
    const updatedSections = {
      ...currentSections,
      [sectionId]: {
        ...currentSections[sectionId],
        content,
        completed: content.length > 50, // Mark as completed if substantial content
        lastUpdated: new Date().toISOString()
      }
    };

    const [updated] = await db
      .update(businessPlans)
      .set({ 
        sections: updatedSections,
        updatedAt: new Date(),
        lastAutoSave: new Date()
      })
      .where(eq(businessPlans.id, planId))
      .returning();
    
    return updated!;
  }

  async autoSaveBusinessPlan(planId: string, sections: any): Promise<BusinessPlan> {
    const [updated] = await db
      .update(businessPlans)
      .set({ 
        sections,
        lastAutoSave: new Date(),
        updatedAt: new Date()
      })
      .where(eq(businessPlans.id, planId))
      .returning();
    
    if (!updated) {
      throw new Error('Business plan not found');
    }
    
    return updated;
  }



  async deleteBusinessPlan(planId: string): Promise<void> {
    await db.delete(businessPlans).where(eq(businessPlans.id, planId));
  }



  // Loan Applications (LoanNavigator)
  async getLoanApplications(userId: string): Promise<LoanApplication[]> {
    return await db
      .select()
      .from(loanApplications)
      .where(eq(loanApplications.userId, userId))
      .orderBy(desc(loanApplications.updatedAt));
  }

  async createLoanApplication(application: InsertLoanApplication): Promise<LoanApplication> {
    const [newApplication] = await db
      .insert(loanApplications)
      .values(application)
      .returning();
    return newApplication;
  }

  async updateLoanApplication(applicationId: string, updates: Partial<LoanApplication>): Promise<LoanApplication> {
    const [updatedApplication] = await db
      .update(loanApplications)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(loanApplications.id, applicationId))
      .returning();
    return updatedApplication;
  }

  // Operational Suggestions (OpsSpecialist)
  async getOperationalSuggestions(userId: string): Promise<OperationalSuggestion[]> {
    return await db
      .select()
      .from(operationalSuggestions)
      .where(eq(operationalSuggestions.userId, userId))
      .orderBy(desc(operationalSuggestions.createdAt));
  }

  async createOperationalSuggestion(suggestion: InsertOperationalSuggestion): Promise<OperationalSuggestion> {
    const [newSuggestion] = await db
      .insert(operationalSuggestions)
      .values(suggestion)
      .returning();
    return newSuggestion;
  }

  async updateOperationalSuggestion(suggestionId: string, updates: Partial<OperationalSuggestion>): Promise<OperationalSuggestion> {
    const [updatedSuggestion] = await db
      .update(operationalSuggestions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(operationalSuggestions.id, suggestionId))
      .returning();
    return updatedSuggestion;
  }

  // AI Actions Log (Cross-Copilot Analytics)
  async logAiAction(action: InsertAiActionLog): Promise<AiActionLog> {
    const [newAction] = await db
      .insert(aiActionsLog)
      .values(action)
      .returning();
    return newAction;
  }

  // Consent management operations
  async recordUserConsent(userId: string, consentData: any): Promise<void> {
    // Use raw SQL for now since we don't have proper schema for user_consents
    await db.execute(sql`
      INSERT INTO user_consents (
        user_id, terms_accepted, privacy_accepted, data_processing_consent, 
        ai_training_consent, consent_ip_address, consent_user_agent, consent_timestamp
      ) VALUES (
        ${userId}, ${consentData.termsAccepted}, ${consentData.privacyAccepted}, 
        ${consentData.dataProcessingConsent}, ${consentData.aiTrainingConsent || false},
        ${consentData.ipAddress || null}, ${consentData.userAgent || null}, 
        ${new Date(consentData.timestamp)}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        terms_accepted = EXCLUDED.terms_accepted,
        privacy_accepted = EXCLUDED.privacy_accepted,
        data_processing_consent = EXCLUDED.data_processing_consent,
        ai_training_consent = EXCLUDED.ai_training_consent,
        consent_ip_address = EXCLUDED.consent_ip_address,
        consent_user_agent = EXCLUDED.consent_user_agent,
        consent_timestamp = EXCLUDED.consent_timestamp,
        updated_at = NOW()
    `);
  }

  async updateUserConsentStatus(userId: string, status: string): Promise<void> {
    await db.update(users)
      .set({ 
        consentStatus: status,
        lastConsentDate: new Date()
      })
      .where(eq(users.id, userId));
  }

  async getUserConsentStatus(userId: string): Promise<string | null> {
    const [user] = await db.select({ consentStatus: users.consentStatus })
      .from(users)
      .where(eq(users.id, userId));
    return user?.consentStatus || null;
  }

  // Financial Projections operations
  async getFinancialProjections(userId: string): Promise<any | undefined> {
    // For now, return undefined - will implement database storage later
    return undefined;
  }

  async saveFinancialProjections(userId: string, data: any): Promise<void> {
    // For now, just log - will implement database storage later
    console.log(`[FINANCIAL] Saving projections for user ${userId}`);
  }

  // Financial Analysis operations
  async getFinancialAnalysis(analysisId: string, userId: string): Promise<FinancialAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(financialAnalyses)
      .where(and(eq(financialAnalyses.id, analysisId), eq(financialAnalyses.userId, userId)));
    return analysis;
  }

  async createFinancialAnalysis(analysis: InsertFinancialAnalysis): Promise<FinancialAnalysis> {
    const [newAnalysis] = await db
      .insert(financialAnalyses)
      .values(analysis)
      .returning();
    return newAnalysis;
  }

  async updateFinancialAnalysis(analysisId: string, updates: Partial<FinancialAnalysis>): Promise<FinancialAnalysis> {
    const [analysis] = await db
      .update(financialAnalyses)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(financialAnalyses.id, analysisId))
      .returning();
    return analysis;
  }

  async getFinancialAnalysisActionItems(analysisId: string): Promise<FinancialAnalysisActionItem[]> {
    return await db
      .select()
      .from(financialAnalysisActionItems)
      .where(eq(financialAnalysisActionItems.analysisId, analysisId))
      .orderBy(financialAnalysisActionItems.createdAt);
  }

  async createFinancialAnalysisActionItem(actionItem: InsertFinancialAnalysisActionItem): Promise<FinancialAnalysisActionItem> {
    const [newActionItem] = await db
      .insert(financialAnalysisActionItems)
      .values(actionItem)
      .returning();
    return newActionItem;
  }

  // Collaboration operations
  async getCollaborationSessionsForAnalysis(analysisId: string, userId: string): Promise<any[]> {
    // For now, return empty array - will implement full collaboration storage later
    return [];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
}

export const storage = new DatabaseStorage();
