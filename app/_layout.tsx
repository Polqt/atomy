import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import {
  getNotificationsEnabled,
  registerForPushNotifications,
  syncPushTokenWithBackend,
} from '../services/notifications';
import { authorizedRequest, getApiUrl } from '../services/backend';
import SplashScreen from '../components/SplashScreen';

// Ensures the user row exists in public.users before any habit inserts
function UserSync() {
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

  return null;
}

function PushTokenSync() {
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

  return null;
}

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('onboarding_complete').then((value) => {
      if (!value) {
        router.replace('/onboarding');
      }
      setReady(true);
    });
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
          },
        },
      }),
  );

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <UserSync />
          <PushTokenSync />
          <OnboardingGate>
            <Stack screenOptions={{ headerShown: false }} />
          </OnboardingGate>
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
