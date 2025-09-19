import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { db } from './db';
import { 
  collaborationSessions, 
  collaborationMarkers, 
  collaborationEvents,
  type CollaborationSession,
  type CollaborationMarker,
  type CollaborationEvent,
  type InsertCollaborationMarker,
  type InsertCollaborationEvent
} from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

interface WebSocketUser {
  userId: string;
  userName: string;
  profileImage: string;
}

interface CollaborationWebSocket extends WebSocket {
  userId?: string;
  userName?: string;
  profileImage?: string;
  sessionId?: string;
  analysisId?: string;
}

interface CollaborationMessage {
  type: 'join' | 'leave' | 'marker_update' | 'marker_remove' | 'comment' | 'cursor_move' | 'section_view';
  sessionId: string;
  user: WebSocketUser;
  data?: any;
}

export class CollaborationService {
  private wss: WebSocketServer;
  private activeSessions: Map<string, Set<CollaborationWebSocket>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws/collaboration',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    
    // Clean up inactive markers every 5 minutes
    setInterval(this.cleanupInactiveMarkers.bind(this), 5 * 60 * 1000);
  }

  private verifyClient(info: any): boolean {
    // In production, verify JWT token or session here
    return true;
  }

  private async handleConnection(ws: CollaborationWebSocket, request: any) {
    console.log('[COLLABORATION] New WebSocket connection established');

    ws.on('message', async (data) => {
      try {
        const message: CollaborationMessage = JSON.parse(data.toString());
        await this.handleMessage(ws, message);
      } catch (error) {
        console.error('[COLLABORATION] Error handling message:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    ws.on('error', (error) => {
      console.error('[COLLABORATION] WebSocket error:', error);
    });
  }

  private async handleMessage(ws: CollaborationWebSocket, message: CollaborationMessage) {
    const { type, sessionId, user, data } = message;

    switch (type) {
      case 'join':
        await this.handleJoinSession(ws, sessionId, user);
        break;

      case 'leave':
        await this.handleLeaveSession(ws, sessionId);
        break;

      case 'marker_update':
        await this.handleMarkerUpdate(ws, sessionId, user, data);
        break;

      case 'marker_remove':
        await this.handleMarkerRemove(ws, sessionId, data.markerId);
        break;

      case 'comment':
        await this.handleComment(ws, sessionId, user, data);
        break;

      case 'cursor_move':
        await this.handleCursorMove(ws, sessionId, user, data);
        break;

      case 'section_view':
        await this.handleSectionView(ws, sessionId, user, data);
        break;
    }
  }

  private async handleJoinSession(ws: CollaborationWebSocket, sessionId: string, user: WebSocketUser) {
    try {
      // Verify session exists and user has access
      const [session] = await db
        .select()
        .from(collaborationSessions)
        .where(eq(collaborationSessions.id, sessionId));

      if (!session) {
        ws.send(JSON.stringify({ type: 'error', message: 'Session not found' }));
        return;
      }

      // Check if user is authorized
      const isAuthorized = session.ownerId === user.userId || 
                          session.allowedUsers?.includes(user.userId) || 
                          !session.allowedUsers?.length;

      if (!isAuthorized) {
        ws.send(JSON.stringify({ type: 'error', message: 'Unauthorized access' }));
        return;
      }

      // Add user to session
      ws.userId = user.userId;
      ws.userName = user.userName;
      ws.profileImage = user.profileImage;
      ws.sessionId = sessionId;
      ws.analysisId = session.analysisId;

      if (!this.activeSessions.has(sessionId)) {
        this.activeSessions.set(sessionId, new Set());
      }
      this.activeSessions.get(sessionId)!.add(ws);

      // Log join event
      await db.insert(collaborationEvents).values({
        id: randomUUID(),
        sessionId,
        userId: user.userId,
        eventType: 'join',
        eventData: { userName: user.userName, joinedAt: new Date().toISOString() }
      });

      // Notify other users in session
      this.broadcastToSession(sessionId, {
        type: 'user_joined',
        user,
        activeUsers: this.getActiveUsers(sessionId)
      }, ws);

      // Send current markers to new user
      const markers = await this.getActiveMarkers(sessionId);
      ws.send(JSON.stringify({
        type: 'session_state',
        markers,
        activeUsers: this.getActiveUsers(sessionId)
      }));

      console.log(`[COLLABORATION] User ${user.userName} joined session ${sessionId}`);
    } catch (error) {
      console.error('[COLLABORATION] Error joining session:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Failed to join session' }));
    }
  }

  private async handleLeaveSession(ws: CollaborationWebSocket, sessionId: string) {
    if (!ws.userId) return;

    try {
      // Remove user's active markers
      await db.update(collaborationMarkers)
        .set({ isActive: false })
        .where(and(
          eq(collaborationMarkers.sessionId, sessionId),
          eq(collaborationMarkers.userId, ws.userId)
        ));

      // Log leave event
      await db.insert(collaborationEvents).values({
        id: randomUUID(),
        sessionId,
        userId: ws.userId,
        eventType: 'leave',
        eventData: { userName: ws.userName, leftAt: new Date().toISOString() }
      });

      // Remove from active sessions
      const sessionUsers = this.activeSessions.get(sessionId);
      if (sessionUsers) {
        sessionUsers.delete(ws);
        if (sessionUsers.size === 0) {
          this.activeSessions.delete(sessionId);
        }
      }

      // Notify other users
      this.broadcastToSession(sessionId, {
        type: 'user_left',
        user: { userId: ws.userId, userName: ws.userName },
        activeUsers: this.getActiveUsers(sessionId)
      });

      console.log(`[COLLABORATION] User ${ws.userName} left session ${sessionId}`);
    } catch (error) {
      console.error('[COLLABORATION] Error leaving session:', error);
    }
  }

  private async handleMarkerUpdate(ws: CollaborationWebSocket, sessionId: string, user: WebSocketUser, data: any) {
    try {
      const { sectionId, markerType, position, content } = data;
      
      const markerId = randomUUID();
      const marker: InsertCollaborationMarker = {
        id: markerId,
        sessionId,
        userId: user.userId,
        sectionId,
        markerType,
        position,
        content,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      };

      await db.insert(collaborationMarkers).values(marker);

      // Broadcast marker to all users in session
      this.broadcastToSession(sessionId, {
        type: 'marker_added',
        marker: { ...marker, user }
      });

      console.log(`[COLLABORATION] Marker added by ${user.userName} in section ${sectionId}`);
    } catch (error) {
      console.error('[COLLABORATION] Error updating marker:', error);
    }
  }

  private async handleMarkerRemove(ws: CollaborationWebSocket, sessionId: string, markerId: string) {
    try {
      await db.update(collaborationMarkers)
        .set({ isActive: false })
        .where(eq(collaborationMarkers.id, markerId));

      this.broadcastToSession(sessionId, {
        type: 'marker_removed',
        markerId
      });
    } catch (error) {
      console.error('[COLLABORATION] Error removing marker:', error);
    }
  }

  private async handleComment(ws: CollaborationWebSocket, sessionId: string, user: WebSocketUser, data: any) {
    try {
      const { sectionId, content, position } = data;
      
      const markerId = randomUUID();
      await db.insert(collaborationMarkers).values({
        id: markerId,
        sessionId,
        userId: user.userId,
        sectionId,
        markerType: 'commenting',
        position,
        content,
        isActive: true
      });

      // Log comment event
      await db.insert(collaborationEvents).values({
        id: randomUUID(),
        sessionId,
        userId: user.userId,
        eventType: 'comment',
        eventData: { sectionId, content, createdAt: new Date().toISOString() }
      });

      this.broadcastToSession(sessionId, {
        type: 'comment_added',
        comment: {
          id: markerId,
          user,
          sectionId,
          content,
          position,
          createdAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('[COLLABORATION] Error handling comment:', error);
    }
  }

  private async handleCursorMove(ws: CollaborationWebSocket, sessionId: string, user: WebSocketUser, data: any) {
    // Real-time cursor position updates (not stored in DB for performance)
    this.broadcastToSession(sessionId, {
      type: 'cursor_move',
      user,
      position: data.position,
      sectionId: data.sectionId
    }, ws);
  }

  private async handleSectionView(ws: CollaborationWebSocket, sessionId: string, user: WebSocketUser, data: any) {
    try {
      const { sectionId } = data;
      
      // Update or create viewing marker
      const markerId = randomUUID();
      await db.insert(collaborationMarkers).values({
        id: markerId,
        sessionId,
        userId: user.userId,
        sectionId,
        markerType: 'viewing',
        isActive: true,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      });

      this.broadcastToSession(sessionId, {
        type: 'section_viewed',
        user,
        sectionId
      }, ws);
    } catch (error) {
      console.error('[COLLABORATION] Error handling section view:', error);
    }
  }

  private handleDisconnection(ws: CollaborationWebSocket) {
    if (ws.sessionId && ws.userId) {
      this.handleLeaveSession(ws, ws.sessionId);
    }
  }

  private broadcastToSession(sessionId: string, message: any, excludeWs?: CollaborationWebSocket) {
    const sessionUsers = this.activeSessions.get(sessionId);
    if (!sessionUsers) return;

    const messageStr = JSON.stringify(message);
    sessionUsers.forEach(userWs => {
      if (userWs !== excludeWs && userWs.readyState === WebSocket.OPEN) {
        userWs.send(messageStr);
      }
    });
  }

  private getActiveUsers(sessionId: string): WebSocketUser[] {
    const sessionUsers = this.activeSessions.get(sessionId);
    if (!sessionUsers) return [];

    return Array.from(sessionUsers).map(ws => ({
      userId: ws.userId!,
      userName: ws.userName!,
      profileImage: ws.profileImage!
    }));
  }

  private async getActiveMarkers(sessionId: string): Promise<CollaborationMarker[]> {
    return await db
      .select()
      .from(collaborationMarkers)
      .where(and(
        eq(collaborationMarkers.sessionId, sessionId),
        eq(collaborationMarkers.isActive, true)
      ));
  }

  private async cleanupInactiveMarkers() {
    try {
      const expiredMarkers = await db.update(collaborationMarkers)
        .set({ isActive: false })
        .where(and(
          eq(collaborationMarkers.isActive, true),
          // SQL: expires_at < NOW()
        ));
      
      console.log('[COLLABORATION] Cleaned up expired markers');
    } catch (error) {
      console.error('[COLLABORATION] Error cleaning up markers:', error);
    }
  }

  // Public API methods for creating collaboration sessions
  async createCollaborationSession(analysisId: string, ownerId: string, sessionName: string): Promise<string> {
    const sessionId = randomUUID();
    
    await db.insert(collaborationSessions).values({
      id: sessionId,
      analysisId,
      ownerId,
      sessionName,
      isActive: true,
      allowedUsers: [] // Empty means anyone can join
    });

    return sessionId;
  }

  async inviteUserToSession(sessionId: string, userId: string): Promise<void> {
    const [session] = await db
      .select()
      .from(collaborationSessions)
      .where(eq(collaborationSessions.id, sessionId));

    if (!session) throw new Error('Session not found');

    const allowedUsers = session.allowedUsers || [];
    if (!allowedUsers.includes(userId)) {
      allowedUsers.push(userId);
      
      await db.update(collaborationSessions)
        .set({ allowedUsers })
        .where(eq(collaborationSessions.id, sessionId));
    }
  }

  getActiveSessionsCount(): number {
    return this.activeSessions.size;
  }

  getActiveUsersCount(): number {
    let count = 0;
    this.activeSessions.forEach(sessionUsers => {
      count += sessionUsers.size;
    });
    return count;
  }
}