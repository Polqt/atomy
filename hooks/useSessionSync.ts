/**
 * Custom hooks for session-based sync operations
 */
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { authorizedRequest, getApiUrl } from '../services/backend';
import { getNotificationsEnabled, registerForPushNotifications, syncPushTokenWithBackend } from '../services/notifications';

/**
 * Hook to sync user profile with backend when session changes
 * Ensures the user row exists in the database before any habit operations
 */
export function useUserSync() {
  const { session } = useAuth();
  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    const userId = session?.user.id ?? null;

    // Don't sync if no session or API URL not configured
    if (!session || !userId || !getApiUrl()) {
      if (!session) {
        syncedUserId.current = null;
      }
      return;
    }

    // Skip if already synced this user
    if (syncedUserId.current === userId) return;
    syncedUserId.current = userId;

    // Sync user profile
    (async () => {
      try {
        await authorizedRequest('/api/users/me', { method: 'GET' }, session.access_token);
      } catch (err) {
        console.warn('[users] backend profile sync failed', err);
      }
    })();
  }, [session?.user.id, session?.access_token]);
}

/**
 * Hook to sync push notification token with backend
 */
export function usePushTokenSync() {
  const { session } = useAuth();
  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    const userId = session?.user.id ?? null;

    if (!session || !userId) {
      if (!session) {
        syncedUserId.current = null;
      }
      return;
    }

    if (syncedUserId.current === userId) return;
    syncedUserId.current = userId;

    (async () => {
      try {
        const enabled = await getNotificationsEnabled();
        if (!enabled) return;

        const token = await registerForPushNotifications();
        if (token) {
          await syncPushTokenWithBackend(token, session.access_token);
        }
      } catch (err) {
        console.warn('[notifications] push token sync failed', err);
      }
    })();
  }, [session?.user.id, session?.access_token]);
}