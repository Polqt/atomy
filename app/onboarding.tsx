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

const { width, height } = Dimensions.get('window');

const GREEN = '#22C55E';
const GREEN_PALE = '#DCFCE7';
const GREEN_MID = '#86EFAC';
const CREAM = '#FAFAF8';
const INK = '#0C0C0C';
const MUTED = '#A0A0A0';

const SLIDES = [
  {
    key: '1',
    index: '01',
    headline: 'Build tiny\nhabits that\nstick.',
    sub: 'Small actions, done daily, reshape who you become.',
    blobOffset: -30,
  },
  {
    key: '2',
    index: '02',
    headline: 'AI adapts\nto your\nprogress.',
    sub: 'Your habits evolve with you — never too hard, never too easy.',
    blobOffset: 20,
  },
  {
    key: '3',
    index: '03',
    headline: 'Start your\nfirst 1%\ntoday.',
    sub: "One percent better, every day. That's all it takes.",
    blobOffset: -10,
  },
];

// Softly drifting ambient blob
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
      {/* Large anchor blob top-right */}
      <Blob size={width * 0.8} color={GREEN_PALE} top={-width * 0.25} left={width * 0.35} delay={0} duration={4200} />
      {/* Mid blob center-left */}
      <Blob size={width * 0.55} color={`${GREEN_MID}55`} top={height * 0.28} left={-width * 0.18} delay={600} duration={5100} />
      {/* Small accent bottom-right */}
      <Blob size={width * 0.38} color={GREEN_PALE} top={height * 0.62} left={width * 0.6} delay={1200} duration={3800} />
      {/* Tiny top-left whisper */}
      <Blob size={width * 0.22} color={`${GREEN}22`} top={height * 0.1} left={-width * 0.05} delay={900} duration={4600} />
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
      {/* Ghost index numeral */}
      <Animated.Text entering={FadeIn.duration(400).delay(100)} style={styles.ghostNumeral}>
        {item.index}
      </Animated.Text>

      {/* Main content block */}
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
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />
      <Background />

      {/* Top bar */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.topBar}>
        <Text style={styles.wordmark}>atomy</Text>
        {!isLast && (
          <Pressable onPress={handleSkip} hitSlop={12}>
            <Text style={styles.skipLabel}>Skip</Text>
          </Pressable>
        )}
      </Animated.View>

      {/* Slides */}
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

      {/* Footer */}
      <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.footer}>
        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          <SlideDot scrollX={scrollX} index={0} />
          <SlideDot scrollX={scrollX} index={1} />
          <SlideDot scrollX={scrollX} index={2} />
        </View>

        {/* CTA Button */}
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>{isLast ? 'Get Started' : 'Continue'}</Text>
          <View style={styles.buttonArrow}>
            <Text style={styles.arrowText}>→</Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CREAM,
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
    color: GREEN,
    textTransform: 'uppercase',
  },

  skipLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: MUTED,
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
    color: `${GREEN}0D`,
    letterSpacing: -8,
    lineHeight: height * 0.28,
  },

  slideContent: {
    paddingTop: height * 0.08,
  },

  headline: {
    fontSize: 46,
    fontWeight: '300',
    color: INK,
    letterSpacing: -1.5,
    lineHeight: 54,
    fontStyle: 'normal',
  },

  dividerRow: {
    marginVertical: 24,
  },

  divider: {
    width: 32,
    height: 2,
    backgroundColor: GREEN,
    borderRadius: 2,
  },

  sub: {
    fontSize: 15,
    fontWeight: '300',
    color: MUTED,
    lineHeight: 24,
    maxWidth: 260,
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
    backgroundColor: GREEN,
  },

  button: {
    backgroundColor: INK,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: INK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },

  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  buttonArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrowText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
});
