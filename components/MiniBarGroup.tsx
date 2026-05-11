import { View, StyleSheet } from 'react-native';
import colors from '@/constants/colors';
import { type DayCompletionSummary } from '@/utils/habit-stats';

export default function MiniBarGroup({ week }: { week: DayCompletionSummary[] }) {
  const maxCompleted = Math.max(...week.map((day) => day.completedCount ?? (day.completed ? 1 : 0)), 0);

  return (
    <View style={styles.row}>
      {week.map((day) => {
        const completedCount = day.completedCount ?? (day.completed ? 1 : 0);
        const height = maxCompleted > 0 ? 8 + Math.round((completedCount / maxCompleted) * 22) : 8;

        return (
          <View
            key={day.dateKey}
            style={[
              styles.bar,
              {
                height,
                backgroundColor: completedCount > 0 ? colors.primary : '#E5E7EB',
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'flex-end',
    height: 30,
  },
  bar: {
    width: 5,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
});

