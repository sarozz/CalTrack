import React from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../styles/theme';
import { useAppTheme } from '../styles/appTheme';
import { AnimatedNumber } from './AnimatedNumber';

type Props = {
  size?: number;
  outerStroke?: number;
  innerStroke?: number;
  outerProgress: number; // calories 0..1
  innerProgress: number; // protein 0..1
  outerColor: string;
  innerColor: string;
  centerTitle: string;
  centerSub: string;
  animateMs?: number;
};

function clamp01(n: number) {
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
}

function ringProps(radius: number) {
  const c = 2 * Math.PI * radius;
  return { c, radius };
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function MultiRing({
  size = 220,
  outerStroke = 18,
  innerStroke = 14,
  outerProgress,
  innerProgress,
  outerColor,
  innerColor,
  centerTitle,
  centerSub,
  animateMs = 700,
}: Props) {
  // No visible gap between rings (Apple Health style)
  const padding = 0;

  const outerR = (size - outerStroke) / 2;
  const innerR = outerR - outerStroke / 2 - innerStroke / 2 - padding;

  const outer = ringProps(outerR);
  const inner = ringProps(innerR);

  const outerAnim = React.useRef(new Animated.Value(clamp01(outerProgress))).current;
  const innerAnim = React.useRef(new Animated.Value(clamp01(innerProgress))).current;

  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.timing(outerAnim, {
      toValue: clamp01(outerProgress),
      duration: animateMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // subtle bounce when values update
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.02, duration: 120, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
    ]).start();
  }, [outerProgress, animateMs, outerAnim, scaleAnim]);

  React.useEffect(() => {
    Animated.timing(innerAnim, {
      toValue: clamp01(innerProgress),
      duration: animateMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [innerProgress, animateMs, innerAnim]);

  const outerDashoffset = outerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [outer.c, 0],
  });

  const innerDashoffset = innerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [inner.c, 0],
  });

  const cx = size / 2;
  const cy = size / 2;

  const { colors } = useAppTheme();

  const centerCalories = Number(String(centerTitle).match(/\d+/)?.[0] || '0');

  return (
    <Animated.View style={[styles.wrap, { width: size, height: size, transform: [{ scale: scaleAnim }] }]}>
      <Svg width={size} height={size}>
        {/* tracks */}
        <Circle cx={cx} cy={cy} r={outerR} stroke={COLORS.track} strokeWidth={outerStroke} fill="none" />
        <Circle cx={cx} cy={cy} r={innerR} stroke={COLORS.track} strokeWidth={innerStroke} fill="none" />

        {/* progress */}
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={outer.radius}
          stroke={outerColor}
          strokeWidth={outerStroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${outer.c} ${outer.c}`}
          strokeDashoffset={outerDashoffset as any}
          rotation={-90}
          originX={cx}
          originY={cy}
        />
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={inner.radius}
          stroke={innerColor}
          strokeWidth={innerStroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${inner.c} ${inner.c}`}
          strokeDashoffset={innerDashoffset as any}
          rotation={-90}
          originX={cx}
          originY={cy}
        />
      </Svg>

      <View style={styles.center}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <AnimatedNumber
            value={centerCalories}
            durationMs={animateMs}
            style={[styles.centerTitle, { color: colors.text }]}
            format={(n) => `${Math.round(n)}`}
          />
          <Text style={[styles.centerUnit, { color: colors.subtext }]}>kcal</Text>
        </View>
        <Text style={[styles.centerSub, { color: colors.subtext }]}>{centerSub}</Text>
      </View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center', paddingHorizontal: 10 },
  centerTitle: { fontSize: 32, fontWeight: '600', color: '#111', letterSpacing: -0.5 },
  centerUnit: { fontSize: 14, fontWeight: '600', color: 'rgba(17,17,17,0.55)' },
  centerSub: { marginTop: 6, fontSize: 12, fontWeight: '600', color: 'rgba(17,17,17,0.55)', textAlign: 'center', lineHeight: 16 },

});
