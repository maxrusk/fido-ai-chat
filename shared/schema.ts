import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  integer,
  uuid,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for better type safety and SOC2 compliance
export const copilotTypeEnum = pgEnum("copilot_type", [
  "business_plan_architect",
  "funding_navigator", 
  "growth_engine"
]);

export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
  "system"
]);

export const actionTypeEnum = pgEnum("ai_action_type", [
  "document_generated",
  "loan_matched",
  "plan_exported",
  "recommendation_created",
  "analysis_completed",
  "template_applied"
]);

export const documentStatusEnum = pgEnum("document_status", [
  "draft",
  "in_progress", 
  "completed",
  "archived"
]);

export const loanStatusEnum = pgEnum("loan_status", [
  "not_started",
  "eligibility_check",
  "documentation",
  "lender_matching",
  "application_submitted",
  "approved",
  "declined"
]);

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey(), // Replit auth ID as primary key
  // Keep original auth fields for compatibility
  authId: varchar("auth_id").unique(), // Replit auth ID
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  
  // Enhanced user profile for fintech compliance
  companyName: varchar("company_name"),
  businessType: varchar("business_type"),
  companySize: varchar("company_size"),
  monthlyRevenue: decimal("monthly_revenue", { precision: 12, scale: 2 }),
  primaryGoals: jsonb("primary_goals"), // Store as structured data
  
  // AI preferences
  aiModel: varchar("ai_model").default("gpt-4o"),
  responseStyle: varchar("response_style").default("professional"),
  temperature: decimal("temperature", { precision: 3, scale: 2 }).default("0.7"),
  saveHistory: boolean("save_history").default(true),
  
  // SOC2 compliance fields
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  consentVersion: varchar("consent_version"), // Track privacy policy acceptance
  consentStatus: varchar("consent_status").default("pending"), // pending, accepted, declined
  lastConsentDate: timestamp("last_consent_date"), // When user last updated consent
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_users_auth_id").on(table.authId),
  index("idx_users_email").on(table.email),
  index("idx_users_active").on(table.isActive),
]);

export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar("title").notNull(),
  copilotType: copilotTypeEnum("copilot_type").notNull(),
  
  // Enhanced session tracking
  sessionGoal: text("session_goal"), // What user wants to accomplish
  status: varchar("status").default("active"), // active, completed, archived
  totalMessages: integer("total_messages").default(0),
  
  // Auto-save tracking for session preservation
  lastAutoSave: timestamp("last_auto_save"),
  
  // Business plan linking for AI output storage  
  businessPlanId: varchar("business_plan_id").references((): any => businessPlans.id, { onDelete: 'set null' }),
  
  // Metadata for context continuity
  contextData: jsonb("context_data"), // Cross-session business context
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_chat_sessions_user").on(table.userId),
  index("idx_chat_sessions_copilot").on(table.copilotType),
  index("idx_chat_sessions_status").on(table.status),
  index("idx_chat_sessions_business_plan").on(table.businessPlanId),
]);

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  
  // Enhanced message categorization
  messageType: varchar("message_type"), // question, response, system_notification
  topic: varchar("topic"), // marketing, financials, operations, etc.
  stage: varchar("stage"), // planning, execution, review
  
  // AI action tracking
  aiActionType: actionTypeEnum("ai_action_type"),
  aiActionResult: jsonb("ai_action_result"), // Store what the AI accomplished
  
  // Message metadata
  tokenCount: integer("token_count"),
  processingTimeMs: integer("processing_time_ms"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  
  // Additional metadata
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_messages_session").on(table.sessionId),
  index("idx_messages_role").on(table.role),
  index("idx_messages_topic").on(table.topic),
  index("idx_messages_ai_action").on(table.aiActionType),
  index("idx_messages_created").on(table.createdAt),
]);

