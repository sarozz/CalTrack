import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type Props = {
  size?: number;
  stroke?: number;
  progress: number; // 0..1
  color: string;
  label: string;
  valueText: string;
  subText?: string;
};

export function Ring({ size = 110, stroke = 12, progress, color, label, valueText, subText }: Props) {
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dashOffset = c * (1 - p);

  return (
    <View style={[styles.wrap, { width: size }]}
      accessibilityRole="image"
      accessibilityLabel={`${label}: ${valueText}${subText ? ` ${subText}` : ''}`}
    >
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={'#eee'} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={dashOffset}
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
  label: { fontSize: 12, color: '#666', fontWeight: '600' },
  value: { fontSize: 16, color: '#111', fontWeight: '600', marginTop: 2 },
  sub: { fontSize: 11, color: '#666', marginTop: 2 },
});
