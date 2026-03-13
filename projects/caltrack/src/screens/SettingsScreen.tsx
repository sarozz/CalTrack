import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS } from '../styles/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { loadSettings, saveSettings } from '../storage/store';
import { DEFAULT_SETTINGS, type ReminderMode, type Settings } from '../types/models';
import type { HomeStackParamList } from './HomeScreen';

type Props = NativeStackScreenProps<HomeStackParamList, 'Settings'>;

const REMINDER_MODES: { label: string; value: ReminderMode; desc: string }[] = [
  { label: 'Off', value: 'off', desc: 'No reminders' },
  { label: 'Daily', value: 'daily', desc: 'Simple daily nudges' },
  { label: 'Smart', value: 'smart', desc: 'Demo mode (no push yet)' },
];

export function SettingsScreen({ navigation }: Props) {
  const [draft, setDraft] = React.useState<Settings>(DEFAULT_SETTINGS);

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
    Alert.alert('Saved', 'Goals updated');
    navigation.goBack();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 14, gap: 14 }}>
      <View style={styles.card}>
        <Text style={styles.title}>Goals</Text>
        <View style={styles.field}>
          <Text style={styles.label}>Calories goal (kcal)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(draft.caloriesGoal)}
            onChangeText={(t) => setDraft((s) => ({ ...s, caloriesGoal: Number(t.replace(/[^0-9]/g, '')) }))}
            placeholder="2000"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Protein goal (g)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(draft.proteinGoal)}
            onChangeText={(t) => setDraft((s) => ({ ...s, proteinGoal: Number(t.replace(/[^0-9]/g, '')) }))}
            placeholder="120"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Fat goal (g)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(draft.fatGoal)}
            onChangeText={(t) => setDraft((s) => ({ ...s, fatGoal: Number(t.replace(/[^0-9]/g, '')) }))}
            placeholder="78"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Carbs goal (g)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(draft.carbsGoal)}
            onChangeText={(t) => setDraft((s) => ({ ...s, carbsGoal: Number(t.replace(/[^0-9]/g, '')) }))}
            placeholder="275"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Fiber goal (g)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(draft.fiberGoal)}
            onChangeText={(t) => setDraft((s) => ({ ...s, fiberGoal: Number(t.replace(/[^0-9]/g, '')) }))}
            placeholder="28"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Sugar goal (g)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(draft.sugarGoal)}
            onChangeText={(t) => setDraft((s) => ({ ...s, sugarGoal: Number(t.replace(/[^0-9]/g, '')) }))}
            placeholder="50"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Cholesterol goal (mg)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(draft.cholesterolGoal)}
            onChangeText={(t) => setDraft((s) => ({ ...s, cholesterolGoal: Number(t.replace(/[^0-9]/g, '')) }))}
            placeholder="300"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Sodium goal (mg)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(draft.sodiumGoal)}
            onChangeText={(t) => setDraft((s) => ({ ...s, sodiumGoal: Number(t.replace(/[^0-9]/g, '')) }))}
            placeholder="2300"
          />
        </View>
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
        <Text style={styles.subtle}>For tonight's demo, reminder mode is stored only (no notifications).</Text>
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
  title: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  field: { gap: 6, marginBottom: 12 },
  label: { fontWeight: '700', color: '#222' },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fafafa',
    fontSize: 16,
  },
  subtle: { color: '#666', marginTop: -4 },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  modeRowSelected: { borderColor: '#6D28D9', backgroundColor: '#6D28D9' },
  modeTitle: { fontWeight: '800', color: '#111' },
  modeTitleSelected: { color: '#fff' },
  modeDesc: { color: '#666', marginTop: 2, fontSize: 12 },
  modeDescSelected: { color: 'rgba(255,255,255,0.85)' },
  modeCheck: { width: 20, textAlign: 'right', color: '#111', fontWeight: '900' },
  modeCheckSelected: { color: '#fff' },
  saveBtn: {
    backgroundColor: COLORS.btnBg,
    borderColor: COLORS.btnBorder,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 30,
  },
  saveTxt: { color: COLORS.btnText, fontWeight: '900', fontSize: 16 },
});
