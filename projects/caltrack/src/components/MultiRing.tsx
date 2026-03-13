import React from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

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
  const padding = 10;

  const outerR = (size - outerStroke) / 2;
  const innerR = outerR - outerStroke / 2 - innerStroke / 2 - padding;

  const outer = ringProps(outerR);
  const inner = ringProps(innerR);

  const outerAnim = React.useRef(new Animated.Value(clamp01(outerProgress))).current;
  const innerAnim = React.useRef(new Animated.Value(clamp01(innerProgress))).current;

  React.useEffect(() => {
    Animated.timing(outerAnim, {
      toValue: clamp01(outerProgress),
      duration: animateMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [outerProgress, animateMs, outerAnim]);

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

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* tracks */}
        <Circle cx={cx} cy={cy} r={outerR} stroke={'#eee'} strokeWidth={outerStroke} fill="none" />
        <Circle cx={cx} cy={cy} r={innerR} stroke={'#eee'} strokeWidth={innerStroke} fill="none" />

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
        <Text style={styles.centerTitle}>{centerTitle}</Text>
        <Text style={styles.centerSub}>{centerSub}</Text>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: outerColor }]} />
          <Text style={styles.legendTxt}>Calories</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: innerColor }]} />
          <Text style={styles.legendTxt}>Protein</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center', paddingHorizontal: 10 },
  centerTitle: { fontSize: 24, fontWeight: '900', color: '#111' },
  centerSub: { marginTop: 4, fontSize: 12, fontWeight: '800', color: '#666', textAlign: 'center' },
  legend: { position: 'absolute', bottom: -2, gap: 6 },
  legendRow: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 10 },
  legendTxt: { color: '#666', fontWeight: '800', fontSize: 12 },
});
