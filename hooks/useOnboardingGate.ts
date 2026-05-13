import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { ONBOARDING_KEY, resolveAuthRoute } from '../utils/auth-routing';

export function useOnboardingGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { session, user, loading: authLoading } = useAuth();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).finally(() => {
      setOnboardingChecked(true);
    });
  }, []);

  const ready = !authLoading && onboardingChecked;

  const nextRoute = useMemo(() => {
    if (!ready) return null;

    const isAuthRoute =
      pathname.startsWith('/(auth)') ||
      pathname === '/login' ||
      pathname === '/signup' ||
      pathname === '/forgot-password' ||
      pathname === '/reset-password';
    const isNameRoute = pathname === '/setup/name';
    const isSetupRoute = pathname.startsWith('/setup/');
    const isResetPasswordRoute = pathname === '/reset-password';
    const profile = user ?? session?.user ?? null;
    const resolvedRoute = resolveAuthRoute(session, profile);

    if (resolvedRoute === '/(auth)/login') {
      return isAuthRoute ? null : '/(auth)/login';
    }

    if (resolvedRoute === '/setup/name') {
      if (isResetPasswordRoute || isNameRoute) return null;
      return '/setup/name';
    }

    if (
      (isAuthRoute && !isResetPasswordRoute) ||
      isNameRoute ||
      (isSetupRoute && pathname !== '/setup/photo' && pathname !== '/setup/done')
    ) {
      return '/(tabs)';
    }

    return null;
  }, [onboardingChecked, authLoading, pathname, ready, router, session, user]);

  useEffect(() => {
    if (nextRoute) {
      router.replace(nextRoute as any);
    }
  }, [nextRoute, router]);

  return { ready, shouldRedirect: Boolean(nextRoute) };
}
