import { useEffect, useState } from 'react';
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

  if (authLoading || !onboardingChecked) {
    return { shouldRender: false, shouldRedirect: false };
  }

  const isAuthRoute =
    pathname.startsWith('/(auth)') ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password';
  const isNameRoute = pathname === '/setup/name';
  const isSetupRoute = pathname.startsWith('/setup/');
  const isResetPasswordRoute = pathname === '/reset-password';
  const isTabsRoute = pathname.startsWith('/(tabs)') || pathname === '/';
  const profile = user ?? session?.user ?? null;
  const resolvedRoute = resolveAuthRoute(session, profile);

  if (resolvedRoute === '/(auth)/login') {
    if (!isAuthRoute) {
      router.replace('/(auth)/login');
      return { shouldRender: false, shouldRedirect: true };
    }
    return { shouldRender: true, shouldRedirect: false };
  }

  if (resolvedRoute === '/setup/name') {
    if (isResetPasswordRoute) {
      return { shouldRender: true, shouldRedirect: false };
    }
    if (!isNameRoute) {
      router.replace('/setup/name');
      return { shouldRender: false, shouldRedirect: true };
    }
    return { shouldRender: true, shouldRedirect: false };
  }

  if (
    (isAuthRoute && !isResetPasswordRoute) ||
    isNameRoute ||
    (isSetupRoute && pathname !== '/setup/photo' && pathname !== '/setup/done')
  ) {
    router.replace('/(tabs)');
    return { shouldRender: false, shouldRedirect: true };
  }

  if (!isTabsRoute && !isSetupRoute) {
    return { shouldRender: true, shouldRedirect: false };
  }

  return { shouldRender: true, shouldRedirect: false };
}
