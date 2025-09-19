import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { MessageSquare, Eye, Users, UserPlus, Share2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface CollaborationUser {
  userId: string;
  userName: string;
  profileImage: string;
}

interface CollaborationMarker {
  id: string;
  user: CollaborationUser;
  sectionId: string;
  markerType: 'viewing' | 'commenting' | 'editing';
  position?: any;
  content?: string;
  createdAt: string;
}

interface CollaborationMarkersProps {
  analysisId: string;
  onCreateSession?: () => void;
  onInviteUser?: () => void;
}

export function CollaborationMarkers({ analysisId, onCreateSession, onInviteUser }: CollaborationMarkersProps) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<CollaborationUser[]>([]);
  const [markers, setMarkers] = useState<CollaborationMarker[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (sessionId && user) {
      connectToCollaboration();
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [sessionId, user]);

  const connectToCollaboration = () => {
    if (!sessionId || !user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/collaboration`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[COLLABORATION] Connected to WebSocket');
      setIsConnected(true);
      
      // Join the collaboration session
      ws.send(JSON.stringify({
        type: 'join',
        sessionId,
        user: {
          userId: user.id,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Anonymous',
          profileImage: user.profileImageUrl || ''
        }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleCollaborationMessage(message);
      } catch (error) {
        console.error('[COLLABORATION] Error parsing message:', error);
      }
    };

    ws.onclose = () => {
      console.log('[COLLABORATION] Disconnected from WebSocket');
      setIsConnected(false);
      setActiveUsers([]);
      setMarkers([]);
    };

    ws.onerror = (error) => {
      console.error('[COLLABORATION] WebSocket error:', error);
      setIsConnected(false);
    };
  };

  const handleCollaborationMessage = (message: any) => {
    switch (message.type) {
      case 'user_joined':
        setActiveUsers(message.activeUsers || []);
        break;

      case 'user_left':
        setActiveUsers(message.activeUsers || []);
        break;

      case 'session_state':
        setMarkers(message.markers || []);
        setActiveUsers(message.activeUsers || []);
        break;

      case 'marker_added':
        setMarkers(prev => [...prev, message.marker]);
        break;

      case 'marker_removed':
        setMarkers(prev => prev.filter(m => m.id !== message.markerId));
        break;

      case 'comment_added':
        setMarkers(prev => [...prev, {
          id: message.comment.id,
          user: message.comment.user,
          sectionId: message.comment.sectionId,
          markerType: 'commenting',
          content: message.comment.content,
          position: message.comment.position,
          createdAt: message.comment.createdAt
        }]);
        break;

      case 'section_viewed':
        // Update viewing markers (temporary, will be cleaned up automatically)
        const viewingMarker = {
          id: `viewing-${message.user.userId}-${Date.now()}`,
          user: message.user,
          sectionId: message.sectionId,
          markerType: 'viewing' as const,
          createdAt: new Date().toISOString()
        };
        setMarkers(prev => [...prev.filter(m => !(m.markerType === 'viewing' && m.user.userId === message.user.userId && m.sectionId === message.sectionId)), viewingMarker]);
        
        // Remove viewing marker after 3 seconds
        setTimeout(() => {
          setMarkers(prev => prev.filter(m => m.id !== viewingMarker.id));
        }, 3000);
        break;

      case 'error':
        console.error('[COLLABORATION] Server error:', message.message);
        break;
    }
  };

  const createCollaborationSession = async () => {
    try {
      const response = await fetch('/api/collaboration/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisId,
          sessionName: `Analysis Collaboration - ${new Date().toLocaleDateString()}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        onCreateSession?.();
      } else {
        console.error('Failed to create collaboration session');
      }
    } catch (error) {
      console.error('Error creating collaboration session:', error);
    }
  };

  const addSectionMarker = (sectionId: string, markerType: 'viewing' | 'commenting') => {
    if (!wsRef.current || !user || wsRef.current.readyState !== WebSocket.OPEN) return;

    if (markerType === 'viewing') {
      wsRef.current.send(JSON.stringify({
        type: 'section_view',
        sessionId,
        user: {
          userId: user.id,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Anonymous',
          profileImage: user.profileImageUrl || ''
        },
        data: { sectionId }
      }));
    }
  };

  const getMarkersForSection = (sectionId: string) => {
    return markers.filter(marker => marker.sectionId === sectionId);
  };

  const getUsersViewingSection = (sectionId: string) => {
    return markers
      .filter(marker => marker.sectionId === sectionId && marker.markerType === 'viewing')
      .map(marker => marker.user);
  };

  // Public API for other components
  const collaborationAPI = {
    addSectionMarker,
    getMarkersForSection,
    getUsersViewingSection,
    isConnected,
    activeUsers,
    sessionId
  };

  // Attach API to window for other components to use
  useEffect(() => {
    (window as any).collaborationAPI = collaborationAPI;
    return () => {
      delete (window as any).collaborationAPI;
    };
  }, [collaborationAPI]);

  if (!sessionId) {
    return (
      <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border">
        <Share2 className="w-4 h-4 text-blue-600" />
        <span className="text-sm text-blue-700 dark:text-blue-300">
          Enable real-time collaboration
        </span>
        <Button
          onClick={createCollaborationSession}
          size="sm"
          variant="outline"
          className="ml-auto"
        >
          <Users className="w-4 h-4 mr-1" />
          Start Collaboration
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-2">
      {/* Connection Status */}
      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded-lg border">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-green-700 dark:text-green-300">
            {isConnected ? 'Collaboration Active' : 'Disconnected'}
          </span>
        </div>
        
        {/* Active Users */}
        <div className="flex items-center gap-1">
          {activeUsers.slice(0, 3).map(user => (
            <Tooltip key={user.userId}>
              <TooltipTrigger>
                <Avatar className="w-6 h-6 border-2 border-white">
                  <AvatarImage src={user.profileImage} alt={user.userName} />
                  <AvatarFallback className="text-xs">
                    {user.userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{user.userName}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {activeUsers.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{activeUsers.length - 3}
            </Badge>
          )}
          
          {activeUsers.length === 0 && (
            <span className="text-xs text-muted-foreground">No active users</span>
          )}
        </div>

        <Button
          onClick={onInviteUser}
          size="sm"
          variant="ghost"
          className="ml-2"
        >
          <UserPlus className="w-4 h-4" />
        </Button>
      </div>

      {/* Recent Markers Summary */}
      {markers.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Recent Activity</h4>
          {markers.slice(-3).map(marker => (
            <div key={marker.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs">
              <Avatar className="w-4 h-4">
                <AvatarImage src={marker.user.profileImage} alt={marker.user.userName} />
                <AvatarFallback className="text-xs">
                  {marker.user.userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground">
                {marker.user.userName}
                {marker.markerType === 'viewing' && ' is viewing'}
                {marker.markerType === 'commenting' && ' commented on'}
                {marker.markerType === 'editing' && ' is editing'}
              </span>
              <Badge variant="outline" className="text-xs">
                {marker.sectionId.replace('_', ' ')}
              </Badge>
              {marker.markerType === 'commenting' && (
                <MessageSquare className="w-3 h-3 text-blue-500" />
              )}
              {marker.markerType === 'viewing' && (
                <Eye className="w-3 h-3 text-green-500" />
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </TooltipProvider>
  );
}

// Utility function for other components to trigger section viewing
export const triggerSectionView = (sectionId: string) => {
  const api = (window as any).collaborationAPI;
  if (api && api.isConnected) {
    api.addSectionMarker(sectionId, 'viewing');
  }
};

export default CollaborationMarkers;