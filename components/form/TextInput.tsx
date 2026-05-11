/**
 * Reusable TextInput Component
 */
import { View, Text, TextInput as RNTextInput, StyleSheet } from 'react-native';
import colors from '../../constants/colors';

type TextInputProps = {
  label?: string;
  error?: string;
} & React.ComponentProps<typeof RNTextInput>;

export function TextInput({ label, error, style, multiline, ...props }: TextInputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        style={[
          styles.input,
          error && styles.inputError,
          multiline && styles.multiline,
          style,
        ]}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '400',
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.danger,
  },
  multiline: {
    minHeight: 90,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: 12,
    color: colors.danger,
  },
});