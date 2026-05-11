import { Redirect, Stack, usePathname } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import colors from '../../constants/colors';
import { hasProfileName } from '../../utils/auth-routing';

export default function SetupLayout() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;
  if (!hasProfileName(user)) {
    if (pathname === '/setup/name') {
      return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
    }
    return <Redirect href="/setup/name" />;
  }
  if (pathname === '/setup/name') return <Redirect href="/setup/photo" />;
  if (pathname === '/setup/photo' || pathname === '/setup/done') {
    return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
  }
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
