import { Redirect, Stack, usePathname } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import colors from '../../constants/colors';
import { hasProfileName } from '../../utils/auth-routing';

export default function AuthLayout() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (user) {
    if (pathname === '/reset-password') {
      return <Stack screenOptions={{ headerShown: false }} />;
    }
    if (!hasProfileName(user)) {
      return <Redirect href="/setup/name" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
