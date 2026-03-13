import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { loadEntries, loadSettings } from '../storage/store';
import type { Entry, Settings } from '../types/models';
import type { HistoryStackParamList } from './HistoryScreen';

type Props = NativeStackScreenProps<HistoryStackParamList, 'Insights'>;

type DayTotals = {
  dateKey: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar: number;
  cholesterol: number;
  sodium: number;
};

function lastNDaysKeys(n: number) {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    const yyyy = x.getFullYear();
    const mm = String(x.getMonth() + 1).padStart(2, '0');
    const dd = String(x.getDate()).padStart(2, '0');
    out.push(`${yyyy}-${mm}-${dd}`);
  }
  return out;
}

function sum(entries: Entry[], dateKey: string): DayTotals {
  const day = entries.filter((e) => e.dateKey === dateKey);
  return day.reduce(
    (acc, e) => {
      acc.calories += e.calories;
      acc.protein += e.protein;
      acc.fat += e.fat || 0;
      acc.carbs += e.carbs || 0;
      acc.fiber += e.fiber || 0;
      acc.sugar += e.sugar || 0;
      acc.cholesterol += e.cholesterol || 0;
      acc.sodium += e.sodium || 0;
      return acc;
    },
    { dateKey, calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sugar: 0, cholesterol: 0, sodium: 0 }
  );
}

function avg(days: DayTotals[]) {
  const n = Math.max(1, days.length);
  const s = days.reduce(
    (acc, d) => {
      acc.calories += d.calories;
      acc.protein += d.protein;
      acc.fat += d.fat;
      acc.carbs += d.carbs;
      acc.fiber += d.fiber;
      acc.sugar += d.sugar;
      acc.cholesterol += d.cholesterol;
      acc.sodium += d.sodium;
      return acc;
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sugar: 0, cholesterol: 0, sodium: 0 }
  );
  return Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v / n])) as any;
}

function BarRow({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min(1, value / goal) : 0;
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.rowLine}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowVal}>
          {Math.round(value)} / {goal > 0 ? Math.round(goal) : '—'}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(pct * 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function InsightsScreen({ navigation }: Props) {
  const [settings, setSettings] = React.useState<Settings | null>(null);
  const [days, setDays] = React.useState<DayTotals[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      let alive = true;
      (async () => {
        const [entries, s] = await Promise.all([loadEntries(), loadSettings()]);
        if (!alive) return;
        setSettings(s);

        const keys = lastNDaysKeys(7).reverse();
        const totals = keys.map((k) => sum(entries, k));
        setDays(totals);
      })();
      return () => {
        alive = false;
      };
    }, [])
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: 'Weekly Insights' });
  }, [navigation]);

  const a = avg(days);

  const bestDay = days.slice().sort((x, y) => y.protein - x.protein)[0];
  const mostOver = settings
    ? days
        .slice()
        .sort((x, y) => (y.calories - settings.caloriesGoal) - (x.calories - settings.caloriesGoal))[0]
    : undefined;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 14, gap: 12 }}>
      <View style={styles.card}>
        <Text style={styles.title}>7‑day average</Text>
        <Text style={styles.big}>{Math.round(a.calories)} kcal</Text>
        <Text style={styles.sub}>{Math.round(a.protein)} g protein</Text>
      </View>

      {!!settings ? (
        <View style={styles.card}>
          <Text style={styles.title}>Goals progress (avg)</Text>
          <View style={{ gap: 12, marginTop: 10 }}>
            <BarRow label="Calories" value={a.calories} goal={settings.caloriesGoal} color={'rgba(236, 72, 153, 0.55)'} />
            <BarRow label="Protein" value={a.protein} goal={settings.proteinGoal} color={'rgba(34, 197, 94, 0.65)'} />
            <BarRow label="Fat" value={a.fat} goal={settings.fatGoal} color={'rgba(244, 63, 94, 0.55)'} />
            <BarRow label="Carbs" value={a.carbs} goal={settings.carbsGoal} color={'rgba(14, 165, 233, 0.55)'} />
            <BarRow label="Fiber" value={a.fiber} goal={settings.fiberGoal} color={'rgba(34, 197, 94, 0.55)'} />
            <BarRow label="Sugar" value={a.sugar} goal={settings.sugarGoal} color={'rgba(245, 158, 11, 0.55)'} />
            <BarRow label="Cholesterol" value={a.cholesterol} goal={settings.cholesterolGoal} color={'rgba(168, 85, 247, 0.55)'} />
            <BarRow label="Sodium" value={a.sodium} goal={settings.sodiumGoal} color={'rgba(100, 116, 139, 0.55)'} />
          </View>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.title}>Highlights</Text>
        <Text style={styles.bullet}>Best protein day: {bestDay?.dateKey || '—'} ({bestDay ? bestDay.protein : 0} g)</Text>
        <Text style={styles.bullet}>Highest calories day: {mostOver?.dateKey || '—'} ({mostOver ? mostOver.calories : 0} kcal)</Text>
        <Text style={styles.subtle}>Tip: tap any day in History to see details.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Last 7 days (calories)</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 12 }}>
          {days.map((d) => {
            const max = Math.max(...days.map((x) => x.calories), 1);
            const h = Math.max(6, Math.round((d.calories / max) * 120));
            return (
              <View key={d.dateKey} style={{ alignItems: 'center', gap: 6 }}>
                <View style={[styles.dayBar, { height: h }]} />
                <Text style={styles.dayLabel}>{d.dateKey.slice(5)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f6' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  title: { fontSize: 16, fontWeight: '600', color: '#111' },
  big: { fontSize: 26, fontWeight: '600', marginTop: 8, color: '#111' },
  sub: { marginTop: 6, color: 'rgba(17,17,17,0.65)' },
  subtle: { marginTop: 10, color: 'rgba(17,17,17,0.55)' },
  bullet: { marginTop: 10, color: '#111' },
  rowLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  rowLabel: { color: '#111' },
  rowVal: { color: 'rgba(17,17,17,0.55)' },
  track: { height: 10, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  fill: { height: 10, borderRadius: 999 },
  dayBar: { width: 16, borderRadius: 8, backgroundColor: 'rgba(236, 72, 153, 0.35)' },
  dayLabel: { fontSize: 11, color: 'rgba(17,17,17,0.55)' },
});