// Business Plans - Core documents created by BusinessPlanArchitect
export const businessPlans = pgTable("business_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: uuid("session_id").references((): any => chatSessions.id),
  
  title: varchar("title").notNull(),
  status: documentStatusEnum("status").default("draft"),
  
  // Content storage
  contentMarkdown: text("content_markdown"),
  contentHtml: text("content_html"),
  contentJson: jsonb("content_json"), // Structured business plan data
  sections: jsonb("sections"), // Business plan sections data
  
  // Business plan metadata
  businessName: varchar("business_name"),
  industry: varchar("industry"),
  targetMarket: varchar("target_market"),
  fundingGoal: decimal("funding_goal", { precision: 12, scale: 2 }),
  
  // Version control
  version: integer("version").default(1),
  parentPlanId: uuid("parent_plan_id").references((): any => businessPlans.id),
  
  // Export tracking
  lastExportedAt: timestamp("last_exported_at"),
  exportCount: integer("export_count").default(0),
  lastAutoSave: timestamp("last_auto_save"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_business_plans_user").on(table.userId),
  index("idx_business_plans_status").on(table.status),
  index("idx_business_plans_business_name").on(table.businessName),
]);

// Loan Navigator - SBA Express loan tracking
export const loanApplications = pgTable("loan_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: uuid("session_id").references(() => chatSessions.id),
  
  // Loan details
  loanType: varchar("loan_type").default("sba_express"),
  requestedAmount: decimal("requested_amount", { precision: 12, scale: 2 }),
  purpose: text("purpose"),
  
  // Application status
  status: loanStatusEnum("status").default("not_started"),
  eligibilityScore: decimal("eligibility_score", { precision: 3, scale: 2 }),
  
  // Lender matching
  matchedLenders: jsonb("matched_lenders"), // Array of matched lender data
  recommendedLender: varchar("recommended_lender"),
  
  // Requirements tracking
  documentsRequired: jsonb("documents_required"),
  documentsCompleted: jsonb("documents_completed"),
  completionPercentage: decimal("completion_percentage", { precision: 5, scale: 2 }),
  
  // AI insights
  fundingInsights: jsonb("funding_insights"), // AI-generated recommendations
  riskAssessment: jsonb("risk_assessment"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_loan_applications_user").on(table.userId),
  index("idx_loan_applications_status").on(table.status),
  index("idx_loan_applications_amount").on(table.requestedAmount),
]);

// Operations Specialist - Business operational suggestions
export const operationalSuggestions = pgTable("operational_suggestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: uuid("session_id").references(() => chatSessions.id),
  
  // Suggestion details
  category: varchar("category").notNull(), // hiring, tools, processes, growth, etc.
  subcategory: varchar("subcategory"), // marketing_tools, hr_software, etc.
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  
  // Implementation details
  priority: varchar("priority").default("medium"), // low, medium, high, critical
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  timeframe: varchar("timeframe"), // immediate, 30_days, 90_days, 6_months
  difficulty: varchar("difficulty").default("medium"), // easy, medium, hard
  
  // Resources and next steps
  resources: jsonb("resources"), // Links, tools, contacts
  nextSteps: jsonb("next_steps"), // Action items
  
  // Tracking
  implemented: boolean("implemented").default(false),
  implementedAt: timestamp("implemented_at"),
  feedback: text("feedback"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_operational_suggestions_user").on(table.userId),
  index("idx_operational_suggestions_category").on(table.category),
  index("idx_operational_suggestions_priority").on(table.priority),
  index("idx_operational_suggestions_implemented").on(table.implemented),
]);

// AI Actions Log - Track all agentic actions across copilots
export const aiActionsLog = pgTable("ai_actions_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: uuid("session_id").references(() => chatSessions.id),
  messageId: uuid("message_id").references(() => chatMessages.id),
  
  // Action details
  copilotType: copilotTypeEnum("copilot_type").notNull(),
  actionType: actionTypeEnum("action_type").notNull(),
  actionDescription: text("action_description"),
  
  // Action results
  success: boolean("success").default(true),
  resultData: jsonb("result_data"), // What was created/generated
  errorMessage: text("error_message"),
  
  // Performance metrics
  processingTimeMs: integer("processing_time_ms"),
  tokenUsage: jsonb("token_usage"), // Track API costs
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ai_actions_user").on(table.userId),
  index("idx_ai_actions_copilot").on(table.copilotType),
  index("idx_ai_actions_type").on(table.actionType),
  index("idx_ai_actions_success").on(table.success),
  index("idx_ai_actions_created").on(table.createdAt),
]);

