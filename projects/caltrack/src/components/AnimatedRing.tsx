import React from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../styles/theme';

type Props = {
  size?: number;
  stroke?: number;
  progress: number; // 0..1
  color: string;
  label: string;
  valueText: string;
  subText?: string;
  animateMs?: number;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function clamp01(n: number) {
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
}

export function AnimatedRing({
  size = 110,
  stroke = 12,
  progress,
  color,
  label,
  valueText,
  subText,
  animateMs = 650,
}: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const anim = React.useRef(new Animated.Value(clamp01(progress))).current;

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: clamp01(progress),
      duration: animateMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, animateMs, anim]);

  const dashOffset = anim.interpolate({ inputRange: [0, 1], outputRange: [c, 0] });

  return (
    <View style={[styles.wrap, { width: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={COLORS.track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={dashOffset as any}
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>

      <View style={styles.center}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{valueText}</Text>
        {!!subText && <Text style={styles.sub}>{subText}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center', paddingHorizontal: 6 },
  label: { fontSize: 12, color: 'rgba(17,17,17,0.55)', fontWeight: '800' },
  value: { fontSize: 16, color: '#111', fontWeight: '900', marginTop: 2, letterSpacing: -0.2 },
  sub: { fontSize: 11, color: 'rgba(17,17,17,0.55)', marginTop: 2, fontWeight: '800' },
});
