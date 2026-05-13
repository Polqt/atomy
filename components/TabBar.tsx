import { Pressable, StyleSheet, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { APP_TABS } from '@/constants/tabs';

type TabIconName = (typeof APP_TABS)[number]['icon'];

const ACTIVE = '#1A1A1A';
const INACTIVE = '#C7C7CC';

function HomeIcon({ color }: { color: string }) {
  return (
    <View style={styles.iconCanvas}>
      <View style={[styles.homeRoof, { borderColor: color }]} />
      <View style={[styles.homeBase, { borderColor: color }]} />
    </View>
  );
}

function HistoryIcon({ color }: { color: string }) {
  return (
    <View style={[styles.documentIcon, { borderColor: color }]}>
      <View style={[styles.docLine, { backgroundColor: color, width: 11 }]} />
      <View style={[styles.docLine, { backgroundColor: color, width: 14 }]} />
      <View style={[styles.docLine, { backgroundColor: color, width: 9 }]} />
    </View>
  );
}

function InsightsIcon({ color }: { color: string }) {
  return (
    <View style={styles.chartIcon}>
      <View style={[styles.chartBar, { height: 11, backgroundColor: color }]} />
      <View style={[styles.chartBar, { height: 18, backgroundColor: color }]} />
      <View style={[styles.chartBar, { height: 24, backgroundColor: color }]} />
    </View>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <View style={styles.profileIcon}>
      <View style={[styles.profileHead, { borderColor: color }]} />
      <View style={[styles.profileBody, { borderColor: color }]} />
    </View>
  );
}

function PlusIcon() {
  return (
    <View style={styles.plusButton}>
      <View style={styles.plusVertical} />
      <View style={styles.plusHorizontal} />
    </View>
  );
}

function TabIcon({ name, active }: { name: TabIconName; active: boolean }) {
  if (name === 'plus') return <PlusIcon />;
  const color = active ? ACTIVE : INACTIVE;
  if (name === 'home') return <HomeIcon color={color} />;
  if (name === 'history') return <HistoryIcon color={color} />;
  if (name === 'insights') return <InsightsIcon color={color} />;
  return <ProfileIcon color={color} />;
}

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/' || pathname === '/index';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function TabBar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.bar}>
        {APP_TABS.map((tab) => {
          const active = tab.icon !== 'plus' && isActive(pathname, tab.href);
          return (
            <Pressable key={tab.href} style={styles.tab} onPress={() => router.push(tab.href)}>
              <TabIcon name={tab.icon} active={active} />
              {active ? <View style={styles.activeIndicator} /> : <View style={styles.inactiveSpacer} />}
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  bar: {
    height: 72,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 18,
  },
  tab: {
    flex: 1,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  iconCanvas: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeRoof: {
    position: 'absolute',
    top: 5,
    width: 16,
    height: 16,
    borderTopWidth: 2.4,
    borderLeftWidth: 2.4,
    borderTopLeftRadius: 3,
    transform: [{ rotate: '45deg' }],
  },
  homeBase: {
    position: 'absolute',
    bottom: 4,
    width: 18,
    height: 14,
    borderWidth: 2.4,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  documentIcon: {
    width: 25,
    height: 27,
    borderWidth: 2.4,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  docLine: {
    height: 2,
    borderRadius: 1,
  },
  chartIcon: {
    width: 27,
    height: 27,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  chartBar: {
    width: 4,
    borderRadius: 2,
  },
  profileIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
  },
  profileHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2.4,
    marginTop: 3,
  },
  profileBody: {
    width: 20,
    height: 11,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 2.4,
    borderBottomWidth: 0,
    marginTop: 3,
  },
  plusButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
  plusVertical: {
    width: 3,
    height: 24,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
  },
  plusHorizontal: {
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
  },
  activeIndicator: {
    width: 4,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
  },
  inactiveSpacer: {
    width: 4,
    height: 2,
  },
});