// Business Context - Enhanced entity extraction and cross-copilot data
export const businessContext = pgTable("business_context", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  contextType: varchar("context_type").notNull(), // business_info, market_analysis, financial_data, etc.
  entityType: varchar("entity_type"), // company, product, market, competitor, etc.
  entityName: varchar("entity_name"), // Name of the entity extracted
  
  data: jsonb("data").notNull(),
  source: copilotTypeEnum("source").notNull(), // Which copilot extracted this
  sourceSessionId: uuid("source_session_id").references(() => chatSessions.id),
  
  // Data quality tracking
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.8"),
  verified: boolean("verified").default(false),
  verifiedAt: timestamp("verified_at"),
  
  // Cross-copilot sharing
  sharedWithCopilots: text("shared_with_copilots").array(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_business_context_user").on(table.userId),
  index("idx_business_context_type").on(table.contextType),
  index("idx_business_context_entity").on(table.entityType),
  index("idx_business_context_source").on(table.source),
]);

// Real-time collaboration tables
export const collaborationSessions = pgTable("collaboration_sessions", {
  id: varchar("id").primaryKey().$defaultFn(() => randomUUID()),
  analysisId: varchar("analysis_id").notNull().references(() => financialAnalyses.id, { onDelete: 'cascade' }),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionName: varchar("session_name").notNull(),
  isActive: boolean("is_active").default(true),
  allowedUsers: text("allowed_users").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_collab_sessions_analysis").on(table.analysisId),
  index("idx_collab_sessions_owner").on(table.ownerId),
  index("idx_collab_sessions_active").on(table.isActive),
]);

export const collaborationMarkers = pgTable("collaboration_markers", {
  id: varchar("id").primaryKey().$defaultFn(() => randomUUID()),
  sessionId: varchar("session_id").notNull().references(() => collaborationSessions.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  sectionId: varchar("section_id").notNull(), // e.g., "financial_metrics", "key_findings"
  markerType: varchar("marker_type").notNull(), // "viewing", "commenting", "editing"
  position: jsonb("position"), // { line: 10, column: 5, selectionStart: 0, selectionEnd: 10 }
  content: text("content"), // Comment text or edit content
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"), // Auto-cleanup inactive markers
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_collab_markers_session").on(table.sessionId),
  index("idx_collab_markers_user").on(table.userId),
  index("idx_collab_markers_section").on(table.sectionId),
  index("idx_collab_markers_active").on(table.isActive),
]);

export const collaborationEvents = pgTable("collaboration_events", {
  id: varchar("id").primaryKey().$defaultFn(() => randomUUID()),
  sessionId: varchar("session_id").notNull().references(() => collaborationSessions.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventType: varchar("event_type").notNull(), // "join", "leave", "comment", "edit", "reaction"
  eventData: jsonb("event_data"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_collab_events_session").on(table.sessionId),
  index("idx_collab_events_type").on(table.eventType),
  index("idx_collab_events_created").on(table.createdAt),
]);

// Enhanced Relations for Multi-Agent Architecture
export const usersRelations = relations(users, ({ many }) => ({
  chatSessions: many(chatSessions),
  businessPlans: many(businessPlans),
  loanApplications: many(loanApplications),
  operationalSuggestions: many(operationalSuggestions),
  businessContext: many(businessContext),
  aiActionsLog: many(aiActionsLog),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [chatSessions.userId],
    references: [users.id],
  }),
  messages: many(chatMessages),
  businessPlans: many(businessPlans),
  loanApplications: many(loanApplications),
  operationalSuggestions: many(operationalSuggestions),
  aiActionsLog: many(aiActionsLog),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one, many }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
  aiActionsLog: many(aiActionsLog),
}));

