import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { loadEntries } from '../storage/store';
import type { Entry } from '../types/models';
import { formatDateLabel } from '../utils/date';

export type HistoryStackParamList = {
  History: undefined;
  DayDetail: { dateKey: string };
  EditEntry: { id: string };
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
