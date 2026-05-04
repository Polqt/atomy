import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const GREEN = '#22C55E';
const MUTED = '#9CA3AF';
const BORDER = '#F3F4F6';

const TABS = [
  { label: 'Today', href: '/', icon: '◎' },
  { label: 'History', href: '/history', icon: '≡' },
  { label: 'Insights', href: '/insights', icon: '✦' },
] as const;

export default function TabBar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const active = pathname === tab.href || (tab.href === '/' && pathname === '/index');
        return (
          <Pressable
            key={tab.href}
            style={styles.tab}
            onPress={() => router.push(tab.href)}
          >
            <Text style={[styles.icon, active && styles.iconActive]}>{tab.icon}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
            {active && <View style={styles.activePill} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingBottom: 28,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingTop: 4,
  },
  icon: {
    fontSize: 16,
    color: MUTED,
  },
  iconActive: {
    color: GREEN,
  },
  label: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: GREEN,
  },
  activePill: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: GREEN,
    marginTop: 1,
  },
});
