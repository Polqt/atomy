import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../context/AuthContext';
import {
  registerForPushNotifications,
  scheduleDailyHabitReminder,
  syncPushTokenWithBackend,
} from '../services/notifications';
import SplashScreen from '../components/SplashScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function PushTokenSync() {
  const { session } = useAuth();
  const synced = useRef(false);

  useEffect(() => {
    if (!session || synced.current) return;
    synced.current = true;

    (async () => {
      try {
        const token = await registerForPushNotifications();
        if (token) {
          await syncPushTokenWithBackend(token, session.access_token);
          await scheduleDailyHabitReminder();
        }
      } catch (err) {
        console.warn('[notifications] push token sync failed', err);
      }
    })();
  }, [session]);

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

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PushTokenSync />
        <OnboardingGate>
          <Stack screenOptions={{ headerShown: false }} />
        </OnboardingGate>
      </AuthProvider>
    </QueryClientProvider>
  );
}
