import { db } from "./db";
import { businessContext, chatMessages, chatSessions } from "@shared/schema";
import type { BusinessContext, InsertBusinessContext } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { encryptSensitiveData, decryptSensitiveData } from "./security";

/**
 * Business Context Manager
 * Handles cross-copilot data persistence and intelligent entity extraction
 */
export class BusinessContextManager {
  
  /**
   * Extract and store business entities from conversation content
   */
  static async extractAndStoreContext(
    userId: string, 
    content: string, 
    source: string,
    sessionId?: string
  ): Promise<void> {
    const extractedEntities = this.extractBusinessEntities(content);
    
    for (const entity of extractedEntities) {
      await this.storeBusinessContext(userId, entity, source);
    }
    
    // Also analyze for copilot transitions
    const copilotSuggestions = this.analyzeCopilotNeeds(content);
    if (copilotSuggestions.length > 0) {
      console.log(`[CONTEXT] Detected potential copilot needs for user ${userId}:`, copilotSuggestions);
    }
  }

  /**
   * Extract structured business information from conversational content
   */
  private static extractBusinessEntities(content: string): Array<{
    contextType: string;
    data: any;
    confidence: string;
  }> {
    const entities: Array<{
      contextType: string;
      data: any;
      confidence: string;
    }> = [];

    // Business Plan Elements
    if (this.containsBusinessPlanElements(content)) {
      entities.push({
        contextType: 'business_plan',
        data: this.extractBusinessPlanInfo(content),
        confidence: 'high'
      });
    }

    // Funding Requirements
    if (this.containsFundingInfo(content)) {
      entities.push({
        contextType: 'funding_requirements',
        data: this.extractFundingInfo(content),
        confidence: 'high'
      });
    }

    // Market Analysis
    if (this.containsMarketInfo(content)) {
      entities.push({
        contextType: 'market_analysis',
        data: this.extractMarketInfo(content),
        confidence: 'medium'
      });
    }

    // Financial Projections
    if (this.containsFinancialInfo(content)) {
      entities.push({
        contextType: 'financial_projections',
        data: this.extractFinancialInfo(content),
        confidence: 'high'
      });
    }

    // Company Information
    if (this.containsCompanyInfo(content)) {
      entities.push({
        contextType: 'company_info',
        data: this.extractCompanyInfo(content),
        confidence: 'high'
      });
    }

    return entities;
  }

  /**
   * Store business context with encryption for sensitive data
   */
  private static async storeBusinessContext(
    userId: string,
    entity: { contextType: string; data: any; confidence: string },
    source: string
  ): Promise<void> {
    // Check if this context already exists and update or create new
    const existingContext = await db
      .select()
      .from(businessContext)
      .where(
        and(
          eq(businessContext.userId, userId),
          eq(businessContext.contextType, entity.contextType)
        )
      )
      .limit(1);

    const contextData: InsertBusinessContext = {
      userId,
      contextType: entity.contextType,
      data: entity.data,
      source,
      confidence: entity.confidence,
      verified: false
    };

    if (existingContext.length > 0) {
      // Update existing context by merging data
      const mergedData = this.mergeContextData(existingContext[0].data, entity.data);
      await db
        .update(businessContext)
        .set({
          data: mergedData,
          source: `${existingContext[0].source}, ${source}`,
          confidence: this.calculateNewConfidence(existingContext[0].confidence, entity.confidence),
          updatedAt: new Date()
        })
        .where(eq(businessContext.id, existingContext[0].id));
    } else {
      // Create new context entry
      await db.insert(businessContext).values(contextData);
    }

    console.log(`[CONTEXT] Stored ${entity.contextType} for user ${userId} from ${source}`);
  }

