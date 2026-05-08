import { View, StyleSheet } from 'react-native';
import colors from '@/constants/colors';
import { type DayCompletionSummary } from '@/utils/habit-stats';

export default function MiniBarGroup({ week }: { week: DayCompletionSummary[] }) {
  return (
    <View style={styles.row}>
      {week.map((day) => (
        <View
          key={day.dateKey}
          style={[
            styles.bar,
            day.completed === true ? styles.barDone : null,
            day.completed === false ? styles.barSkipped : null,
          ]}
        />
      ))}
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
    height: 16,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  barDone: {
    height: 26,
    backgroundColor: colors.primary,
  },
  barSkipped: {
    height: 12,
    backgroundColor: '#FCA5A5',
  },
});

