import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { Stack, router } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { useAuthQuerySync, useUserSync, usePushTokenSync } from '../hooks/useSessionSync';
import { useOnboardingGate } from '../hooks/useOnboardingGate';
import { API } from '../constants/api';
import SplashScreen from '../components/SplashScreen';
import { supabase } from '../config/supabase';
import { ONBOARDING_KEY, getAuthParams, resolveAuthRoute } from '../utils/auth-routing';

function SessionSync() {
  useUserSync();
  usePushTokenSync();
  useAuthQuerySync();
  return null;
}

function OnboardingGate() {
  useOnboardingGate();
  return null;
}

function DeepLinkHandler() {
  // Deep link testing requires a development build and will not work correctly in Expo Go.
  const handledUrls = useRef(new Set<string>());

  const routeResolvedSession = async (url: string | null) => {
    if (!url || handledUrls.current.has(url)) return;
    handledUrls.current.add(url);

    const params = getAuthParams(url);
    const accessToken = params.access_token;
    const refreshToken = params.refresh_token;
    const code = params.code;
    const isRecovery = params.type === 'recovery';

    if (!accessToken || !refreshToken) {
      if (!code) return;
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      if (isRecovery) {
        router.replace('/(auth)/reset-password');
        return;
      }
      await AsyncStorage.getItem(ONBOARDING_KEY);
      router.replace(resolveAuthRoute(data.session, data.session?.user ?? null));
      return;
    }

    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) throw error;

    if (isRecovery) {
      router.replace('/(auth)/reset-password');
      return;
    }

    await AsyncStorage.getItem(ONBOARDING_KEY);
    router.replace(resolveAuthRoute(data.session, data.session?.user ?? null));
  };

  const handleUrl = async (url: string | null) => {
    try {
      await routeResolvedSession(url);
    } catch {
      await supabase.auth.signOut();
      router.replace({
        pathname: '/(auth)/login',
        params: { error: 'confirmation_link_invalid' },
      });
    }
  };

  useEffect(() => {
    Linking.getInitialURL().then(handleUrl);

    const linkSubscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        Linking.getInitialURL().then(handleUrl);
      }
    });

    return () => {
      linkSubscription.remove();
      appStateSubscription.remove();
    };
  }, []);

  return null;
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: API.RETRY_COUNT,
            staleTime: API.STALE_TIME_MS,
          },
        },
      }),
    []
  );

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <SessionSync />
          <DeepLinkHandler />
          <OnboardingGate />
          <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="setup" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="profile-habits" />
            <Stack.Screen name="edit-habit" />
            <Stack.Screen name="habit/[id]" />
            <Stack.Screen name="add-habit" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