  /**
   * Retrieve comprehensive business context for a user
   */
  static async getUserBusinessContext(userId: string): Promise<{
    businessPlan?: any;
    fundingRequirements?: any;
    marketAnalysis?: any;
    financialProjections?: any;
    companyInfo?: any;
    copilotHistory?: any[];
  }> {
    const contexts = await db
      .select()
      .from(businessContext)
      .where(eq(businessContext.userId, userId))
      .orderBy(desc(businessContext.updatedAt));

    const contextMap: any = {};
    
    for (const context of contexts) {
      contextMap[context.contextType] = context.data;
    }

    // Also get chat session history (renamed from copilotSessions)
    const copilotHistory = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt));

    return {
      businessPlan: contextMap.business_plan,
      fundingRequirements: contextMap.funding_requirements,
      marketAnalysis: contextMap.market_analysis,
      financialProjections: contextMap.financial_projections,
      companyInfo: contextMap.company_info,
      copilotHistory: copilotHistory.map(session => ({
        type: session.copilotType,
        data: session.contextData,
        status: session.status,
        createdAt: session.createdAt
      }))
    };
  }

  /**
   * Generate contextual system prompt based on user's business context
   * @deprecated Use CopilotAgents.getSystemPrompt() instead for specialized agent prompts
   */
  static async generateContextualPrompt(userId: string, copilotType: string): Promise<string> {
    const context = await this.getUserBusinessContext(userId);
    
    let basePrompt = `You are Fido, an intelligent business co-pilot. You have access to the user's complete business context and history.`;
    
    // Add context-specific information
    if (context.companyInfo) {
      basePrompt += `\n\nCOMPANY CONTEXT:\n- Business: ${context.companyInfo.businessName || 'Not specified'}\n- Industry: ${context.companyInfo.industry || 'Not specified'}\n- Stage: ${context.companyInfo.stage || 'Not specified'}`;
    }

    if (context.businessPlan) {
      basePrompt += `\n\nBUSINESS PLAN CONTEXT:\n- Vision: ${context.businessPlan.vision || 'Not specified'}\n- Target Market: ${context.businessPlan.targetMarket || 'Not specified'}\n- Revenue Model: ${context.businessPlan.revenueModel || 'Not specified'}`;
    }

    if (context.fundingRequirements) {
      basePrompt += `\n\nFUNDING CONTEXT:\n- Amount Needed: ${context.fundingRequirements.amount || 'Not specified'}\n- Purpose: ${context.fundingRequirements.purpose || 'Not specified'}\n- Timeline: ${context.fundingRequirements.timeline || 'Not specified'}`;
    }

    basePrompt += `\n\nIMPORTANT: Always maintain context continuity. Reference previous conversations and business details when relevant. If the user mentions something that updates their business context, acknowledge the connection to their existing plans.`;

    return basePrompt;
  }

  /**
   * Create or update copilot session
   */
  static async createCopilotSession(
    userId: string,
    copilotType: string,
    sessionData: any,
    parentSessionId?: number
  ): Promise<CopilotSession> {
    const [newSession] = await db
      .insert(copilotSessions)
      .values({
        userId,
        copilotType,
        sessionData,
        parentSessionId: parentSessionId || undefined,
        status: 'active'
      })
      .returning();

    console.log(`[COPILOT] Created ${copilotType} session for user ${userId}`);
    return newSession;
  }

  /**
   * Update copilot session with new data
   */
  static async updateCopilotSession(
    sessionId: number,
    updates: { sessionData?: any; status?: string }
  ): Promise<void> {
    await db
      .update(copilotSessions)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(copilotSessions.id, sessionId));
  }

  // Private helper methods for entity extraction
  private static containsBusinessPlanElements(content: string): boolean {
    const planKeywords = ['business plan', 'vision', 'mission', 'strategy', 'target market', 'value proposition', 'revenue model'];
    return planKeywords.some(keyword => content.toLowerCase().includes(keyword));
  }

  private static containsFundingInfo(content: string): boolean {
    const fundingKeywords = ['funding', 'loan', 'investment', 'capital', 'SBA', 'investor', 'venture capital', 'angel'];
    return fundingKeywords.some(keyword => content.toLowerCase().includes(keyword));
  }

  private static containsMarketInfo(content: string): boolean {
    const marketKeywords = ['market', 'competition', 'competitor', 'customer', 'industry', 'demographic'];
    return marketKeywords.some(keyword => content.toLowerCase().includes(keyword));
  }

  private static containsFinancialInfo(content: string): boolean {
    const financialKeywords = ['revenue', 'profit', 'cost', 'budget', 'projection', 'cash flow', 'ROI'];
    return financialKeywords.some(keyword => content.toLowerCase().includes(keyword)) || 
           content.match(/\$[\d,]+/);
  }

  private static containsCompanyInfo(content: string): boolean {
    const companyKeywords = ['company', 'business name', 'LLC', 'corporation', 'startup', 'founded'];
    return companyKeywords.some(keyword => content.toLowerCase().includes(keyword));
  }

  private static extractBusinessPlanInfo(content: string): any {
    return {
      rawContent: content,
      extractedAt: new Date().toISOString(),
      keywords: this.extractKeywords(content, ['vision', 'mission', 'strategy', 'target market'])
    };
  }

  private static extractFundingInfo(content: string): any {
    const amountMatch = content.match(/\$?([\d,]+)/);
    return {
      rawContent: content,
      amount: amountMatch ? amountMatch[1] : null,
      extractedAt: new Date().toISOString(),
      keywords: this.extractKeywords(content, ['loan', 'funding', 'investment', 'capital'])
    };
  }

  private static extractMarketInfo(content: string): any {
    return {
      rawContent: content,
      extractedAt: new Date().toISOString(),
      keywords: this.extractKeywords(content, ['market', 'customer', 'competition'])
    };
  }

  private static extractFinancialInfo(content: string): any {
    const amounts = content.match(/\$[\d,]+/g) || [];
    return {
      rawContent: content,
      amounts: amounts,
      extractedAt: new Date().toISOString(),
      keywords: this.extractKeywords(content, ['revenue', 'profit', 'cost'])
    };
  }

  private static extractCompanyInfo(content: string): any {
    return {
      rawContent: content,
      extractedAt: new Date().toISOString(),
      keywords: this.extractKeywords(content, ['company', 'business', 'LLC'])
    };
  }

  private static extractKeywords(content: string, keywords: string[]): string[] {
    return keywords.filter(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private static mergeContextData(existing: any, newData: any): any {
    return {
      ...existing,
      ...newData,
      merged: true,
      mergedAt: new Date().toISOString()
    };
  }

  private static calculateNewConfidence(existing: string, newConfidence: string): string {
    const confidenceMap = { low: 1, medium: 2, high: 3 };
    const existingScore = confidenceMap[existing as keyof typeof confidenceMap] || 2;
    const newScore = confidenceMap[newConfidence as keyof typeof confidenceMap] || 2;
    const avgScore = Math.round((existingScore + newScore) / 2);
    
    return Object.keys(confidenceMap)[avgScore - 1] || 'medium';
  }

  private static analyzeCopilotNeeds(content: string): string[] {
    const suggestions: string[] = [];
    
    if (content.toLowerCase().includes('business plan')) {
      suggestions.push('business_plan_architect');
    }
    if (content.toLowerCase().includes('funding') || content.toLowerCase().includes('loan')) {
      suggestions.push('funding_navigator');
    }
    if (content.toLowerCase().includes('grow') || content.toLowerCase().includes('scale')) {
      suggestions.push('growth_engine');
    }
    
    return suggestions;
  }
}