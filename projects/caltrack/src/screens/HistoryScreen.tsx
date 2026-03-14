import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
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

function Sparkline({ values }: { values: number[] }) {
  const w = 170;
  const h = 44;
  if (!values || values.length < 2) {
    return (
      <View style={styles.sparkEmpty}>
        <Text style={styles.sparkEmptyTxt}>Log a few days to see your trend.</Text>
      </View>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <Svg width={w} height={h}>
      <Polyline points={pts} fill="none" stroke="rgba(236, 72, 153, 0.9)" strokeWidth={3} />
    </Svg>
  );
}

export function HistoryScreen({ navigation }: Props) {
  const [rows, setRows] = React.useState<DayRow[]>([]);
  const [spark, setSpark] = React.useState<number[]>([]);

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

        // Sparkline: last 7 days calories (oldest -> newest)
        const last7 = list.slice(0, 7).reverse().map((r) => r.calories);

        if (!mounted) return;
        setRows(list);
        setSpark(last7);
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
          <Text style={styles.insightsSub}>See your last 7 days at a glance.</Text>

          <View style={{ marginTop: 10 }}>
            <Sparkline values={spark} />
          </View>
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
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.10)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  insightsTitle: { color: '#111', fontWeight: '700', fontSize: 16 },
  insightsSub: { color: 'rgba(17,17,17,0.60)', marginTop: 4, lineHeight: 16 },
  insightsChevron: { color: 'rgba(17,17,17,0.45)', fontSize: 22, fontWeight: '700' },
  sparkEmpty: {
    height: 44,
    justifyContent: 'center',
  },
  sparkEmptyTxt: { color: 'rgba(17,17,17,0.5)', fontSize: 12, fontWeight: '600' },
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
