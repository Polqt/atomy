import { useEffect, useRef } from 'react';
import { BackHandler, View, Text, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';
import colors from '../../constants/colors';

export default function SetupDoneScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const name = (user?.user_metadata?.name as string) ?? 'there';
  const completed = useRef(false);

  const scale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 120 }));
    checkOpacity.value = withDelay(
      500,
      withSequence(withTiming(1, { duration: 300 })),
    );
  }, []);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
  }));

  const finishSetup = async () => {
    if (completed.current) return;
    completed.current = true;
    await AsyncStorage.setItem('onboarding_complete', 'true');
    router.replace('/(tabs)');
  };

  useEffect(() => {
    const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    const timeout = setTimeout(() => {
      finishSetup();
    }, 1500);

    return () => {
      clearTimeout(timeout);
      backSubscription.remove();
    };
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={styles.inner}>
        <Animated.Text entering={FadeInDown.duration(400).delay(0)} style={styles.wordmark}>
          atomy
        </Animated.Text>

        <View style={styles.centerBlock}>
          <Animated.View style={[styles.checkCircle, circleStyle]}>
            <Animated.Text style={[styles.checkIcon, checkStyle]}>✓</Animated.Text>
          </Animated.View>

          <Animated.Text entering={FadeInDown.duration(500).delay(400)} style={styles.heading}>
            You're all set,{'\n'}{name}.
          </Animated.Text>

          <Animated.Text entering={FadeInDown.duration(500).delay(520)} style={styles.sub}>
            Your habit journey starts now.{'\n'}Small actions, big results.
          </Animated.Text>
        </View>

        <Animated.View entering={FadeInDown.duration(440).delay(700)} style={styles.footer}>
          <Pressable
            style={styles.button}
            onPress={finishSetup}
          >
            <Text style={styles.buttonText}>Let's go →</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 64,
    paddingBottom: 24,
  },
  wordmark: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 5,
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 48,
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginTop: -48,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  checkIcon: {
    fontSize: 40,
    color: colors.primary,
    fontWeight: '700',
  },
  heading: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -1.2,
    lineHeight: 42,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.muted,
    lineHeight: 22,
    textAlign: 'center',
  },
  footer: {
    gap: 14,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
