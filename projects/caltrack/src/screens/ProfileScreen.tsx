import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../styles/theme';
import { useAppTheme } from '../styles/appTheme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { loadEntries, loadSettings, saveSettings } from '../storage/store';
import { computeStreak } from '../utils/streak';
import { toDateKey } from '../utils/date';
import { exportCsv, exportJson, makeBundle } from '../utils/exportData';
import { cancelDailyReminder, scheduleDailyReminder, sendTestNotification } from '../utils/reminders';
import { DEFAULT_SETTINGS, type ReminderMode, type Settings } from '../types/models';
import type { HistoryStackParamList } from './HistoryScreen';

type Props = NativeStackScreenProps<HistoryStackParamList, 'Profile'>;

const REMINDER_MODES: { label: string; value: ReminderMode; desc: string }[] = [
  { label: 'Off', value: 'off', desc: 'No reminders' },
  { label: 'Daily', value: 'daily', desc: 'Daily local notification' },
  { label: 'Smart', value: 'smart', desc: 'Coming soon' },
];

export function ProfileScreen({ navigation }: Props) {
  const { scheme, setScheme, colors } = useAppTheme();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Profile',
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('History')} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
          <Ionicons name="time-outline" size={22} color={scheme === 'dark' ? 'rgba(255,255,255,0.72)' : 'rgba(17,17,17,0.65)'} />
        </Pressable>
      ),
    });
  }, [navigation, scheme]);

  const [draft, setDraft] = React.useState<Settings>(DEFAULT_SETTINGS);
  const [entriesCount, setEntriesCount] = React.useState(0);
  const [todayKcal, setTodayKcal] = React.useState(0);
  const [streak, setStreak] = React.useState({ current: 0, best: 0, daysThisWeek: 0 });

  const [openGoals, setOpenGoals] = React.useState(false);
  const [openPersonal, setOpenPersonal] = React.useState(false);
  const [openNotifications, setOpenNotifications] = React.useState(false);
  const [openLegal, setOpenLegal] = React.useState(false);
  const [openAppearance, setOpenAppearance] = React.useState(false);

  const [showAdvancedGoals, setShowAdvancedGoals] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const [s, e] = await Promise.all([loadSettings(), loadEntries()]);
      if (!alive) return;
      setDraft(s);
      setEntriesCount(e.length);
      const todayKey = toDateKey(new Date());
      setTodayKcal(e.filter((x) => x.dateKey === todayKey).reduce((acc, x) => acc + x.calories, 0));
      setStreak(computeStreak(e));
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function onSave() {
    const cleaned: Settings = {
      name: (draft.name || '').trim() || undefined,
      gender: draft.gender,
      age: draft.age,
      onboardingDone: draft.onboardingDone,
      themeMode: draft.themeMode || 'dark',
      caloriesGoal: Math.max(0, Math.round(draft.caloriesGoal || 0)),
      proteinGoal: Math.max(0, Math.round(draft.proteinGoal || 0)),
      fatGoal: Math.max(0, Math.round(draft.fatGoal || 0)),
      carbsGoal: Math.max(0, Math.round(draft.carbsGoal || 0)),
      fiberGoal: Math.max(0, Math.round(draft.fiberGoal || 0)),
      sugarGoal: Math.max(0, Math.round(draft.sugarGoal || 0)),
      cholesterolGoal: Math.max(0, Math.round(draft.cholesterolGoal || 0)),
      sodiumGoal: Math.max(0, Math.round(draft.sodiumGoal || 0)),
      // Keep stored wake/sleep for reminders internally, but don't show in UI.
      wakeTime: (draft.wakeTime || '07:00').slice(0, 5),
      sleepTime: (draft.sleepTime || '23:00').slice(0, 5),
      reminderMode: draft.reminderMode,
    };

    await saveSettings(cleaned);

    // Apply reminder setting (best-effort)
    try {
      if (cleaned.reminderMode === 'daily') {
        const r = await scheduleDailyReminder(cleaned.wakeTime);
        if (!r.ok) {
          Alert.alert('Saved', 'Profile saved (reminder permission denied).');
          return;
        }
      } else {
        await cancelDailyReminder();
      }
    } catch {
      // ignore
    }

    Alert.alert('Saved', 'Updated');
  }

  async function onExportJson() {
    try {
      const entries = await loadEntries();
      const bundle = makeBundle(draft, entries);
      const res = await exportJson(bundle);
      if (!res.ok) Alert.alert('Export unavailable', 'Sharing is not available on this device.');
    } catch {
      Alert.alert('Export failed', 'Could not export data.');
    }
  }

  async function onExportCsv() {
    try {
      const entries = await loadEntries();
      const res = await exportCsv(entries);
      if (!res.ok) Alert.alert('Export unavailable', 'Sharing is not available on this device.');
    } catch {
      Alert.alert('Export failed', 'Could not export data.');
    }
  }

  const displayName = draft.name || 'You';
  const username = `@${String(draft.name || 'user').toLowerCase().replace(/\s+/g, '') || 'user'}`;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={{ padding: 14, gap: 14 }}>
      <View style={[styles.igHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.igTopRow}>
          <View style={styles.igAvatar}>
            <Text style={styles.igAvatarTxt}>{String(displayName).slice(0, 1).toUpperCase()}</Text>
          </View>

          <View style={styles.igStats}>
            <View style={styles.igStat}>
              <Text style={[styles.igStatNum, { color: colors.text }]}>{streak.current}</Text>
              <Text style={[styles.igStatLbl, { color: colors.subtext }]}>Streak</Text>
            </View>
            <View style={styles.igStat}>
              <Text style={[styles.igStatNum, { color: colors.text }]}>{todayKcal}</Text>
              <Text style={[styles.igStatLbl, { color: colors.subtext }]}>Today kcal</Text>
            </View>
            <View style={styles.igStat}>
              <Text style={[styles.igStatNum, { color: colors.text }]}>{entriesCount}</Text>
              <Text style={[styles.igStatLbl, { color: colors.subtext }]}>Entries</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.igName, { color: colors.text }]}>{displayName}</Text>
        <Text style={[styles.igHandle, { color: colors.subtext }]}>{username}</Text>
        <Text style={[styles.igBio, { color: colors.subtext }]}>Local-first nutrition tracking • calories + protein + key micros</Text>

        <View style={styles.igPills}>
          <View style={styles.pill}>
            <Text style={styles.pillTxt}>{streak.daysThisWeek}/7 days this week</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillTxt}>Best streak: {streak.best}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable style={styles.sectionHeader} onPress={() => setOpenGoals((v) => !v)}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Goals</Text>
          <Text style={[styles.sectionMeta, { color: colors.subtext }]}>{openGoals ? 'Hide' : 'Show'}</Text>
        </Pressable>

        {openGoals ? (
          <View style={{ marginTop: 12, gap: 12 }}>
            <View style={styles.grid}>
              <View style={styles.field}>
                <Text style={styles.label}>Calories (kcal)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(draft.caloriesGoal)}
                  onChangeText={(t) => setDraft((s) => ({ ...s, caloriesGoal: Number(t.replace(/[^0-9]/g, '')) }))}
                  placeholder="2000"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Protein (g)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(draft.proteinGoal)}
                  onChangeText={(t) => setDraft((s) => ({ ...s, proteinGoal: Number(t.replace(/[^0-9]/g, '')) }))}
                  placeholder="120"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Carbs (g)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(draft.carbsGoal)}
                  onChangeText={(t) => setDraft((s) => ({ ...s, carbsGoal: Number(t.replace(/[^0-9]/g, '')) }))}
                  placeholder="275"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Fat (g)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(draft.fatGoal)}
                  onChangeText={(t) => setDraft((s) => ({ ...s, fatGoal: Number(t.replace(/[^0-9]/g, '')) }))}
                  placeholder="78"
                />
              </View>
            </View>

            <Pressable onPress={() => setShowAdvancedGoals((v) => !v)} style={styles.inlineToggle}>
              <Text style={styles.inlineToggleTxt}>{showAdvancedGoals ? 'Hide advanced' : 'Show advanced'}</Text>
              <Text style={styles.inlineToggleChevron}>{showAdvancedGoals ? '˄' : '˅'}</Text>
            </Pressable>

            {showAdvancedGoals ? (
              <View style={styles.grid}>
                <View style={styles.field}>
                  <Text style={styles.label}>Fiber (g)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={String(draft.fiberGoal)}
                    onChangeText={(t) => setDraft((s) => ({ ...s, fiberGoal: Number(t.replace(/[^0-9]/g, '')) }))}
                    placeholder="28"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Sugar (g)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={String(draft.sugarGoal)}
                    onChangeText={(t) => setDraft((s) => ({ ...s, sugarGoal: Number(t.replace(/[^0-9]/g, '')) }))}
                    placeholder="50"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Cholesterol (mg)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={String(draft.cholesterolGoal)}
                    onChangeText={(t) => setDraft((s) => ({ ...s, cholesterolGoal: Number(t.replace(/[^0-9]/g, '')) }))}
                    placeholder="300"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Sodium (mg)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={String(draft.sodiumGoal)}
                    onChangeText={(t) => setDraft((s) => ({ ...s, sodiumGoal: Number(t.replace(/[^0-9]/g, '')) }))}
                    placeholder="2300"
                  />
                </View>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>


      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable style={styles.sectionHeader} onPress={() => setOpenPersonal((v) => !v)}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal</Text>
          <Text style={[styles.sectionMeta, { color: colors.subtext }]}>{openPersonal ? 'Hide' : 'Show'}</Text>
        </Pressable>

        {openPersonal ? (
          <View style={{ marginTop: 12, gap: 12 }}>
            <View style={styles.field}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={draft.name || ''}
                onChangeText={(t) => setDraft((s) => ({ ...s, name: t }))}
                placeholder="Your name"
                autoCapitalize="words"
              />
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Gender</Text>
                <TextInput
                  style={styles.input}
                  value={draft.gender ? String(draft.gender) : ''}
                  onChangeText={(t) => setDraft((s) => ({ ...s, gender: (t || undefined) as any }))}
                  placeholder="female / male / other"
                  autoCapitalize="none"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                  style={styles.input}
                  value={draft.age ? String(draft.age) : ''}
                  onChangeText={(t) =>
                    setDraft((s) => ({ ...s, age: t.trim() ? Number(t.replace(/[^0-9]/g, '')) : undefined }))
                  }
                  placeholder="e.g. 28"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable style={styles.sectionHeader} onPress={() => setOpenNotifications((v) => !v)}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
          <Text style={[styles.sectionMeta, { color: colors.subtext }]}>{openNotifications ? 'Hide' : 'Show'}</Text>
        </Pressable>

        {openNotifications ? (
          <View style={{ marginTop: 12, gap: 12 }}>
            <View style={{ gap: 8 }}>
              {REMINDER_MODES.filter((m) => m.value !== 'smart').map((m) => {
                const selected = m.value === draft.reminderMode;
                return (
                  <Pressable
                    key={m.value}
                    onPress={() => setDraft((s) => ({ ...s, reminderMode: m.value }))}
                    style={[styles.modeRow, selected && styles.modeRowSelected]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modeTitle, selected && styles.modeTitleSelected]}>{m.label}</Text>
                      <Text style={[styles.modeDesc, selected && styles.modeDescSelected]}>{m.desc}</Text>
                    </View>
                    <Text style={[styles.modeCheck, selected && styles.modeCheckSelected]}>{selected ? '✓' : ''}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={[styles.linkRow, { borderTopWidth: 0 }]}
              onPress={async () => {
                try {
                  const r = await sendTestNotification();
                  if (!r.ok) {
                    Alert.alert('Permission needed', 'Enable notifications to receive reminders.');
                    return;
                  }
                  Alert.alert('Sent', 'Check your notifications.');
                } catch {
                  Alert.alert('Failed', 'Could not send test notification.');
                }
              }}
            >
              <Text style={[styles.linkTxt, { color: colors.text }]}>Send test notification</Text>
              <Text style={styles.linkChevron}>›</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable style={styles.sectionHeader} onPress={() => setOpenAppearance((v) => !v)}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          <Text style={[styles.sectionMeta, { color: colors.subtext }]}>{openAppearance ? 'Hide' : 'Show'}</Text>
        </Pressable>

        {openAppearance ? (
          <View style={{ marginTop: 12, gap: 8 }}>
            {([
              { label: 'Dark', value: 'dark' },
              { label: 'Light', value: 'light' },
              { label: 'Auto', value: 'auto' },
            ] as const).map((m) => {
              const selected = (draft.themeMode || 'dark') === m.value;
              return (
                <Pressable
                  key={m.value}
                  onPress={() => {
                    setDraft((s) => ({ ...s, themeMode: m.value }));
                    // Apply immediately (no restart)
                    if (m.value === 'dark' || m.value === 'light') {
                      setScheme(m.value);
                    } else {
                      const h = new Date().getHours();
                      setScheme(h >= 19 || h < 7 ? 'dark' : 'light');
                    }
                  }}
                  style={[styles.modeRow, selected && styles.modeRowSelected]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modeTitle, selected && styles.modeTitleSelected]}>{m.label}</Text>
                    <Text style={[styles.modeDesc, selected && styles.modeDescSelected]}>
                      {m.value === 'auto' ? 'Follow system / time' : `Always ${m.label.toLowerCase()}`}
                    </Text>
                  </View>
                  <Text style={[styles.modeCheck, selected && styles.modeCheckSelected]}>{selected ? '✓' : ''}</Text>
                </Pressable>
              );
            })}
            <Text style={{ color: 'rgba(17,17,17,0.55)', fontSize: 12 }}>
              Save to apply.
            </Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Export</Text>
        <Pressable style={styles.linkRow} onPress={onExportCsv}>
          <Text style={[styles.linkTxt, { color: colors.text }]}>Export CSV</Text>
          <Text style={styles.linkChevron}>›</Text>
        </Pressable>
        <Pressable style={styles.linkRow} onPress={onExportJson}>
          <Text style={[styles.linkTxt, { color: colors.text }]}>Export JSON</Text>
          <Text style={styles.linkChevron}>›</Text>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable style={styles.sectionHeader} onPress={() => setOpenLegal((v) => !v)}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Legal</Text>
          <Text style={[styles.sectionMeta, { color: colors.subtext }]}>{openLegal ? 'Hide' : 'Show'}</Text>
        </Pressable>

        {openLegal ? (
          <View style={{ marginTop: 12 }}>
            <Pressable style={[styles.linkRow, { borderTopWidth: 0 }]} onPress={() => navigation.navigate('Legal', { kind: 'terms' })}>
              <Text style={[styles.linkTxt, { color: colors.text }]}>Terms of Use</Text>
              <Text style={styles.linkChevron}>›</Text>
            </Pressable>
            <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Legal', { kind: 'privacy' })}>
              <Text style={[styles.linkTxt, { color: colors.text }]}>Privacy Policy</Text>
              <Text style={styles.linkChevron}>›</Text>
            </Pressable>
            <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Legal', { kind: 'faq' })}>
              <Text style={[styles.linkTxt, { color: colors.text }]}>FAQ</Text>
              <Text style={styles.linkChevron}>›</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={() => {
          // Apply immediately too
          const m = draft.themeMode || 'dark';
          if (m === 'dark' || m === 'light') setScheme(m);
          onSave();
        }}
        style={styles.saveBtn}
      >
        <Text style={styles.saveTxt}>Save</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  igHeader: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.10)',
  },
  igTopRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  igAvatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(236, 72, 153, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  igAvatarTxt: { color: '#9D174D', fontWeight: '700', fontSize: 30 },
  igStats: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  igStat: { alignItems: 'center', flex: 1 },
  igStatNum: { fontWeight: '700', color: '#111', fontSize: 18 },
  igStatLbl: { marginTop: 2, color: 'rgba(17,17,17,0.55)', fontWeight: '600', fontSize: 12 },
  igName: { marginTop: 12, fontWeight: '700', fontSize: 18, color: '#111' },
  igHandle: { marginTop: 2, color: 'rgba(17,17,17,0.55)', fontWeight: '600' },
  igBio: { marginTop: 10, color: 'rgba(17,17,17,0.72)', lineHeight: 18 },
  igPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  pill: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  pillTxt: { color: 'rgba(17,17,17,0.75)', fontWeight: '600' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 1,
  },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 10 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  sectionMeta: { color: 'rgba(17,17,17,0.45)', fontWeight: '700' },

  inlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  inlineToggleTxt: { color: '#111', fontWeight: '800' },
  inlineToggleChevron: { color: 'rgba(17,17,17,0.45)', fontSize: 18, fontWeight: '800' },

  advancedLink: { color: '#111', fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  field: { gap: 6, marginBottom: 0, flexGrow: 1, flexBasis: 160 },
  label: { fontWeight: '600', color: '#222' },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fafafa',
    fontSize: 16,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  modeRowSelected: { borderColor: 'rgba(236, 72, 153, 0.35)', backgroundColor: 'rgba(236, 72, 153, 0.18)' },
  modeTitle: { fontWeight: '600', color: '#111' },
  modeTitleSelected: { color: '#9D174D' },
  modeDesc: { color: '#666', marginTop: 2, fontSize: 12 },
  modeDescSelected: { color: 'rgba(157, 23, 77, 0.8)' },
  modeCheck: { width: 20, textAlign: 'right', color: '#111', fontWeight: '600' },
  modeCheckSelected: { color: '#9D174D' },
  saveBtn: {
    backgroundColor: COLORS.btnBg,
    borderColor: COLORS.btnBorder,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 30,
  },
  saveTxt: { color: COLORS.btnText, fontWeight: '600', fontSize: 16 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  linkTxt: { color: '#111', fontWeight: '600' },
  linkChevron: { color: 'rgba(17,17,17,0.45)', fontSize: 18, fontWeight: '600' },
});
