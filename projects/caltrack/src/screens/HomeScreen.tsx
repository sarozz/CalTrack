import React from 'react';
import { Alert, Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MultiRing } from '../components/MultiRing';
import { AnimatedRing } from '../components/AnimatedRing';
import { COLORS } from '../styles/theme';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { addEntry, deleteEntry, loadEntries, loadSettings } from '../storage/store';
import type { Entry, Settings } from '../types/models';
import { formatTime, toDateKey } from '../utils/date';
import { computeStreak } from '../utils/streak';

export type HomeStackParamList = {
  Home: undefined;
  Profile: undefined;
  Legal: { kind: 'terms' | 'privacy' | 'faq' };
  EditEntry: { id: string };
};

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [settings, setSettings] = React.useState<Settings | null>(null);
  const feedAnim = React.useRef(new Animated.Value(0)).current;
  const [breakdown, setBreakdown] = React.useState<null | {
    key: 'calories' | 'protein' | 'fat' | 'carbs' | 'fiber' | 'sugar' | 'cholesterol' | 'sodium';
    title: string;
    unit: string;
  }>(null);

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      (async () => {
        const [e, s] = await Promise.all([loadEntries(), loadSettings()]);
        if (!mounted) return;
        setEntries(e);
        setSettings(s);
        Animated.timing(feedAnim, {
          toValue: 1,
          duration: 260,
          easing: (t) => t,
          useNativeDriver: true,
        }).start();
      })();
      return () => {
        mounted = false;
      };
    }, [])
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Pressable
            onPress={async () => {
              if (!entries.length) {
                navigation.getParent()?.navigate('LogTab' as never);
                return;
              }
              const last = entries[0];
              const createdAt = Date.now();
              await addEntry({
                ...last,
                id: `${createdAt}_${Math.random().toString(16).slice(2)}`,
                createdAt,
                dateKey: toDateKey(new Date(createdAt)),
              });
            }}
            style={styles.headerBtn}
          >
            <Text style={styles.headerBtnText}>Repeat</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Profile')} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Profile</Text>
          </Pressable>
        </View>
      ),
    });
  }, [navigation, entries]);

  const todayKey = toDateKey(new Date());
  const todays = entries.filter((e) => e.dateKey === todayKey);
  const totals = todays.reduce(
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
    { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sugar: 0, cholesterol: 0, sodium: 0 }
  );

  const calGoal = settings?.caloriesGoal ?? 0;
  const proGoal = settings?.proteinGoal ?? 0;
  const calLeft = Math.max(0, Math.round(calGoal - totals.calories));
  const proLeft = Math.max(0, Math.round(proGoal - totals.protein));

  const fatGoal = settings?.fatGoal ?? 0;
  const carbsGoal = settings?.carbsGoal ?? 0;
  const fiberGoal = settings?.fiberGoal ?? 0;
  const sugarGoal = settings?.sugarGoal ?? 0;
  const cholGoal = settings?.cholesterolGoal ?? 0;
  const sodiumGoal = settings?.sodiumGoal ?? 0;

  const breakdownRows = React.useMemo(() => {
    if (!breakdown) return [] as Array<{ id: string; label: string; value: number }>;
    const key = breakdown.key;
    const rows = todays
      .map((e) => {
        const v = Number((e as any)[key] || 0);
        const label = (e.caption || e.rawText || e.meal || 'Food').split('\n')[0].trim();
        return { id: e.id, label, value: v };
      })
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
    return rows;
  }, [breakdown, todays]);

  const calProgress = calGoal > 0 ? totals.calories / calGoal : 0;
  const proProgress = proGoal > 0 ? totals.protein / proGoal : 0;

  const streak = computeStreak(entries);

  return (
    <View style={styles.container}>
      {breakdown ? (
        <View style={styles.modalWrap}>
          <Pressable style={styles.backdrop} onPress={() => setBreakdown(null)} />
          <View style={styles.modalCardModern}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{breakdown.title}</Text>
                <Text style={styles.modalSub}>Top sources today</Text>
              </View>
              <Pressable onPress={() => setBreakdown(null)} style={styles.modalX}>
                <Text style={styles.modalXTxt}>✕</Text>
              </Pressable>
            </View>

            {breakdownRows.length === 0 ? (
              <Text style={styles.modalEmpty}>No data yet.</Text>
            ) : (
              <View style={{ marginTop: 12, gap: 10 }}>
                {breakdownRows.slice(0, 8).map((r) => (
                  <View key={r.id} style={styles.modalRowModern}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalRowLabel} numberOfLines={1}>
                        {r.label}
                      </Text>
                    </View>
                    <Text style={styles.modalRowVal}>
                      {Math.round(r.value)}{breakdown.unit}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Pressable onPress={() => setBreakdown(null)} style={[styles.modalBtn, { marginTop: 14 }]}>
              <Text style={styles.modalBtnTxt}>Done</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.card}>
        <View style={styles.todayHeader}>
          <Text style={styles.title}>Today</Text>
          <Text style={styles.streakMini}>
            {streak.current}🔥 · {streak.daysThisWeek}/7
          </Text>
        </View>

        <Pressable
          style={{ alignItems: 'center', marginTop: 8, marginBottom: 8 }}
          onPress={() => setBreakdown({ key: 'calories', title: 'Calories (kcal)', unit: ' kcal' })}
        >
          <MultiRing
            size={258}
            outerStroke={30}
            innerStroke={20}
            outerProgress={calProgress}
            innerProgress={proProgress}
            outerColor={'rgba(236, 72, 153, 0.55)'}
            innerColor={COLORS.green}
            centerTitle={`${totals.calories} kcal`}
            centerSub={calGoal ? `Goal ${calGoal} kcal\nProtein ${totals.protein}/${proGoal || '—'}g` : `Protein ${totals.protein}/${proGoal || '—'}g`}
          />
        </Pressable>

        <View style={styles.bigLegendRow}>
          <View style={styles.bigLegendItem}>
            <View style={[styles.bigDot, { backgroundColor: 'rgba(236, 72, 153, 0.55)' }]} />
            <Text style={styles.bigLegendTxt}>Calories</Text>
          </View>
          <View style={styles.bigLegendItem}>
            <View style={[styles.bigDot, { backgroundColor: COLORS.green }]} />
            <Text style={styles.bigLegendTxt}>Protein</Text>
          </View>
        </View>

        <View style={styles.leftRow}>
          <Text style={styles.leftTxt}>{calGoal ? `${calLeft} kcal left` : 'Set a calorie goal in Profile'}</Text>
          <Text style={styles.leftTxt}>{proGoal ? `${proLeft}g protein left` : ''}</Text>
        </View>

        <View style={styles.microGrid}>
          <Pressable onPress={() => setBreakdown({ key: 'fat', title: 'Fat (g)', unit: 'g' })}>
            <AnimatedRing
              label="Fat"
              valueText={`${Math.round(totals.fat)}g`}
              subText={fatGoal ? `/ ${fatGoal}g` : undefined}
              progress={fatGoal ? totals.fat / fatGoal : 0}
              color={'rgba(244, 63, 94, 0.55)'}
              size={92}
              stroke={11}
            />
          </Pressable>
          <Pressable onPress={() => setBreakdown({ key: 'carbs', title: 'Carbs (g)', unit: 'g' })}>
            <AnimatedRing
              label="Carbs"
              valueText={`${Math.round(totals.carbs)}g`}
              subText={carbsGoal ? `/ ${carbsGoal}g` : undefined}
              progress={carbsGoal ? totals.carbs / carbsGoal : 0}
              color={'rgba(14, 165, 233, 0.55)'}
              size={92}
              stroke={11}
            />
          </Pressable>
          <Pressable onPress={() => setBreakdown({ key: 'fiber', title: 'Fiber (g)', unit: 'g' })}>
            <AnimatedRing
              label="Fiber"
              valueText={`${Math.round(totals.fiber)}g`}
              subText={fiberGoal ? `/ ${fiberGoal}g` : undefined}
              progress={fiberGoal ? totals.fiber / fiberGoal : 0}
              color={'rgba(34, 197, 94, 0.55)'}
              size={92}
              stroke={11}
            />
          </Pressable>
          <Pressable onPress={() => setBreakdown({ key: 'sugar', title: 'Sugar (g)', unit: 'g' })}>
            <AnimatedRing
              label="Sugar"
              valueText={`${Math.round(totals.sugar)}g`}
              subText={sugarGoal ? `/ ${sugarGoal}g` : undefined}
              progress={sugarGoal ? totals.sugar / sugarGoal : 0}
              color={'rgba(245, 158, 11, 0.55)'}
              size={92}
              stroke={11}
            />
          </Pressable>
          <Pressable onPress={() => setBreakdown({ key: 'cholesterol', title: 'Cholesterol (mg)', unit: 'mg' })}>
            <AnimatedRing
              label="Chol"
              valueText={`${Math.round(totals.cholesterol)}mg`}
              subText={cholGoal ? `/ ${cholGoal}mg` : undefined}
              progress={cholGoal ? totals.cholesterol / cholGoal : 0}
              color={'rgba(168, 85, 247, 0.55)'}
              size={92}
              stroke={11}
            />
          </Pressable>
          <Pressable onPress={() => setBreakdown({ key: 'sodium', title: 'Sodium (mg)', unit: 'mg' })}>
            <AnimatedRing
              label="Sodium"
              valueText={`${Math.round(totals.sodium)}mg`}
              subText={sodiumGoal ? `/ ${sodiumGoal}mg` : undefined}
              progress={sodiumGoal ? totals.sodium / sodiumGoal : 0}
              color={'rgba(100, 116, 139, 0.55)'}
              size={92}
              stroke={11}
            />
          </Pressable>
        </View>
      </View>

      <Text style={styles.section}>Today feed</Text>
      <FlatList
        data={todays}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>No entries yet.</Text>
            <Pressable
              style={styles.emptyCta}
              onPress={() => navigation.getParent()?.navigate('LogTab' as never)}
            >
              <Text style={styles.emptyCtaTxt}>Log your first meal</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item, index }) => {
          const t = Math.min(1, Math.max(0, (index + 1) / 8));
          const rowOpacity = feedAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
          const rowTranslate = feedAnim.interpolate({ inputRange: [0, 1], outputRange: [12 * (1 - t), 0] });
          return (
            <Animated.View style={{ opacity: rowOpacity, transform: [{ translateY: rowTranslate }] }}>
              <Pressable
                style={styles.row}
                onPress={() => navigation.navigate('EditEntry', { id: item.id })}
                onLongPress={() => {
                  Alert.alert('Entry', 'What do you want to do?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Edit', onPress: () => navigation.navigate('EditEntry', { id: item.id }) },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        await deleteEntry(item.id);
                        const [e, s] = await Promise.all([loadEntries(), loadSettings()]);
                        setEntries(e);
                        setSettings(s);
                      },
                    },
                  ]);
                }}
              >
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
            </Animated.View>
          );
        }}
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
  todayHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 },
  streakMini: { color: 'rgba(17,17,17,0.55)', fontWeight: '800' },

  title: { fontSize: 16, fontWeight: '600', marginBottom: 0, color: '#111' },
  big: { fontSize: 18, fontWeight: '600', marginTop: 4 },
  subtle: { marginTop: 10, color: '#666' },
  bigLegendRow: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: 8 },
  bigLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bigDot: { width: 10, height: 10, borderRadius: 10 },
  bigLegendTxt: { color: 'rgba(17,17,17,0.55)', fontWeight: '600' },
  leftRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -2, marginBottom: 10 },
  leftTxt: { color: 'rgba(17,17,17,0.6)', fontWeight: '700' },

  microGrid: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  section: { fontWeight: '600', fontSize: 14, marginTop: 4 },
  emptyWrap: { alignItems: 'center', paddingVertical: 18, gap: 10 },
  empty: { color: '#666' },
  emptyCta: {
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(236, 72, 153, 0.35)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  emptyCtaTxt: { color: '#9D174D', fontWeight: '800' },
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
  headerBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  headerBtnText: { color: 'rgba(236, 72, 153, 0.9)', fontWeight: '600' },

  // Modal
  modalWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', padding: 14, zIndex: 50 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#111' },
  modalSub: { marginTop: 4, color: 'rgba(17,17,17,0.55)', fontWeight: '600' },
  modalEmpty: { marginTop: 10, color: 'rgba(17,17,17,0.55)' },

  modalCardModern: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.10)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalX: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  modalXTxt: { fontSize: 16, fontWeight: '600', color: 'rgba(17,17,17,0.7)' },

  modalRowModern: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  modalRowLabel: { flex: 1, fontWeight: '600', color: '#111' },
  modalRowVal: { fontWeight: '600', color: 'rgba(17,17,17,0.65)' },
  modalBtn: {
    backgroundColor: COLORS.btnBg,
    borderColor: COLORS.btnBorder,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalBtnTxt: { color: COLORS.btnText, fontWeight: '600', fontSize: 16 },
});
