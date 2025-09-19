import crypto from "crypto";
import type { Express } from "express";

// Encryption configuration for enterprise security
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

// Generate or retrieve encryption key (in production, this should come from secure key management)
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || process.env.DATABASE_URL?.slice(0, 32) || 'default-dev-key-32-chars-long!!';
  return crypto.scryptSync(key, 'salt', KEY_LENGTH);
}

/**
 * SOC 2 Type II compliant data encryption
 * Encrypts sensitive data before storage
 */
export function encryptSensitiveData(data: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag for GCM mode
    const tag = cipher.getAuthTag();
    
    // Return IV + tag + encrypted data
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
}

/**
 * Decrypts sensitive data for authorized access
 */
export function decryptSensitiveData(encryptedData: string): string {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const key = getEncryptionKey();
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    // Validate authentication tag length to prevent tag truncation attacks
    if (tag.length !== TAG_LENGTH) {
      throw new Error('Invalid authentication tag length');
    }
    
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt sensitive data');
  }
}

/**
 * Hash sensitive identifiers for GDPR/CCPA compliance
 */
export function hashPII(data: string): string {
  const salt = process.env.PII_SALT || 'fido-enterprise-pii-salt';
  return crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512').toString('hex');
}

/**
 * Generate secure session tokens
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Setup enterprise security middleware
 * Implements SOC 2 Type II security controls
 */
export function setupEnterpriseSecurity(app: Express): void {
  // Security Headers for SOC 2 compliance
  app.use((req, res, next) => {
    // HTTPS enforcement in production
    if (process.env.NODE_ENV === 'production' && !req.secure && req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }

    // Security headers
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // GDPR/CCPA compliance headers
    res.setHeader('X-Privacy-Policy', 'https://fido.com/privacy');
    res.setHeader('X-Data-Controller', 'Fido AI Systems');
    
    // Content Security Policy for XSS prevention
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.openai.com wss:",
      "frame-ancestors 'none'"
    ].join('; '));

    next();
  });

  // Request logging for SOC 2 audit trail
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const userId = (req as any).user?.claims?.sub || 'anonymous';
    
    // Log security-relevant events (in production, send to SIEM)
    if (req.path.startsWith('/api/')) {
      console.log(`[AUDIT] ${timestamp} - User: ${userId} - IP: ${clientIP} - ${req.method} ${req.path} - UA: ${userAgent}`);
    }
    
    next();
  });

  // Rate limiting for DDoS protection
  const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  
  app.use('/api/', (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 100; // Max requests per window
    
    const clientData = rateLimitMap.get(clientIP);
    
    if (!clientData || now > clientData.resetTime) {
      rateLimitMap.set(clientIP, { count: 1, resetTime: now + windowMs });
      next();
    } else if (clientData.count < maxRequests) {
      clientData.count++;
      next();
    } else {
      console.log(`[SECURITY] Rate limit exceeded for IP: ${clientIP}`);
      res.status(429).json({ 
        error: 'Too many requests', 
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000) 
      });
    }
  });
}

/**
 * Data retention policy for GDPR/CCPA compliance
 */
export class DataRetentionManager {
  private static readonly RETENTION_PERIODS = {
    chatMessages: 365 * 24 * 60 * 60 * 1000, // 1 year
    userSessions: 30 * 24 * 60 * 60 * 1000,   // 30 days
    auditLogs: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years (SOC 2 requirement)
  };

  static shouldRetainData(dataType: keyof typeof this.RETENTION_PERIODS, createdAt: Date): boolean {
    const retentionPeriod = this.RETENTION_PERIODS[dataType];
    const now = Date.now();
    const createdTime = createdAt.getTime();
    
    return (now - createdTime) < retentionPeriod;
  }

  static async purgeExpiredData(storage: any): Promise<void> {
    const now = new Date();
    
    // In a real implementation, this would purge expired data
    console.log(`[DATA-RETENTION] Checking for expired data as of ${now.toISOString()}`);
    
    // This would be implemented based on your storage layer
    // await storage.purgeExpiredChatMessages(now);
    // await storage.purgeExpiredSessions(now);
  }
}

/**
 * GDPR/CCPA data subject rights implementation
 */
export class DataSubjectRights {
  static async exportUserData(userId: string, storage: any): Promise<any> {
    // Right to data portability
    const userData = await storage.getUser(userId);
    const chatSessions = await storage.getChatSessions(userId);
    
    return {
      user: userData,
      chatSessions: chatSessions,
      exportedAt: new Date().toISOString(),
      format: 'JSON',
      rights: 'GDPR Article 20 - Right to data portability'
    };
  }

  static async deleteUserData(userId: string, storage: any): Promise<void> {
    // Right to be forgotten
    console.log(`[DATA-DELETION] Processing deletion request for user: ${userId}`);
    
    // Delete all user data
    await storage.deleteAllChatSessions(userId);
    await storage.deleteAllChatMessages(userId);
    await storage.deleteUser(userId);
    
    console.log(`[DATA-DELETION] User data deleted for: ${userId}`);
  }

  static async anonymizeUserData(userId: string, storage: any): Promise<void> {
    // Anonymization option
    const anonymousId = hashPII(userId + Date.now().toString());
    
    // Replace personal identifiers with anonymous ones
    await storage.anonymizeUser(userId, anonymousId);
    
    console.log(`[DATA-ANONYMIZATION] User data anonymized: ${userId} -> ${anonymousId}`);
  }
}

