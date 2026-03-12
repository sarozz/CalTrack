import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { loadEntries, loadSettings } from '../storage/store';
import type { Entry, Settings } from '../types/models';
import { formatTime, toDateKey } from '../utils/date';

export type HomeStackParamList = {
  Home: undefined;
  Settings: undefined;
};

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [settings, setSettings] = React.useState<Settings | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      (async () => {
        const [e, s] = await Promise.all([loadEntries(), loadSettings()]);
        if (!mounted) return;
        setEntries(e);
        setSettings(s);
      })();
      return () => {
        mounted = false;
      };
    }, [])
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('Settings')} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>Settings</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const todayKey = toDateKey(new Date());
  const todays = entries.filter((e) => e.dateKey === todayKey);
  const totals = todays.reduce(
    (acc, e) => {
      acc.calories += e.calories;
      acc.protein += e.protein;
      return acc;
    },
    { calories: 0, protein: 0 }
  );

  const calGoal = settings?.caloriesGoal ?? 0;
  const proGoal = settings?.proteinGoal ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Today</Text>
        <Text style={styles.big}>{totals.calories} / {calGoal || '—'} kcal</Text>
        <Text style={styles.big}>{totals.protein} / {proGoal || '—'} g protein</Text>
        <Text style={styles.subtle}>Tap Log (+) to add an entry.</Text>
      </View>

      <Text style={styles.section}>Today feed</Text>
      <FlatList
        data={todays}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No entries yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                {item.meal} · {item.calories} kcal · {item.protein}g
              </Text>
              {!!item.caption && <Text style={styles.caption}>{item.caption}</Text>}
              {!!item.rawText && <Text style={styles.raw}>{item.rawText}</Text>}
            </View>
            <Text style={styles.time}>{formatTime(new Date(item.createdAt))}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f6', padding: 14, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  title: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  big: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  subtle: { marginTop: 6, color: '#666' },
  section: { fontWeight: '800', fontSize: 14, marginTop: 4 },
  empty: { color: '#666', paddingVertical: 10 },
  row: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  emoji: { fontSize: 22, marginTop: 2 },
  rowTitle: { fontWeight: '800', color: '#111' },
  caption: { color: '#222', marginTop: 2 },
  raw: { color: '#666', marginTop: 2, fontSize: 12 },
  time: { color: '#666', fontSize: 12, marginTop: 2 },
  headerBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  headerBtnText: { color: '#0a66ff', fontWeight: '700' },
});
