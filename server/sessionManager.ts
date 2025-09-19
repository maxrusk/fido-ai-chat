import { storage } from "./storage";
import RedisClient from "./redis";

export interface SessionRestoreOptions {
  userId: string;
  copilotType?: string;
  maxHours?: number;
}

export class SessionManager {
  
  /**
   * Find the most appropriate session to restore for a user
   */
  static async findRestorableSession(options: SessionRestoreOptions) {
    const { userId, copilotType, maxHours = 24 } = options;
    
    try {
      // First check Redis for recent session data
      const userState = await RedisClient.getUserState(userId);
      if (userState && userState.recentSessions) {
        console.log(`[SESSION-RESTORE] Found Redis user state for ${userId}`);
        
        // Get the most recent session that matches criteria
        const sessions = await storage.getChatSessions(userId);
        const cutoffTime = new Date(Date.now() - (maxHours * 60 * 60 * 1000));
        
        const recentSession = sessions.find(session => {
          const isRecent = new Date(session.updatedAt) > cutoffTime;
          const typeMatches = !copilotType || session.copilotType === copilotType;
          return isRecent && typeMatches;
        });
        
        if (recentSession) {
          console.log(`[SESSION-RESTORE] Found restorable session: ${recentSession.id}`);
          return {
            session: recentSession,
            source: 'database',
            hasMessages: true
          };
        }
      }
      
      // Fallback to database-only search
      const sessions = await storage.getChatSessions(userId);
      const cutoffTime = new Date(Date.now() - (maxHours * 60 * 60 * 1000));
      
      const recentSession = sessions.find(session => {
        const isRecent = new Date(session.updatedAt) > cutoffTime;
        const typeMatches = !copilotType || session.copilotType === copilotType;
        return isRecent && typeMatches;
      });
      
      if (recentSession) {
        // Check if session has messages
        const messages = await storage.getChatMessages(recentSession.id);
        return {
          session: recentSession,
          source: 'database',
          hasMessages: messages.length > 0
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('[SESSION-RESTORE] Error finding restorable session:', error);
      return null;
    }
  }
  
  /**
   * Get comprehensive restore data for a user
   */
  static async getRestoreData(userId: string) {
    try {
      const sessions = await storage.getChatSessions(userId);
      const cutoffTime = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours
      
      const recentSessions = sessions.filter(session => 
        new Date(session.updatedAt) > cutoffTime
      );
      
      // Get business plan progress
      let businessPlanProgress = null;
      try {
        businessPlanProgress = await storage.getCurrentBusinessPlan(userId);
      } catch (error) {
        console.log('[SESSION-RESTORE] No current business plan found');
      }
      
      // Store summary in Redis
      const restoreData = {
        totalSessions: sessions.length,
        recentSessions: recentSessions.length,
        lastActivity: sessions.length > 0 ? sessions[0].updatedAt : null,
        hasBusinessPlan: !!businessPlanProgress,
        businessPlanProgress: businessPlanProgress ? {
          id: businessPlanProgress.id,
          businessName: businessPlanProgress.businessName,
          completionPercentage: calculateCompletionPercentage(businessPlanProgress)
        } : null
      };
      
      await RedisClient.storeUserState(userId, restoreData);
      
      return restoreData;
      
    } catch (error) {
      console.error('[SESSION-RESTORE] Error getting restore data:', error);
      return {
        totalSessions: 0,
        recentSessions: 0,
        lastActivity: null,
        hasBusinessPlan: false,
        businessPlanProgress: null
      };
    }
  }
  
  /**
   * Mark a session as actively restored to prevent duplicate restoration
   */
  static async markSessionRestored(userId: string, sessionId: string) {
    try {
      const key = `restored:${userId}:${sessionId}`;
      const redis = RedisClient.getInstance();
      if (redis && RedisClient.isConnected()) {
        await redis.setex(key, 3600, 'restored'); // 1 hour TTL
      }
    } catch (error) {
      console.error('[SESSION-RESTORE] Error marking session restored:', error);
    }
  }
  
  /**
   * Check if a session was recently restored to prevent duplicates
   */
  static async wasRecentlyRestored(userId: string, sessionId: string): Promise<boolean> {
    try {
      const key = `restored:${userId}:${sessionId}`;
      const redis = RedisClient.getInstance();
      if (redis && RedisClient.isConnected()) {
        const result = await redis.get(key);
        return !!result;
      }
      return false;
    } catch (error) {
      console.error('[SESSION-RESTORE] Error checking restore status:', error);
      return false;
    }
  }
}

/**
 * Calculate business plan completion percentage based on filled sections
 */
function calculateCompletionPercentage(plan: any): number {
  if (!plan) return 0;
  
  const sections = [
    'executiveSummary',
    'businessDescription', 
    'marketAnalysis',
    'productsServices',
    'marketingPlan',
    'operationsPlan',
    'financialProjections',
    'fundingRequest',
    'ownerBio'
  ];
  
  const completedSections = sections.filter(section => 
    plan[section] && plan[section].trim().length > 0
  ).length;
  
  return Math.round((completedSections / sections.length) * 100);
}

export default SessionManager;