export const businessPlansRelations = relations(businessPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [businessPlans.userId],
    references: [users.id],
  }),
  session: one(chatSessions, {
    fields: [businessPlans.sessionId],
    references: [chatSessions.id],
  }),
  parentPlan: one(businessPlans, {
    fields: [businessPlans.parentPlanId],
    references: [businessPlans.id],
  }),
  childPlans: many(businessPlans),
}));

export const loanApplicationsRelations = relations(loanApplications, ({ one }) => ({
  user: one(users, {
    fields: [loanApplications.userId],
    references: [users.id],
  }),
  session: one(chatSessions, {
    fields: [loanApplications.sessionId],
    references: [chatSessions.id],
  }),
}));

export const operationalSuggestionsRelations = relations(operationalSuggestions, ({ one }) => ({
  user: one(users, {
    fields: [operationalSuggestions.userId],
    references: [users.id],
  }),
  session: one(chatSessions, {
    fields: [operationalSuggestions.sessionId],
    references: [chatSessions.id],
  }),
}));

export const aiActionsLogRelations = relations(aiActionsLog, ({ one }) => ({
  user: one(users, {
    fields: [aiActionsLog.userId],
    references: [users.id],
  }),
  session: one(chatSessions, {
    fields: [aiActionsLog.sessionId],
    references: [chatSessions.id],
  }),
  message: one(chatMessages, {
    fields: [aiActionsLog.messageId],
    references: [chatMessages.id],
  }),
}));

export const businessContextRelations = relations(businessContext, ({ one }) => ({
  user: one(users, {
    fields: [businessContext.userId],
    references: [users.id],
  }),
  sourceSession: one(chatSessions, {
    fields: [businessContext.sourceSessionId],
    references: [chatSessions.id],
  }),
}));

// Insert Schemas with Enhanced Validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertBusinessPlanSchema = createInsertSchema(businessPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLoanApplicationSchema = createInsertSchema(loanApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOperationalSuggestionSchema = createInsertSchema(operationalSuggestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiActionLogSchema = createInsertSchema(aiActionsLog).omit({
  id: true,
  createdAt: true,
});

export const insertBusinessContextSchema = createInsertSchema(businessContext).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Enhanced Type Exports for Multi-Agent Architecture
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type BusinessPlan = typeof businessPlans.$inferSelect;
export type InsertBusinessPlan = z.infer<typeof insertBusinessPlanSchema>;

export type LoanApplication = typeof loanApplications.$inferSelect;
export type InsertLoanApplication = z.infer<typeof insertLoanApplicationSchema>;

export type OperationalSuggestion = typeof operationalSuggestions.$inferSelect;
export type InsertOperationalSuggestion = z.infer<typeof insertOperationalSuggestionSchema>;

export type AiActionLog = typeof aiActionsLog.$inferSelect;
export type InsertAiActionLog = z.infer<typeof insertAiActionLogSchema>;

export type BusinessContext = typeof businessContext.$inferSelect;
export type InsertBusinessContext = z.infer<typeof insertBusinessContextSchema>;

// Real-time collaboration types
export type CollaborationSession = typeof collaborationSessions.$inferSelect;
export type InsertCollaborationSession = typeof collaborationSessions.$inferInsert;
export type CollaborationMarker = typeof collaborationMarkers.$inferSelect;
export type InsertCollaborationMarker = typeof collaborationMarkers.$inferInsert;
export type CollaborationEvent = typeof collaborationEvents.$inferSelect;
export type InsertCollaborationEvent = typeof collaborationEvents.$inferInsert;

