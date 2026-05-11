import { Session, User } from '@supabase/supabase-js';

export const ONBOARDING_KEY = 'onboarding_complete';

export type AuthRoute = '/(auth)/login' | '/setup/name' | '/(tabs)';

export function hasProfileName(user: User | null | undefined) {
  return Boolean(String(user?.user_metadata?.name ?? '').trim());
}

export function resolveAuthRoute(session: Session | null, profile: User | null | undefined): AuthRoute {
  if (!session) return '/(auth)/login';
  if (!hasProfileName(profile ?? session.user)) return '/setup/name';
  return '/(tabs)';
}

export function getAuthParams(url: string) {
  const params: Record<string, string> = {};
  const fragments = url.split(/[?#]/).slice(1);

  fragments.forEach((fragment) => {
    fragment.split('&').forEach((pair) => {
      const [rawKey, rawValue] = pair.split('=');
      if (!rawKey || rawValue === undefined) return;
      params[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue);
    });
  });

  return params;
}
