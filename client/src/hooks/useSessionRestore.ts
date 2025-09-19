import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

interface SessionRestoreData {
  lastSessionId: string | null;
  sessionCount: number;
  lastActivity: string | null;
  shouldRestoreSession: boolean;
}

export function useSessionRestore() {
  const { user, isAuthenticated } = useAuth();
  const [hasAttemptedRestore, setHasAttemptedRestore] = useState(false);

  // Query to get user's chat sessions for restoration
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['/api/chat/sessions'],
    enabled: !!isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Query to check if user has recent business plan progress
  const { data: currentBusinessPlan } = useQuery({
    queryKey: ['/api/business-plans/current'],
    enabled: !!isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  const sessionRestoreData: SessionRestoreData = {
    lastSessionId: sessions && sessions.length > 0 ? sessions[0].id : null,
    sessionCount: sessions ? sessions.length : 0,
    lastActivity: sessions && sessions.length > 0 ? sessions[0].updatedAt : null,
    shouldRestoreSession: !!(sessions && sessions.length > 0 && !hasAttemptedRestore),
  };

  const markRestoreAttempted = () => {
    setHasAttemptedRestore(true);
    // Store in localStorage to prevent repeated restore attempts
    if (user?.id) {
      localStorage.setItem(`restore_attempted_${user.id}`, Date.now().toString());
    }
  };

  // Check if we've already attempted restore for this user session
  useEffect(() => {
    if (user?.id) {
      const lastAttempt = localStorage.getItem(`restore_attempted_${user.id}`);
      const oneHourAgo = Date.now() - (1000 * 60 * 60); // 1 hour
      
      if (lastAttempt && parseInt(lastAttempt) > oneHourAgo) {
        setHasAttemptedRestore(true);
      }
    }
  }, [user?.id]);

  return {
    ...sessionRestoreData,
    isLoadingSessions,
    currentBusinessPlan,
    markRestoreAttempted,
    hasRecentActivity: !!(sessions && sessions.length > 0 && sessions[0].updatedAt),
  };
}

export default useSessionRestore;