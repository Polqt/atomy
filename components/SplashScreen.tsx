import { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const GREEN = '#22C55E';

function AtomGlyph() {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.18);
  const orbitRotate = useSharedValue(0);
  const coreGlow = useSharedValue(0.6);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.55, { duration: 2200, easing: Easing.out(Easing.sin) }),
        withTiming(1, { duration: 2200, easing: Easing.in(Easing.sin) }),
      ),
      -1,
      false,
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 2200, easing: Easing.out(Easing.sin) }),
        withTiming(0.18, { duration: 2200, easing: Easing.in(Easing.sin) }),
      ),
      -1,
      false,
    );
    orbitRotate.value = withRepeat(
      withTiming(360, { duration: 7000, easing: Easing.linear }),
      -1,
      false,
    );
    coreGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.out(Easing.sin) }),
        withTiming(0.6, { duration: 2200, easing: Easing.in(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);

  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbitRotate.value}deg` }],
  }));

  const innerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-orbitRotate.value * 0.6}deg` }],
  }));

  const coreDotStyle = useAnimatedStyle(() => ({
    opacity: coreGlow.value,
    transform: [{ scale: 0.85 + coreGlow.value * 0.15 }],
  }));

  return (
    <View style={styles.glyphContainer}>
      {/* Breathing pulse ring — outermost */}
      <Animated.View style={[styles.pulseRing, pulseRingStyle]} />

      {/* Outer orbit arc */}
      <Animated.View style={[styles.orbitRingOuter, outerRingStyle]}>
        <View style={styles.orbitDotOuter} />
      </Animated.View>

      {/* Inner orbit arc */}
      <Animated.View style={[styles.orbitRingInner, innerRingStyle]}>
        <View style={styles.orbitDotInner} />
      </Animated.View>

      {/* Static base ring */}
      <View style={styles.staticRing} />

      {/* Core nucleus */}
      <Animated.View style={[styles.nucleus, coreDotStyle]} />
    </View>
  );
}

type Props = {
  onFinish?: () => void;
};

export default function SplashScreen({ onFinish }: Props) {
  useEffect(() => {
    if (onFinish) {
      const t = setTimeout(onFinish, 2600);
      return () => clearTimeout(t);
    }
  }, [onFinish]);

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(600).delay(100)} style={styles.glyphWrapper}>
        <AtomGlyph />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.wordmarkRow}>
        <Text style={styles.wordmark}>atomy</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(780)} style={styles.taglineRow}>
        <Text style={styles.tagline}>Small habits. Real change.</Text>
      </Animated.View>

      {/* Bottom breath indicator */}
      <Animated.View entering={FadeIn.duration(400).delay(1100)} style={styles.bottomMark}>
        <BreathDots />
      </Animated.View>
    </View>
  );
}

function BreathDots() {
  const dot1 = useSharedValue(0.25);
  const dot2 = useSharedValue(0.25);
  const dot3 = useSharedValue(0.25);

  useEffect(() => {
    const ease = Easing.out(Easing.sin);
    dot1.value = withRepeat(
      withSequence(withTiming(1, { duration: 600, easing: ease }), withTiming(0.25, { duration: 600, easing: ease })),
      -1, false,
    );
    dot2.value = withDelay(200, withRepeat(
      withSequence(withTiming(1, { duration: 600, easing: ease }), withTiming(0.25, { duration: 600, easing: ease })),
      -1, false,
    ));
    dot3.value = withDelay(400, withRepeat(
      withSequence(withTiming(1, { duration: 600, easing: ease }), withTiming(0.25, { duration: 600, easing: ease })),
      -1, false,
    ));
  }, []);

  const s1 = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const s3 = useAnimatedStyle(() => ({ opacity: dot3.value }));

  return (
    <View style={styles.dotsRow}>
      <Animated.View style={[styles.dot, s1]} />
      <Animated.View style={[styles.dot, s2]} />
      <Animated.View style={[styles.dot, s3]} />
    </View>
  );
}

const GLYPH_SIZE = width * 0.38;
const OUTER_RING = GLYPH_SIZE;
const INNER_RING = GLYPH_SIZE * 0.62;
const NUCLEUS_SIZE = GLYPH_SIZE * 0.18;
const ORBIT_DOT = 7;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },

  glyphWrapper: {
    marginBottom: 44,
  },

  glyphContainer: {
    width: GLYPH_SIZE,
    height: GLYPH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pulseRing: {
    position: 'absolute',
    width: GLYPH_SIZE * 0.72,
    height: GLYPH_SIZE * 0.72,
    borderRadius: GLYPH_SIZE,
    backgroundColor: GREEN,
  },

  staticRing: {
    position: 'absolute',
    width: OUTER_RING * 0.72,
    height: OUTER_RING * 0.72,
    borderRadius: OUTER_RING,
    borderWidth: 1,
    borderColor: `${GREEN}30`,
  },

  orbitRingOuter: {
    position: 'absolute',
    width: OUTER_RING * 0.72,
    height: OUTER_RING * 0.72,
    borderRadius: OUTER_RING,
    borderWidth: 1.5,
    borderColor: `${GREEN}55`,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  orbitDotOuter: {
    width: ORBIT_DOT,
    height: ORBIT_DOT,
    borderRadius: ORBIT_DOT,
    backgroundColor: GREEN,
    marginTop: -ORBIT_DOT / 2,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 8,
  },

  orbitRingInner: {
    position: 'absolute',
    width: INNER_RING * 0.72,
    height: INNER_RING * 0.72,
    borderRadius: INNER_RING,
    borderWidth: 1,
    borderColor: `${GREEN}40`,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  orbitDotInner: {
    width: ORBIT_DOT - 2,
    height: ORBIT_DOT - 2,
    borderRadius: ORBIT_DOT,
    backgroundColor: `${GREEN}CC`,
    marginBottom: -(ORBIT_DOT - 2) / 2,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 6,
  },

  nucleus: {
    position: 'absolute',
    width: NUCLEUS_SIZE,
    height: NUCLEUS_SIZE,
    borderRadius: NUCLEUS_SIZE,
    backgroundColor: GREEN,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 12,
  },

  wordmarkRow: {
    marginBottom: 10,
  },

  wordmark: {
    fontFamily: 'Georgia',
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: 6,
    color: '#0F0F0F',
    textTransform: 'lowercase',
  },

  taglineRow: {},

  tagline: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 1.2,
    color: '#888',
  },

  bottomMark: {
    position: 'absolute',
    bottom: 52,
  },

  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },

  dot: {
    width: 4,
    height: 4,
    borderRadius: 4,
    backgroundColor: GREEN,
  },
});
