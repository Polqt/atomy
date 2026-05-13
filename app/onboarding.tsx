import { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  useAnimatedScrollHandler,
  SharedValue,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../constants/colors';

const { width, height } = Dimensions.get('window');

const GREEN_MID = '#86EFAC';

const SLIDES = [
  {
    key: '1',
    index: '01',
    headline: 'Build tiny habits\nthat stick.',
    sub: 'Small actions. Big results.',
    blobOffset: -30,
  },
  {
    key: '2',
    index: '02',
    headline: 'AI adapts to\nyour progress.',
    sub: 'Smarter habits over time.',
    blobOffset: 20,
  },
  {
    key: '3',
    index: '03',
    headline: 'Start your\nfirst 1% today.',
    sub: 'Your journey begins now.',
    blobOffset: -10,
  },
];

function Blob({
  size,
  color,
  top,
  left,
  delay,
  duration,
}: {
  size: number;
  color: string;
  top: number;
  left: number;
  delay: number;
  duration: number;
}) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-18, { duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(18, { duration, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    translateX.value = withDelay(
      delay + 300,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: duration * 1.3, easing: Easing.inOut(Easing.sin) }),
          withTiming(10, { duration: duration * 1.3, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    scale.value = withDelay(
      delay + 150,
      withRepeat(
        withSequence(
          withTiming(1.06, { duration: duration * 0.9, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.96, { duration: duration * 0.9, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top,
          left,
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: color,
        },
        animStyle,
      ]}
    />
  );
}

function Background() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Blob size={width * 0.8} color={colors.primaryLight} top={-width * 0.25} left={width * 0.35} delay={0} duration={4200} />
      <Blob size={width * 0.55} color={`${GREEN_MID}55`} top={height * 0.28} left={-width * 0.18} delay={600} duration={5100} />
      <Blob size={width * 0.38} color={colors.primaryLight} top={height * 0.62} left={width * 0.6} delay={1200} duration={3800} />
      <Blob size={width * 0.22} color={`${colors.primary}22`} top={height * 0.1} left={-width * 0.05} delay={900} duration={4600} />
    </View>
  );
}

function SlideDot({ scrollX, index }: { scrollX: SharedValue<number>; index: number }) {
  const dotStyle = useAnimatedStyle(() => {
    const input = scrollX.value / width;
    const active = interpolate(input, [index - 1, index, index + 1], [0, 1, 0], 'clamp');
    return {
      width: interpolate(active, [0, 1], [6, 22]),
      opacity: interpolate(active, [0, 1], [0.25, 1]),
    };
  });
  return <Animated.View style={[styles.dot, dotStyle]} />;
}

function SlideItem({ item, index }: { item: (typeof SLIDES)[0]; index: number }) {
  return (
    <View style={styles.slide}>
      <Animated.Text entering={FadeIn.duration(400).delay(100)} style={styles.ghostNumeral}>
        {item.index}
      </Animated.Text>

      <View style={styles.slideContent}>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(180)}
          style={styles.headline}
        >
          {item.headline}
        </Animated.Text>

        <Animated.View
          entering={FadeInDown.duration(500).delay(320)}
          style={styles.dividerRow}
        >
          <View style={styles.divider} />
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.duration(500).delay(420)}
          style={styles.sub}
        >
          {item.sub}
        </Animated.Text>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const isLast = activeIndex === SLIDES.length - 1;

  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      const next = activeIndex + 1;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    }
  };

  const handleSkip = async () => {
    await handleFinish();
  };

  const handleFinish = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true');
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <Background />

      <Animated.View entering={FadeIn.duration(400)} style={styles.topBar}>
        <Text style={styles.wordmark}>atomy</Text>
        {!isLast && (
          <Pressable onPress={handleSkip} hitSlop={12}>
            <Text style={styles.skipLabel}>Skip</Text>
          </Pressable>
        )}
      </Animated.View>

      <Animated.FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(index);
        }}
        renderItem={({ item, index }) => <SlideItem item={item} index={index} />}
      />

      <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.footer}>
        <View style={styles.dotsRow}>
          <SlideDot scrollX={scrollX} index={0} />
          <SlideDot scrollX={scrollX} index={1} />
          <SlideDot scrollX={scrollX} index={2} />
        </View>

        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>{isLast ? 'Get Started' : 'Next'}</Text>
          {!isLast && (
            <View style={styles.buttonArrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    paddingBottom: 8,
  },

  wordmark: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 5,
    color: colors.primary,
    textTransform: 'uppercase',
  },

  skipLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.muted,
    letterSpacing: 0.3,
  },

  slide: {
    width,
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    paddingBottom: 24,
  },

  ghostNumeral: {
    position: 'absolute',
    top: -height * 0.04,
    right: -14,
    fontSize: height * 0.26,
    fontWeight: '800',
    color: `${colors.primary}0D`,
    letterSpacing: -8,
    lineHeight: height * 0.28,
  },

  slideContent: {
    paddingTop: height * 0.08,
  },

  headline: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -1.5,
    lineHeight: 50,
  },

  dividerRow: {
    marginVertical: 24,
  },

  divider: {
    width: 32,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },

  sub: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.muted,
    lineHeight: 24,
    letterSpacing: 0.1,
  },

  footer: {
    paddingHorizontal: 32,
    paddingBottom: 52,
    gap: 32,
  },

  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  dot: {
    height: 3,
    borderRadius: 99,
    backgroundColor: colors.primary,
  },

  button: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 18,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },

  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  buttonArrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrowText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});
