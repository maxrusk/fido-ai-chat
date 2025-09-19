import type { Express } from "express";
import { getAnalyticsDashboard, getSystemHealth } from "../middleware/analytics";
import { isAdmin } from "../replitAuth";

export function registerAnalyticsRoutes(app: Express) {
  // Analytics dashboard endpoint (admin only)
  app.get("/api/analytics/dashboard", isAdmin, async (req, res) => {
    try {
      const timeframe = (req.query.timeframe as '24h' | '7d' | '30d') || '7d';
      const dashboard = await getAnalyticsDashboard(timeframe);
      res.json(dashboard);
    } catch (error) {
      console.error("Analytics dashboard error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // System health endpoint (admin only)
  app.get("/api/analytics/health", isAdmin, (req, res) => {
    const health = getSystemHealth();
    res.json(health);
  });

  // Simple user metrics endpoint (public stats)
  app.get("/api/analytics/public-stats", async (req, res) => {
    try {
      const dashboard = await getAnalyticsDashboard('30d');
      
      // Return only public-safe metrics
      res.json({
        totalUsers: dashboard.overview.totalUsers,
        totalSessions: dashboard.overview.totalSessions,
        avgResponseTime: dashboard.overview.avgResponseTime,
        uptime: getSystemHealth().uptime
      });
    } catch (error) {
      console.error("Public stats error:", error);
      res.status(500).json({ error: "Failed to fetch public stats" });
    }
  });
}