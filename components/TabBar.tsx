import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { APP_TABS } from '@/constants/tabs';

const GREEN = colors.primary;
const MUTED = colors.muted;
type TabIconName = (typeof APP_TABS)[number]['icon'];

function TabIcon({ name, active }: { name: TabIconName; active: boolean }) {
  const stroke = active ? GREEN : MUTED;
  const fill = active ? GREEN : 'transparent';
  const accent = active ? colors.surface : stroke;

  if (name === 'home') {
    return (
      <View style={styles.iconBox}>
        <View style={[styles.homeRoof, { borderColor: stroke, backgroundColor: fill }]} />
        <View style={[styles.homeBody, { borderColor: stroke, backgroundColor: fill }]} />
      </View>
    );
  }

  if (name === 'calendar') {
    return (
      <View style={[styles.calendarIcon, { borderColor: stroke, backgroundColor: fill }]}>
        <View style={[styles.calendarTop, { backgroundColor: accent }]} />
      </View>
    );
  }

  if (name === 'history') {
    return (
      <View style={[styles.historyIcon, { borderColor: stroke, backgroundColor: fill }]}>
        <View style={[styles.historyLine, { backgroundColor: accent }]} />
        <View style={[styles.historyLine, { backgroundColor: accent }]} />
        <View style={[styles.historyLine, { backgroundColor: accent }]} />
      </View>
    );
  }

  return (
    <View style={[styles.sparkleIcon, { borderColor: stroke, backgroundColor: fill }]}>
      <View style={[styles.sparkleVertical, { backgroundColor: accent }]} />
      <View style={[styles.sparkleHorizontal, { backgroundColor: accent }]} />
    </View>
  );
}

export default function TabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: 12 + insets.bottom }]}>
      {APP_TABS.map((tab) => {
        const active = pathname === tab.href || (tab.href === '/' && pathname === '/index');
        return (
          <Pressable
            key={tab.href}
            style={styles.tab}
            onPress={() => router.push(tab.href)}
          >
            <TabIcon name={tab.icon} active={active} />
            {active ? <Text style={[styles.label, styles.labelActive]}>{tab.label}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingBottom: 12,
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
  iconBox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  homeRoof: {
    width: 13,
    height: 13,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderTopLeftRadius: 2,
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
    top: 3,
  },
  homeBody: {
    width: 15,
    height: 12,
    borderWidth: 2,
    borderTopWidth: 0,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    position: 'absolute',
    bottom: 3,
  },
  calendarIcon: {
    width: 19,
    height: 18,
    borderWidth: 2,
    borderRadius: 5,
    overflow: 'hidden',
  },
  calendarTop: {
    height: 4,
    width: '100%',
  },
  historyLine: {
    width: 12,
    height: 2,
    borderRadius: 1,
    marginVertical: 1.5,
  },
  historyIcon: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleVertical: {
    width: 2,
    height: 12,
    borderRadius: 1,
  },
  sparkleHorizontal: {
    width: 12,
    height: 2,
    borderRadius: 1,
    position: 'absolute',
  },
  sparkleIcon: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
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
});
