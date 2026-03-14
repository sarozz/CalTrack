import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS } from '../styles/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { loadEntries, loadSettings, saveSettings } from '../storage/store';
import { exportCsv, exportJson, makeBundle } from '../utils/exportData';
import { cancelDailyReminder, scheduleDailyReminder, sendTestNotification } from '../utils/reminders';
import { DEFAULT_SETTINGS, type ReminderMode, type Settings } from '../types/models';
import type { HomeStackParamList } from './HomeScreen';

type Props = NativeStackScreenProps<HomeStackParamList, 'Profile'>;

const REMINDER_MODES: { label: string; value: ReminderMode; desc: string }[] = [
  { label: 'Off', value: 'off', desc: 'No reminders' },
  { label: 'Daily', value: 'daily', desc: 'Local notification every day at your Wake time' },
  { label: 'Smart', value: 'smart', desc: 'Coming soon' },
];

export function ProfileScreen({ navigation }: Props) {
  React.useLayoutEffect(() => {
    navigation.setOptions({ title: 'Profile' });
  }, [navigation]);

  const [draft, setDraft] = React.useState<Settings>(DEFAULT_SETTINGS);
  const [showAdvancedGoals, setShowAdvancedGoals] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const s = await loadSettings();
      setDraft(s);
    })();
  }, []);

  async function onSave() {
    const cleaned: Settings = {
      caloriesGoal: Math.max(0, Math.round(draft.caloriesGoal || 0)),
      proteinGoal: Math.max(0, Math.round(draft.proteinGoal || 0)),
      fatGoal: Math.max(0, Math.round(draft.fatGoal || 0)),
      carbsGoal: Math.max(0, Math.round(draft.carbsGoal || 0)),
      fiberGoal: Math.max(0, Math.round(draft.fiberGoal || 0)),
      sugarGoal: Math.max(0, Math.round(draft.sugarGoal || 0)),
      cholesterolGoal: Math.max(0, Math.round(draft.cholesterolGoal || 0)),
      sodiumGoal: Math.max(0, Math.round(draft.sodiumGoal || 0)),
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 14, gap: 14 }}>
      <View style={styles.card}>
        <Text style={styles.title}>Goals</Text>

        <View style={styles.grid}>
          <View style={styles.field}>
            <Text style={styles.label}>Calories (kcal)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(draft.caloriesGoal)}
              onChangeText={(t) =>
                setDraft((s) => ({ ...s, caloriesGoal: Number(t.replace(/[^0-9]/g, '')) }))
              }
              placeholder="2000"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Protein (g)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(draft.proteinGoal)}
              onChangeText={(t) =>
                setDraft((s) => ({ ...s, proteinGoal: Number(t.replace(/[^0-9]/g, '')) }))
              }
              placeholder="120"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Carbs (g)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(draft.carbsGoal)}
              onChangeText={(t) =>
                setDraft((s) => ({ ...s, carbsGoal: Number(t.replace(/[^0-9]/g, '')) }))
              }
              placeholder="275"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Fat (g)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(draft.fatGoal)}
              onChangeText={(t) =>
                setDraft((s) => ({ ...s, fatGoal: Number(t.replace(/[^0-9]/g, '')) }))
              }
              placeholder="78"
            />
          </View>
        </View>

        <Pressable
          onPress={() => setShowAdvancedGoals((v) => !v)}
          style={[styles.linkRow, { borderTopWidth: 0, paddingVertical: 10 }]}
        >
          <Text style={styles.advancedLink}>{showAdvancedGoals ? 'Hide advanced' : 'Show advanced'}</Text>
          <Text style={styles.linkChevron}>{showAdvancedGoals ? '˄' : '˅'}</Text>
        </Pressable>

        {showAdvancedGoals ? (
          <View style={styles.grid}>
            <View style={styles.field}>
              <Text style={styles.label}>Fiber (g)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(draft.fiberGoal)}
                onChangeText={(t) =>
                  setDraft((s) => ({ ...s, fiberGoal: Number(t.replace(/[^0-9]/g, '')) }))
                }
                placeholder="28"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Sugar (g)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(draft.sugarGoal)}
                onChangeText={(t) =>
                  setDraft((s) => ({ ...s, sugarGoal: Number(t.replace(/[^0-9]/g, '')) }))
                }
                placeholder="50"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Cholesterol (mg)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(draft.cholesterolGoal)}
                onChangeText={(t) =>
                  setDraft((s) => ({ ...s, cholesterolGoal: Number(t.replace(/[^0-9]/g, '')) }))
                }
                placeholder="300"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Sodium (mg)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(draft.sodiumGoal)}
                onChangeText={(t) =>
                  setDraft((s) => ({ ...s, sodiumGoal: Number(t.replace(/[^0-9]/g, '')) }))
                }
                placeholder="2300"
              />
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Day</Text>
        <View style={styles.field}>
          <Text style={styles.label}>Wake time (HH:MM)</Text>
          <TextInput
            style={styles.input}
            value={draft.wakeTime}
            onChangeText={(t) => setDraft((s) => ({ ...s, wakeTime: t }))}
            placeholder="07:00"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Sleep time (HH:MM)</Text>
          <TextInput
            style={styles.input}
            value={draft.sleepTime}
            onChangeText={(t) => setDraft((s) => ({ ...s, sleepTime: t }))}
            placeholder="23:00"
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Reminders</Text>
        <View style={{ gap: 8, marginTop: 8 }}>
          {REMINDER_MODES.map((m) => {
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
          style={[styles.linkRow, { borderTopWidth: 0, marginTop: 8 }]}
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
          <Text style={styles.linkTxt}>Send test notification</Text>
          <Text style={styles.linkChevron}>›</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Export</Text>
        <Pressable style={styles.linkRow} onPress={onExportCsv}>
          <Text style={styles.linkTxt}>Export CSV</Text>
          <Text style={styles.linkChevron}>›</Text>
        </Pressable>
        <Pressable style={styles.linkRow} onPress={onExportJson}>
          <Text style={styles.linkTxt}>Export JSON</Text>
          <Text style={styles.linkChevron}>›</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Legal</Text>
        <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Legal', { kind: 'terms' })}>
          <Text style={styles.linkTxt}>Terms of Use</Text>
          <Text style={styles.linkChevron}>›</Text>
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Legal', { kind: 'privacy' })}>
          <Text style={styles.linkTxt}>Privacy Policy</Text>
          <Text style={styles.linkChevron}>›</Text>
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Legal', { kind: 'faq' })}>
          <Text style={styles.linkTxt}>FAQ</Text>
          <Text style={styles.linkChevron}>›</Text>
        </Pressable>
      </View>

      <Pressable onPress={onSave} style={styles.saveBtn}>
        <Text style={styles.saveTxt}>Save</Text>
      </Pressable>
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
  title: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  advancedLink: { color: '#111', fontWeight: '600' },
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
