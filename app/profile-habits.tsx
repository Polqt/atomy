import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHabits } from '../hooks/useHabits';
import colors from '../constants/colors';

export default function ProfileHabitsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: habits = [] } = useHabits();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.title}>Your habits</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.count}>{habits.length} total tracked</Text>

        <View style={styles.card}>
          {habits.length === 0 ? (
            <Text style={styles.emptyText}>No habits yet.</Text>
          ) : (
            habits.map((habit, index) => (
              <Pressable
                key={habit.id}
                onPress={() => router.push(`/habit/${habit.id}`)}
                style={styles.row}
              >
                <View style={styles.statusCircle}>
                  <Text style={styles.statusText}>✓</Text>
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.habitName} numberOfLines={2}>
                    {habit.habit}
                  </Text>
                  <Text style={styles.habitGoal} numberOfLines={1}>
                    {habit.goal}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
                {index !== habits.length - 1 ? <View style={styles.divider} /> : null}
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  backText: {
    fontSize: 30,
    lineHeight: 32,
    color: colors.text,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  count: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
  card: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    minHeight: 78,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(52,199,89,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  rowCopy: {
    flex: 1,
  },
  habitName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: colors.text,
  },
  habitGoal: {
    marginTop: 4,
    fontSize: 12,
    color: colors.muted,
  },
  chevron: {
    fontSize: 28,
    color: colors.muted,
  },
  divider: {
    position: 'absolute',
    left: 68,
    right: 16,
    bottom: 0,
    height: 1,
    backgroundColor: colors.divider,
  },
  emptyText: {
    padding: 24,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
});
