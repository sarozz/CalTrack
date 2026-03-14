import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { loadEntries } from '../storage/store';
import type { Entry } from '../types/models';
import type { HistoryStackParamList } from './HistoryScreen';
import { formatDateLabel, formatTime } from '../utils/date';

type Props = NativeStackScreenProps<HistoryStackParamList, 'DayDetail'>;

export function DayDetailScreen({ route, navigation }: Props) {
  const { dateKey } = route.params;
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [q, setQ] = React.useState('');
  const [mealFilter, setMealFilter] = React.useState<'All' | Entry['meal']>('All');

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      (async () => {
        const all = await loadEntries();
        const day = all.filter((e) => e.dateKey === dateKey).sort((a, b) => b.createdAt - a.createdAt);
        if (!mounted) return;
        setEntries(day);
      })();
      return () => {
        mounted = false;
      };
    }, [dateKey])
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: formatDateLabel(dateKey) });
  }, [dateKey, navigation]);

  const filtered = entries.filter((e) => {
    if (mealFilter !== 'All' && e.meal !== mealFilter) return false;
    if (!q.trim()) return true;
    const hay = `${e.caption || ''} ${e.rawText || ''}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  const totals = filtered.reduce(
    (acc, e) => {
      acc.calories += e.calories;
      acc.protein += e.protein;
      return acc;
    },
    { calories: 0, protein: 0 }
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Totals</Text>
        <Text style={styles.headerBig}>{totals.calories} kcal</Text>
        <Text style={styles.headerBig}>{totals.protein} g protein</Text>
      </View>

      <View style={styles.filterCard}>
        <TextInput
          style={styles.search}
          placeholder="Search this day…"
          value={q}
          onChangeText={setQ}
          placeholderTextColor="rgba(17,17,17,0.45)"
        />
        <View style={styles.chips}>
          {(['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map((m) => {
            const selected = mealFilter === m;
            return (
              <Pressable
                key={m}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setMealFilter(m as any)}
              >
                <Text style={[styles.chipTxt, selected && styles.chipTxtSelected]}>{m}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No matches.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => navigation.navigate('EditEntry', { id: item.id })}>
            <Text style={styles.emoji}>{item.emoji || '🍽️'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                {item.meal} · {item.calories} kcal · {item.protein}g
              </Text>
              {!!item.caption && <Text style={styles.caption}>{item.caption}</Text>}
              {!!item.rawText && <Text style={styles.raw}>{item.rawText}</Text>}
            </View>
            <Text style={styles.time}>{formatTime(new Date(item.createdAt))}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f6', padding: 14, gap: 12 },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  filterCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  search: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.10)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fafafa',
    fontSize: 16,
    color: '#111',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  chipSelected: { backgroundColor: 'rgba(236, 72, 153, 0.12)', borderColor: 'rgba(236, 72, 153, 0.30)' },
  chipTxt: { color: 'rgba(17,17,17,0.65)', fontWeight: '700' },
  chipTxtSelected: { color: '#9D174D' },
  headerTitle: { fontWeight: '600', fontSize: 14, color: '#111' },
  headerBig: { fontWeight: '600', fontSize: 18, marginTop: 4 },
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
  rowTitle: { fontWeight: '600', color: '#111' },
  caption: { color: '#222', marginTop: 2 },
  raw: { color: '#666', marginTop: 2, fontSize: 12 },
  time: { color: '#666', fontSize: 12, marginTop: 2 },
});
