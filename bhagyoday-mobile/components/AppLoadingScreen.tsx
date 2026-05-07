import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────
// THEME (MATCHES LOGIN SCREEN)
// ─────────────────────────────────────────────
const PALETTE = {
  rosegold: '#C9956A',
  rosegoldLight: '#E8BFA0',
  rosegoldDark: '#A07040',
  plum: '#2D1B3D',
  plumMid: '#3D2455',
  plumLight: '#5C3A75',
  cream: '#FDF6F0',
  warmWhite: '#FFFFFF',
  textDark: '#1A0E26',
  textMid: '#6B5680',
  textLight: '#9E88B0',
  border: 'rgba(201,149,106,0.25)',
  glassBg: 'rgba(255,255,255,0.08)',
  glassStroke: 'rgba(255,255,255,0.18)',
};

// ─────────────────────────────────────────────
// FLOATING ORB
// ─────────────────────────────────────────────
const FloatingOrb: React.FC<{
  size: number;
  color: string;
  style?: any;
  delay?: number;
}> = ({ size, color, style, delay = 0 }) => {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(float, {
          toValue: 1,
          duration: 3800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 3800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, []);

  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -24],
  });

  const scale = float.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.08, 1],
  });

  const opacity = float.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.18, 0.35, 0.18],
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          transform: [{ translateY }, { scale }],
        },
        style,
      ]}
    />
  );
};

// ─────────────────────────────────────────────
// MAIN LOADING SCREEN
// ─────────────────────────────────────────────
type AppLoadingScreenProps = {
  onAnimationComplete?: () => void;
};

