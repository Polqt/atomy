import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { authorizedRequest, getApiUrl } from '../services/backend';
import { getNotificationsEnabled, registerForPushNotifications, syncPushTokenWithBackend } from '../services/notifications';
import { queryKeys } from './queryKeys';

export function useUserSync() {
  const { session } = useAuth();
  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    const userId = session?.user.id ?? null;

    if (!session || !userId || !getApiUrl()) {
      if (!session) {
        syncedUserId.current = null;
      }
      return;
    }

    if (syncedUserId.current === userId) return;
    syncedUserId.current = userId;

    (async () => {
      try {
        await authorizedRequest('/api/users/me', { method: 'GET' }, session.access_token);
      } catch (err) {
        console.warn('[users] backend profile sync failed', err);
      }
    })();
  }, [session?.user.id, session?.access_token]);
}

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

export function useAuthQuerySync() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!session) {
      queryClient.removeQueries({ queryKey: queryKeys.habits });
      return;
    }

    queryClient.invalidateQueries({ queryKey: queryKeys.habits });
  }, [queryClient, session?.user.id, session?.access_token]);
}
