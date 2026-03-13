import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type Props = {
  size?: number;
  stroke?: number;
  outerProgress: number; // calories 0..1
  innerProgress: number; // protein 0..1
  outerColor: string;
  innerColor: string;
  centerTitle: string;
  centerSub: string;
};

function clamp01(n: number) {
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
}

function ringProps(size: number, stroke: number, radius: number, progress: number) {
  const c = 2 * Math.PI * radius;
  const dashOffset = c * (1 - clamp01(progress));
  return { c, dashOffset, radius };
}

export function MultiRing({
  size = 190,
  stroke = 16,
  outerProgress,
  innerProgress,
  outerColor,
  innerColor,
  centerTitle,
  centerSub,
}: Props) {
  const padding = 6;
  const outerR = (size - stroke) / 2;
  const innerR = outerR - stroke - padding;

  const outer = ringProps(size, stroke, outerR, outerProgress);
  const inner = ringProps(size, stroke, innerR, innerProgress);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* tracks */}
        <Circle cx={size / 2} cy={size / 2} r={outerR} stroke={'#eee'} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={innerR} stroke={'#eee'} strokeWidth={stroke} fill="none" />

        {/* progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={outer.radius}
          stroke={outerColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${outer.c} ${outer.c}`}
          strokeDashoffset={outer.dashOffset}
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={inner.radius}
          stroke={innerColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${inner.c} ${inner.c}`}
          strokeDashoffset={inner.dashOffset}
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
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
