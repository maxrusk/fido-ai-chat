import Redis from 'ioredis';

class RedisClient {
  private static instance: Redis | null = null;
  private static connected: boolean = false;

  static getInstance(): Redis | null {
    if (!RedisClient.instance) {
      try {
        // Try to connect to Redis (will use local Redis if available, or Redis Cloud)
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        
        RedisClient.instance = new Redis(redisUrl, {
          enableReadyCheck: true,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          connectTimeout: 5000,
          commandTimeout: 5000,
        });

        RedisClient.instance.on('connect', () => {
          console.log('[REDIS] Connected successfully');
          RedisClient.connected = true;
        });

        RedisClient.instance.on('error', (err) => {
          console.log('[REDIS] Connection failed, falling back to PostgreSQL only:', err.message);
          RedisClient.connected = false;
        });

      } catch (error) {
        console.log('[REDIS] Redis not available, using PostgreSQL only');
        RedisClient.instance = null;
        RedisClient.connected = false;
      }
    }
    return RedisClient.instance;
  }

  static isConnected(): boolean {
    return RedisClient.connected;
  }

  // Chat Memory Methods
  static async storeChatMemory(userId: string, sessionId: string, messages: any[]): Promise<void> {
    const redis = RedisClient.getInstance();
    if (!redis || !RedisClient.connected) return;

    try {
      const key = `chat:${userId}:${sessionId}`;
      await redis.setex(key, 3600 * 24, JSON.stringify(messages)); // 24 hour TTL
      
      // Also store recent session list for user
      const recentKey = `recent:${userId}`;
      await redis.lpush(recentKey, sessionId);
      await redis.ltrim(recentKey, 0, 9); // Keep only 10 most recent
      await redis.expire(recentKey, 3600 * 24 * 7); // 7 day TTL
    } catch (error) {
      console.log('[REDIS] Error storing chat memory:', error);
    }
  }

  static async getChatMemory(userId: string, sessionId: string): Promise<any[] | null> {
    const redis = RedisClient.getInstance();
    if (!redis || !RedisClient.connected) return null;

    try {
      const key = `chat:${userId}:${sessionId}`;
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.log('[REDIS] Error getting chat memory:', error);
      return null;
    }
  }

  static async getRecentSessions(userId: string): Promise<string[]> {
    const redis = RedisClient.getInstance();
    if (!redis || !RedisClient.connected) return [];

    try {
      const recentKey = `recent:${userId}`;
      return await redis.lrange(recentKey, 0, 9);
    } catch (error) {
      console.log('[REDIS] Error getting recent sessions:', error);
      return [];
    }
  }

  // User Session State
  static async storeUserState(userId: string, state: any): Promise<void> {
    const redis = RedisClient.getInstance();
    if (!redis || !RedisClient.connected) return;

    try {
      const key = `user:${userId}:state`;
      await redis.setex(key, 3600 * 24, JSON.stringify(state)); // 24 hour TTL
    } catch (error) {
      console.log('[REDIS] Error storing user state:', error);
    }
  }

  static async getUserState(userId: string): Promise<any | null> {
    const redis = RedisClient.getInstance();
    if (!redis || !RedisClient.connected) return null;

    try {
      const key = `user:${userId}:state`;
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.log('[REDIS] Error getting user state:', error);
      return null;
    }
  }
}

export default RedisClient;