export default function AppLoadingScreen({ onAnimationComplete }: AppLoadingScreenProps) {
  const insets = useSafeAreaInsets();

  // ── Master Animations
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const logoGlow = useRef(new Animated.Value(0)).current;

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(20)).current;

  const loaderWidth = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(-width)).current;

  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const sparkle3 = useRef(new Animated.Value(0)).current;

  const pulse = useRef(new Animated.Value(1)).current;

  const [loadingText, setLoadingText] = useState('Preparing Experience');

  useEffect(() => {
    const finishTimer = setTimeout(() => {
      onAnimationComplete?.();
    }, 4600);

    // ─────────────────────────────────────────
    // ENTRY SEQUENCE
    // ─────────────────────────────────────────
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 55,
          friction: 6,
          useNativeDriver: true,
        }),

        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),

        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),

        Animated.spring(contentTranslate, {
          toValue: 0,
          tension: 45,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(loaderWidth, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),

        Animated.loop(
          Animated.sequence([
            Animated.timing(logoGlow, {
              toValue: 1,
              duration: 1800,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(logoGlow, {
              toValue: 0,
              duration: 1800,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        ),

        Animated.loop(
          Animated.sequence([
            Animated.timing(pulse, {
              toValue: 1.03,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(pulse, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ),

        Animated.loop(
          Animated.sequence([
            Animated.timing(shimmer, {
              toValue: width * 1.5,
              duration: 1800,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(shimmer, {
              toValue: -width,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ),
      ]),
    ]).start();

    // ─────────────────────────────────────────
    // SPARKLES
    // ─────────────────────────────────────────
    const animateSparkle = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 450,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 650,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(1200),
        ])
      ).start();
    };

    animateSparkle(sparkle1, 0);
    animateSparkle(sparkle2, 700);
    animateSparkle(sparkle3, 1200);

    // ─────────────────────────────────────────
    // LOADING TEXT ROTATION
    // ─────────────────────────────────────────
    const texts = [
      'Preparing Experience',
      'Loading Beauty Essentials',
      'Setting Up Your Session',
      'Almost Ready',
    ];

    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % texts.length;
      setLoadingText(texts[index]);
    }, 1200);

    return () => {
      clearInterval(interval);
      clearTimeout(finishTimer);
    };
  }, [onAnimationComplete]);

  const rotate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-18deg', '0deg'],
  });

  const glowScale = logoGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.14],
  });

  const glowOpacity = logoGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.55],
  });

  const progressWidth = loaderWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const sparkleStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.2, 1],
        }),
      },
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [10, -8],
        }),
      },
    ],
  });

  return (
    <View style={styles.container}>
      <StatusBar
        hidden={true}
        translucent
        backgroundColor="transparent"
        />

      {/* BACKGROUND */}
      <LinearGradient
        colors={[PALETTE.plum, PALETTE.plumMid, PALETTE.plumLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* AMBIENT ORBS */}
      <FloatingOrb
        size={180}
        color={PALETTE.rosegold}
        style={{ top: -40, right: -60 }}
      />

      <FloatingOrb
        size={120}
        color={PALETTE.rosegoldLight}
        style={{ top: 120, left: -40 }}
        delay={600}
      />

      <FloatingOrb
        size={140}
        color={PALETTE.plumLight}
        style={{ bottom: 80, right: 20 }}
        delay={1000}
      />

      <FloatingOrb
        size={90}
        color={PALETTE.rosegold}
        style={{ bottom: 160, left: 40 }}
        delay={1400}
      />

      {/* CONTENT */}
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 32,
          },
        ]}
      >
        {/* LOGO */}
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: contentOpacity,
              transform: [
                { scale: logoScale },
                { rotate },
                { scale: pulse },
              ],
            },
          ]}
        >
          {/* Glow */}
          <Animated.View
            style={[
              styles.glow,
              {
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              },
            ]}
          />

          <LinearGradient
            colors={[
              'rgba(255,255,255,0.18)',
              'rgba(255,255,255,0.05)',
            ]}
            style={styles.logoCircle}
          >
            <View style={styles.logoInner}>
              <Ionicons
                name="sparkles"
                size={42}
                color={PALETTE.rosegoldLight}
              />
            </View>
          </LinearGradient>

          {/* FLOATING SPARKLES */}
          <Animated.View
            style={[styles.sparkle, styles.sparkle1, sparkleStyle(sparkle1)]}
          >
            <Ionicons
              name="sparkles"
              size={14}
              color={PALETTE.rosegoldLight}
            />
          </Animated.View>

          <Animated.View
            style={[styles.sparkle, styles.sparkle2, sparkleStyle(sparkle2)]}
          >
            <Ionicons
              name="star"
              size={12}
              color={PALETTE.warmWhite}
            />
          </Animated.View>

          <Animated.View
            style={[styles.sparkle, styles.sparkle3, sparkleStyle(sparkle3)]}
          >
            <Ionicons
              name="sparkles"
              size={10}
              color={PALETTE.rosegold}
            />
          </Animated.View>
        </Animated.View>

        {/* BRAND */}
        <Animated.View
          style={{
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslate }],
            alignItems: 'center',
          }}
        >
          <Text style={styles.title}>Bhagyoday Parlour</Text>

          <View style={styles.taglineRow}>
            <View style={styles.taglineLine} />
            <Text style={styles.tagline}>Luxury Experience</Text>
            <View style={styles.taglineLine} />
          </View>
        </Animated.View>

        {/* LOADER CARD */}
        <Animated.View
          style={[
            styles.loaderCard,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslate }],
            },
          ]}
        >
          <View style={styles.loaderTrack}>
            <Animated.View
              style={[styles.loaderFill, { width: progressWidth }]}
            >
              <Animated.View
                style={[
                  styles.shimmer,
                  {
                    transform: [{ translateX: shimmer }],
                  },
                ]}
              />
            </Animated.View>
          </View>

          <Text style={styles.loadingText}>{loadingText}</Text>

          <Text style={styles.helperText}>
            Crafting a premium beauty experience for you
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.plum,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // ─ LOGO
  logoWrapper: {
    marginBottom: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },

  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: PALETTE.rosegold,
  },

  logoCircle: {
    width: 118,
    height: 118,
    borderRadius: 59,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',

    shadowColor: PALETTE.rosegold,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 14,
  },

  logoInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(201,149,106,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  sparkle: {
    position: 'absolute',
  },

  sparkle1: {
    top: 8,
    right: -4,
  },

  sparkle2: {
    left: -6,
    bottom: 18,
  },

  sparkle3: {
    right: 10,
    bottom: -4,
  },

  // ─ TEXT
  title: {
    fontSize: 31,
    fontWeight: '800',
    color: PALETTE.warmWhite,
    letterSpacing: 0.4,
    textAlign: 'center',
  },

  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },

  taglineLine: {
    width: 34,
    height: 1,
    backgroundColor: 'rgba(232,191,160,0.55)',
  },

  tagline: {
    fontSize: 12,
    color: PALETTE.rosegoldLight,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // ─ LOADER CARD
  loaderCard: {
    width: '100%',
    maxWidth: 340,
    marginTop: 44,
    backgroundColor: PALETTE.glassBg,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: PALETTE.glassStroke,
    padding: 22,
  },

  loaderTrack: {
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  loaderFill: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: PALETTE.rosegold,
  },

  shimmer: {
    position: 'absolute',
    top: -20,
    width: 70,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.32)',
    transform: [{ rotate: '20deg' }],
  },

  loadingText: {
    marginTop: 18,
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.warmWhite,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  helperText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});