import React from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

const BULLETS = [
  { title: 'Smart tracking', body: 'Log in seconds. Keep it simple and consistent.' },
  { title: 'Health-first defaults', body: 'We set sensible micronutrient goals you can tweak anytime.' },
  { title: 'Local-first privacy', body: 'Your data stays on your device in V1.' },
  { title: 'Fast insights', body: 'See patterns over weeks, not just days.' },
];

export function LoadingScreen() {
  const anim = React.useRef(new Animated.Value(0)).current;
  const [i, setI] = React.useState(0);

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      })
    ).start();

    const t = setInterval(() => setI((v) => (v + 1) % BULLETS.length), 1600);
    return () => clearInterval(t);
  }, [anim]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['15%', '92%'] });
  const b = BULLETS[i];

  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>CalTrack</Text>
      <Text style={styles.sub}>Getting things ready…</Text>

      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width }]} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{b.title}</Text>
        <Text style={styles.cardBody}>{b.body}</Text>

        <View style={{ marginTop: 10, gap: 6 }}>
          <Text style={styles.stat}>• Avg log time: ~8 seconds</Text>
          <Text style={styles.stat}>• People who track daily are more consistent over time</Text>
          <Text style={styles.stat}>• Focus: calories + protein + key micros</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0B0F1A', padding: 18, paddingTop: 60 },
  h1: { color: '#fff', fontSize: 30, fontWeight: '900' },
  sub: { color: 'rgba(255,255,255,0.65)', marginTop: 6 },
  barTrack: {
    marginTop: 18,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(236, 72, 153, 0.95)',
  },
  card: {
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 18,
    padding: 14,
  },
  cardTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  cardBody: { color: 'rgba(255,255,255,0.78)', marginTop: 6, lineHeight: 19 },
  stat: { color: 'rgba(255,255,255,0.60)', fontSize: 12, lineHeight: 16 },
});
