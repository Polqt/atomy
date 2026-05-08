import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function SetupLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.user_metadata?.name) return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
