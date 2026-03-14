import React from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';

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
      <View style={styles.center}>
        <View style={styles.logoWrap}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} />
        </View>

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
            <Text style={styles.stat}>• Focus: calories + protein + key micros</Text>
            <Text style={styles.stat}>• Local-first by default</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#0B0F1A',
    padding: 18,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrap: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logo: { width: 64, height: 64, borderRadius: 16 },
  h1: { color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  sub: { color: 'rgba(255,255,255,0.65)', marginTop: 6, textAlign: 'center' },
  barTrack: {
    marginTop: 18,
    height: 10,
    width: 260,
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
    width: 320,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 18,
    padding: 14,
  },
  cardTitle: { color: '#fff', fontWeight: '800', fontSize: 16, textAlign: 'center' },
  cardBody: { color: 'rgba(255,255,255,0.78)', marginTop: 6, lineHeight: 19, textAlign: 'center' },
  stat: { color: 'rgba(255,255,255,0.60)', fontSize: 12, lineHeight: 16, textAlign: 'center' },
});
