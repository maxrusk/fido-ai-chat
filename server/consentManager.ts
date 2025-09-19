import { storage } from "./storage";
import type { Request, Response, NextFunction } from "express";

export interface ConsentData {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  dataProcessingConsent: boolean;
  aiTrainingConsent: boolean;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export class ConsentManager {
  async checkUserConsent(userId: string): Promise<boolean> {
    try {
      const consentStatus = await storage.getUserConsentStatus(userId);
      return consentStatus === 'accepted';
    } catch (error) {
      console.error('Error checking user consent:', error);
      return false;
    }
  }

  async recordConsent(userId: string, consentData: ConsentData, req?: any): Promise<void> {
    try {
      // Record consent in database
      await storage.recordUserConsent(userId, {
        ...consentData,
        ipAddress: req?.ip || req?.connection?.remoteAddress,
        userAgent: req?.get('User-Agent')
      });

      // Update user consent status
      await storage.updateUserConsentStatus(userId, 'accepted');
    } catch (error) {
      console.error('Error recording consent:', error);
      throw error;
    }
  }

  async requiresConsent(req: any, res: any, next: any) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return next();
    }

    const userId = req.user?.claims?.sub;
    if (!userId) {
      return next();
    }

    const hasConsent = await this.checkUserConsent(userId);
    if (!hasConsent) {
      return res.status(403).json({ 
        message: "Consent required",
        consentRequired: true,
        redirectTo: "/consent"
      });
    }

    next();
  }
}

export const consentManager = new ConsentManager();