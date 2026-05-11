import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { hasProfileName } from '../../utils/auth-routing';

export default function AppLayout() {
  const { session, user, loading } = useAuth();

  if (loading) return null;
  if (!session || !user) {
    return <Redirect href="/(auth)/login" />;
  }
  if (!hasProfileName(user)) return <Redirect href="/setup/name" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 200,
      }}
    />
  );
}
