import { View, Text, Pressable, StyleSheet, ScrollView, Switch, Image } from 'react-native';
import { useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import TabScreen from '@/components/TabScreen';
import { useAuth } from '../../context/AuthContext';
import { useHabits } from '../../hooks/useHabits';
import colors from '../../constants/colors';
import { getCompletionStats } from '@/utils/habit-stats';
import { getDisplayNameFromEmail, getInitial } from '@/utils/user';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { data: habits = [] } = useHabits();
  const [notifications, setNotifications] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const email = user?.email ?? '';
  const displayName = (user?.user_metadata?.name as string | undefined) || getDisplayNameFromEmail(email, 'User');
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initial = getInitial(displayName);
  const { completed: totalDone, total, rate } = getCompletionStats(habits);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <TabScreen statusBarColor={colors.background}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(440).delay(60)} style={styles.profileHeader}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
        </Animated.View>

        {/* Stats card */}
        <Animated.View entering={FadeInDown.duration(440).delay(140)} style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{rate}%</Text>
            <Text style={styles.statLabel}>Completion rate</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{totalDone}</Text>
            <Text style={styles.statLabel}>Habits done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{total}</Text>
            <Text style={styles.statLabel}>Total tracked</Text>
          </View>
        </Animated.View>

        {/* Settings */}
        <Animated.View entering={FadeInDown.duration(440).delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>🔔</Text>
                <View>
                  <Text style={styles.settingLabel}>Notifications</Text>
                  <Text style={styles.settingSub}>Daily habit reminders</Text>
                </View>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={notifications ? colors.primary : '#fff'}
              />
            </View>

            <View style={styles.settingDivider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>ℹ️</Text>
                <View>
                  <Text style={styles.settingLabel}>About</Text>
                  <Text style={styles.settingSub}>Version 1.0.0</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Sign out */}
        <Animated.View entering={FadeInDown.duration(440).delay(260)} style={styles.signOutSection}>
          <Pressable
            onPress={signingOut ? undefined : handleSignOut}
            style={[styles.signOutBtn, signingOut && { opacity: 0.5 }]}
          >
            <Text style={styles.signOutText}>{signingOut ? 'Signing out…' : 'Sign Out'}</Text>
          </Pressable>
        </Animated.View>

      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: { flex: 1 },
  content: {
    paddingTop: 64,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 28,
    gap: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.muted,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statNum: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.muted,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  section: {
    marginBottom: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIcon: {
    fontSize: 18,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  settingSub: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.muted,
  },
  settingDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 18,
  },
  signOutSection: {
    marginTop: 8,
  },
  signOutBtn: {
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerBg,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.danger,
  },
});
