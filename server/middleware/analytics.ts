import type { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { 
  userAnalytics, 
  systemMetrics, 
  conversationAnalytics,
  type InsertUserAnalytics,
  type InsertSystemMetrics,
  type InsertConversationAnalytics 
} from '@shared/schema';
import { count, countDistinct, avg, sql } from 'drizzle-orm';

interface AnalyticsRequest extends Request {
  startTime?: number;
  userId?: string;
}

// Enhanced request logging with performance metrics
export const analyticsMiddleware = (req: AnalyticsRequest, res: Response, next: NextFunction) => {
  req.startTime = Date.now();
  
  // Extract user ID from session/auth
  req.userId = (req as any).user?.claims?.sub || 'anonymous';
  
  // Log request metrics on response finish
  res.on('finish', async () => {
    const duration = Date.now() - (req.startTime || 0);
    const endpoint = req.route?.path || req.path;
    
    try {
      // System metrics tracking
      await logSystemMetrics({
        endpoint,
        method: req.method,
        statusCode: res.statusCode,
        responseTime: duration,
        userId: req.userId,
        userAgent: req.get('User-Agent') || '',
        ipAddress: req.ip || req.connection.remoteAddress || '',
        timestamp: new Date()
      });

      // User activity tracking (if authenticated)
      if (req.userId && req.userId !== 'anonymous') {
        await logUserActivity({
          userId: req.userId,
          action: `${req.method} ${endpoint}`,
          metadata: {
            responseTime: duration,
            statusCode: res.statusCode,
            userAgent: req.get('User-Agent'),
            referer: req.get('Referer')
          },
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Analytics logging failed:', error);
    }
  });

  next();
};

// Log system performance metrics
export async function logSystemMetrics(metrics: {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userId?: string;
  userAgent: string;
  ipAddress: string;
  timestamp: Date;
}) {
  await db.insert(systemMetrics).values({
    endpoint: metrics.endpoint,
    method: metrics.method,
    statusCode: metrics.statusCode,
    responseTime: metrics.responseTime,
    userId: metrics.userId,
    userAgent: metrics.userAgent,
    ipAddress: metrics.ipAddress,
    timestamp: metrics.timestamp
  });
}

// Log user activity and behavior
export async function logUserActivity(activity: {
  userId: string;
  action: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}) {
  const analyticsData: InsertUserAnalytics = {
    userId: activity.userId,
    sessionId: null, // Will be populated by session middleware if available
    action: activity.action,
    page: null,
    metadata: activity.metadata || {}
  };

  await db.insert(userAnalytics).values(analyticsData);
}

// Log conversation-specific analytics
export async function logConversationMetrics(metrics: {
  userId: string;
  sessionId: number;
  copilotType: string;
  messageCount: number;
  aiResponseTime?: number;
  tokensUsed?: number;
  businessPlanSection?: string;
  timestamp: Date;
}) {
  const conversationData: InsertConversationAnalytics = {
    userId: metrics.userId,
    sessionId: metrics.sessionId,
    copilotType: metrics.copilotType,
    messageCount: metrics.messageCount,
    aiResponseTime: metrics.aiResponseTime,
    tokensUsed: metrics.tokensUsed,
    businessPlanSection: metrics.businessPlanSection
  };

  await db.insert(conversationAnalytics).values(conversationData);
}

// Get analytics dashboard data
export async function getAnalyticsDashboard(timeframe: '24h' | '7d' | '30d' = '7d') {
  const since = new Date();
  switch (timeframe) {
    case '24h':
      since.setHours(since.getHours() - 24);
      break;
    case '7d':
      since.setDate(since.getDate() - 7);
      break;
    case '30d':
      since.setDate(since.getDate() - 30);
      break;
  }

  try {
    const [
      totalUsersResult,
      activeUsersResult,
      totalSessionsResult,
      avgResponseTimeResult,
      errorRateResult
    ] = await Promise.all([
      // Total unique users
      db.select({ count: countDistinct(userAnalytics.userId) })
        .from(userAnalytics)
        .where(sql`${userAnalytics.timestamp} >= ${since}`),

      // Active users in timeframe (users who sent messages)
      db.select({ count: countDistinct(userAnalytics.userId) })
        .from(userAnalytics)
        .where(sql`${userAnalytics.timestamp} >= ${since} AND ${userAnalytics.action} LIKE '%chat%'`),

      // Total conversation sessions
      db.select({ count: count() })
        .from(conversationAnalytics)
        .where(sql`${conversationAnalytics.timestamp} >= ${since}`),

      // Average API response time
      db.select({ avgTime: avg(systemMetrics.responseTime) })
        .from(systemMetrics)
        .where(sql`${systemMetrics.timestamp} >= ${since} AND ${systemMetrics.endpoint} LIKE '/api/%'`),

      // Error rate calculation
      db.select({
        totalRequests: count(),
        errorRequests: sql<number>`COUNT(CASE WHEN ${systemMetrics.statusCode} >= 400 THEN 1 END)`
      })
        .from(systemMetrics)
        .where(sql`${systemMetrics.timestamp} >= ${since}`)
    ]);

    const totalUsers = totalUsersResult[0]?.count || 0;
    const activeUsers = activeUsersResult[0]?.count || 0;
    const totalSessions = totalSessionsResult[0]?.count || 0;
    const avgResponseTime = Math.round(Number(avgResponseTimeResult[0]?.avgTime) || 0);
    
    const errorRate = errorRateResult[0] ? 
      ((Number(errorRateResult[0].errorRequests) / Number(errorRateResult[0].totalRequests)) * 100).toFixed(2) : 
      '0.00';

    return {
      overview: {
        totalUsers,
        activeUsers,
        totalSessions,
        avgResponseTime,
        errorRate
      },
      timeframe
    };
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    return {
      overview: {
        totalUsers: 0,
        activeUsers: 0,
        totalSessions: 0,
        avgResponseTime: 0,
        errorRate: '0.00'
      },
      timeframe
    };
  }
}

// Real-time performance monitoring
export function getSystemHealth() {
  return {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid,
    version: process.version,
    timestamp: new Date().toISOString()
  };
}