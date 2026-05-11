import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { authorizedRequest, getApiUrl } from '../services/backend';
import { ONBOARDING_KEY, resolveAuthRoute } from '../utils/auth-routing';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (name: string, avatarUrl?: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      await AsyncStorage.getItem(ONBOARDING_KEY);
      const { data: { session } } = await supabase.auth.getSession();
      resolveAuthRoute(session, session?.user ?? null);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      AsyncStorage.getItem(ONBOARDING_KEY).then(() => {
        if (event !== 'PASSWORD_RECOVERY' && event !== 'USER_UPDATED') {
          resolveAuthRoute(session, session?.user ?? null);
        }
      });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Test confirmation links in a development build or standalone app. Expo Go does not reliably own custom app schemes.
        emailRedirectTo: Linking.createURL('/setup/name'),
      },
    });
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Linking.createURL('/reset-password'),
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateProfile = async (name: string, avatarUrl?: string) => {
    const { error } = await supabase.auth.updateUser({
      data: { name, ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}) },
    });
    if (error) throw error;

    if (!getApiUrl()) return;

    const accessToken =
      session?.access_token ?? (await supabase.auth.getSession()).data.session?.access_token;

    if (!accessToken) return;

    try {
      await authorizedRequest(
        '/api/users/me',
        {
          method: 'PATCH',
          body: JSON.stringify({
            name,
            ...(avatarUrl !== undefined ? { preferences: { avatarUrl } } : {}),
          }),
        },
        accessToken,
      );
    } catch (err) {
      console.warn('[users] backend profile sync failed', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, resetPassword, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