// Utility types for better type safety
export type CopilotType = "business_plan_architect" | "funding_navigator" | "growth_engine";
export type MessageRole = "user" | "assistant" | "system";
export type ActionType = "document_generated" | "loan_matched" | "plan_exported" | "recommendation_created" | "analysis_completed" | "template_applied";
export type DocumentStatus = "draft" | "in_progress" | "completed" | "archived";
export type LoanStatus = "not_started" | "eligibility_check" | "documentation" | "lender_matching" | "application_submitted" | "approved" | "declined";

// Analytics and monitoring tables for user behavior and system performance
export const userAnalytics = pgTable("user_analytics", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  sessionId: varchar("session_id"),
  action: varchar("action").notNull(), // e.g., 'page_view', 'chat_message', 'business_plan_export'
  page: varchar("page"),
  metadata: jsonb("metadata"), // Additional context data
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  endpoint: varchar("endpoint").notNull(),
  method: varchar("method").notNull(),
  statusCode: integer("status_code").notNull(),
  responseTime: integer("response_time").notNull(), // milliseconds
  userId: varchar("user_id"),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const conversationAnalytics = pgTable("conversation_analytics", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  sessionId: integer("session_id").notNull(),
  copilotType: varchar("copilot_type").notNull(),
  messageCount: integer("message_count").notNull(),
  aiResponseTime: integer("ai_response_time"), // milliseconds for AI response
  tokensUsed: integer("tokens_used"), // OpenAI tokens consumed
  businessPlanSection: varchar("business_plan_section"), // Which section was discussed
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Insert schemas for analytics tables
export const insertUserAnalyticsSchema = createInsertSchema(userAnalytics).omit({
  id: true,
  timestamp: true,
});

export const insertSystemMetricsSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  timestamp: true,
});

export const insertConversationAnalyticsSchema = createInsertSchema(conversationAnalytics).omit({
  id: true,
  timestamp: true,
});

// Analytics type exports
export type UserAnalytics = typeof userAnalytics.$inferSelect;
export type InsertUserAnalytics = z.infer<typeof insertUserAnalyticsSchema>;

export type SystemMetrics = typeof systemMetrics.$inferSelect;
export type InsertSystemMetrics = z.infer<typeof insertSystemMetricsSchema>;

export type ConversationAnalytics = typeof conversationAnalytics.$inferSelect;
export type InsertConversationAnalytics = z.infer<typeof insertConversationAnalyticsSchema>;

// Financial Analysis Tables
export const financialAnalyses = pgTable("financial_analyses", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileType: varchar("file_type").notNull(),
  status: varchar("status", { enum: ['processing', 'completed', 'error'] }).notNull().default('processing'),
  overallScore: integer("overall_score"),
  analysisData: jsonb("analysis_data"), // Store the complete analysis results
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_financial_analyses_user").on(table.userId),
  index("idx_financial_analyses_status").on(table.status),
]);

export const financialAnalysisActionItems = pgTable("financial_analysis_action_items", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  analysisId: varchar("analysis_id").notNull().references(() => financialAnalyses.id, { onDelete: 'cascade' }),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  priority: varchar("priority", { enum: ['high', 'medium', 'low'] }).notNull(),
  category: varchar("category").notNull(),
  estimatedImpact: varchar("estimated_impact"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Financial Analysis Relations
export const financialAnalysesRelations = relations(financialAnalyses, ({ one, many }) => ({
  user: one(users, {
    fields: [financialAnalyses.userId],
    references: [users.id],
  }),
  actionItems: many(financialAnalysisActionItems),
}));

export const financialAnalysisActionItemsRelations = relations(financialAnalysisActionItems, ({ one }) => ({
  analysis: one(financialAnalyses, {
    fields: [financialAnalysisActionItems.analysisId],
    references: [financialAnalyses.id],
  }),
}));

export type InsertFinancialAnalysis = typeof financialAnalyses.$inferInsert;
export type FinancialAnalysis = typeof financialAnalyses.$inferSelect;
export type InsertFinancialAnalysisActionItem = typeof financialAnalysisActionItems.$inferInsert;
export type FinancialAnalysisActionItem = typeof financialAnalysisActionItems.$inferSelect;

