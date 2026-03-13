import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
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

  const totals = entries.reduce(
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

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No entries.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.emoji}>{item.emoji || '🍽️'}</Text>
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
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  headerTitle: { fontWeight: '900', fontSize: 14, color: '#111' },
  headerBig: { fontWeight: '900', fontSize: 18, marginTop: 4 },
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
});
