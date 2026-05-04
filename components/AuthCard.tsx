import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TextInputProps,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeInDown,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const GREEN = '#22C55E';
const GREEN_PALE = '#F0FDF4';
const GREEN_LIGHT = '#DCFCE7';
const INK = '#0A0A0A';
const MUTED = '#9CA3AF';
const SOFT = '#F5F5F3';
const BORDER = '#E5E7EB';
const ERROR_BG = '#FEF2F2';
const ERROR_TEXT = '#DC2626';

// Ambient orb background
function AmbientOrb() {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withTiming(1.08, {
      duration: 3800,
      easing: Easing.inOut(Easing.sin),
    });

    const interval = setInterval(() => {
      pulse.value = pulse.value === 1
        ? withTiming(1.08, { duration: 3800, easing: Easing.inOut(Easing.sin) })
        : withTiming(1, { duration: 3800, easing: Easing.inOut(Easing.sin) });
    }, 3800);

    return () => clearInterval(interval);
  }, []);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.orbOuter, orbStyle]} />
      <View style={styles.orbInner} />
    </View>
  );
}

// Focused input with animated underline sweep
type FieldProps = TextInputProps & {
  label: string;
  delay?: number;
};

export function AuthField({ label, delay = 0, style, ...props }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const underlineWidth = useSharedValue(0);
  const labelScale = useSharedValue(1);

  const handleFocus = () => {
    setFocused(true);
    underlineWidth.value = withTiming(1, { duration: 340, easing: Easing.out(Easing.cubic) });
    labelScale.value = withSpring(0.88, { damping: 18, stiffness: 240 });
  };

  const handleBlur = () => {
    setFocused(false);
    underlineWidth.value = withTiming(0, { duration: 260, easing: Easing.in(Easing.cubic) });
    labelScale.value = withSpring(1, { damping: 18, stiffness: 240 });
  };

  const underlineStyle = useAnimatedStyle(() => ({
    width: `${underlineWidth.value * 100}%`,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: labelScale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.duration(420).delay(delay)} style={styles.fieldWrap}>
      <Animated.Text style={[styles.fieldLabel, focused && styles.fieldLabelFocused, labelStyle]}>
        {label}
      </Animated.Text>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={MUTED}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {/* Sweep underline */}
        <View style={styles.underlineTrack}>
          <Animated.View style={[styles.underlineBar, underlineStyle]} />
        </View>
      </View>
    </Animated.View>
  );
}

// Primary CTA button
type ButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  delay?: number;
};

export function AuthButton({ label, onPress, loading, disabled, delay = 0 }: ButtonProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.duration(420).delay(delay)} style={animStyle}>
      <Pressable
        onPress={disabled || loading ? undefined : onPress}
        onPressIn={() => {
          if (!disabled && !loading) scale.value = withSpring(0.97, { damping: 18, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 220 });
        }}
        style={[styles.button, (disabled || loading) && styles.buttonDisabled]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

// Error banner
export function AuthError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <Animated.View entering={FadeIn.duration(280)} style={styles.errorBanner}>
      <View style={styles.errorDot} />
      <Text style={styles.errorText}>{message}</Text>
    </Animated.View>
  );
}

// The card shell shared by login + signup
type CardProps = {
  children: React.ReactNode;
};

export function AuthCardShell({ children }: CardProps) {
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AmbientOrb />

      <Animated.View entering={FadeInDown.duration(520).delay(60)} style={styles.card}>
        {/* Top wordmark strip */}
        <Animated.View entering={FadeIn.duration(380)} style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.wordmark}>atomy</Text>
        </Animated.View>

        {children}
      </Animated.View>

      {/* Bottom legal note */}
      <Animated.Text entering={FadeIn.duration(400).delay(600)} style={styles.legalNote}>
        Your data is encrypted and never shared.
      </Animated.Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAF8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  // Ambient orb
  orbOuter: {
    position: 'absolute',
    top: -height * 0.18,
    right: -width * 0.22,
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: width,
    backgroundColor: GREEN_LIGHT,
    opacity: 0.55,
  },
  orbInner: {
    position: 'absolute',
    top: -height * 0.08,
    right: -width * 0.04,
    width: width * 0.42,
    height: width * 0.42,
    borderRadius: width,
    backgroundColor: `${GREEN}18`,
  },

  // Card
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.07,
    shadowRadius: 40,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 28,
  },
  brandDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: GREEN,
  },
  wordmark: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 4.5,
    color: INK,
    textTransform: 'uppercase',
  },

  // Input field
  fieldWrap: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2.5,
    color: MUTED,
    textTransform: 'uppercase',
    marginBottom: 10,
    transformOrigin: 'left center',
  },
  fieldLabelFocused: {
    color: GREEN,
  },
  inputWrap: {
    backgroundColor: SOFT,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  inputWrapFocused: {
    borderColor: `${GREEN}55`,
    backgroundColor: GREEN_PALE,
  },
  input: {
    fontSize: 15,
    fontWeight: '400',
    color: INK,
    paddingHorizontal: 16,
    paddingVertical: 14,
    letterSpacing: 0.2,
  },
  underlineTrack: {
    height: 2,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  underlineBar: {
    height: 2,
    backgroundColor: GREEN,
    borderRadius: 1,
  },

  // Button
  button: {
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8,
    minHeight: 52,
  },
  buttonDisabled: {
    opacity: 0.55,
    shadowOpacity: 0.08,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.4,
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: ERROR_BG,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: ERROR_TEXT,
    marginTop: 4,
    flexShrink: 0,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: ERROR_TEXT,
    lineHeight: 19,
  },

  // Legal
  legalNote: {
    marginTop: 20,
    fontSize: 11,
    color: MUTED,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
