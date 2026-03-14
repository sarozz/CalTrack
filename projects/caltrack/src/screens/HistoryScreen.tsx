import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { loadEntries } from '../storage/store';
import type { Entry } from '../types/models';
import { formatDateLabel } from '../utils/date';

export type HistoryStackParamList = {
  Profile: undefined;
  History: undefined;
  DayDetail: { dateKey: string };
  EditEntry: { id: string };
  Insights: undefined;
  Legal: { kind: 'terms' | 'privacy' | 'faq' };
};

type Props = NativeStackScreenProps<HistoryStackParamList, 'History'>;

type DayRow = {
  dateKey: string;
  calories: number;
  protein: number;
  count: number;
};

export function HistoryScreen({ navigation }: Props) {
  const [rows, setRows] = React.useState<DayRow[]>([]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('Profile')} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
          <Text style={{ color: 'rgba(17,17,17,0.6)', fontWeight: '800' }}>Profile</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      (async () => {
        const entries = await loadEntries();
        const map = new Map<string, DayRow>();
        for (const e of entries) {
          const r = map.get(e.dateKey) || { dateKey: e.dateKey, calories: 0, protein: 0, count: 0 };
          r.calories += e.calories;
          r.protein += e.protein;
          r.count += 1;
          map.set(e.dateKey, r);
        }
        const list = Array.from(map.values()).sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
        if (!mounted) return;
        setRows(list);
      })();
      return () => {
        mounted = false;
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <Pressable style={styles.insightsCard} onPress={() => navigation.navigate('Insights')}>
        <View style={{ flex: 1 }}>
          <Text style={styles.insightsTitle}>Weekly insights</Text>
          <Text style={styles.insightsSub}>See trends and consistency for the last 7 days.</Text>
        </View>
        <Text style={styles.insightsChevron}>›</Text>
      </Pressable>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.dateKey}
        ListEmptyComponent={<Text style={styles.empty}>No history yet.</Text>}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('DayDetail', { dateKey: item.dateKey })} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{formatDateLabel(item.dateKey)}</Text>
              <Text style={styles.rowSubtle}>{item.count} entries</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.metric}>{item.calories} kcal</Text>
              <Text style={styles.metric}>{item.protein} g</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f6', padding: 14 },
  insightsCard: {
    backgroundColor: '#0B0F1A',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  insightsTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
  insightsSub: { color: 'rgba(255,255,255,0.65)', marginTop: 4, lineHeight: 16 },
  insightsChevron: { color: 'rgba(255,255,255,0.55)', fontSize: 22, fontWeight: '800' },
  empty: { color: '#666', paddingVertical: 10 },
  row: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rowTitle: { fontWeight: '600', fontSize: 15, color: '#111' },
  rowSubtle: { color: '#666', marginTop: 2 },
  metric: { fontWeight: '600', color: '#111' },
});
