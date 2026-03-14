import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Gender, Settings } from '../types/models';
import { loadSettings, saveSettings } from '../storage/store';
import { micronutrientDefaults } from '../utils/defaultGoals';
import { COLORS } from '../styles/theme';

type Step = 'name' | 'gender' | 'age' | 'done';

const GENDER_OPTIONS: Array<{ label: string; value: Gender }> = [
  { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];

export function OnboardingScreen({ onFinished }: { onFinished: () => void }) {
  const [step, setStep] = React.useState<Step>('name');
  const [settings, setSettings] = React.useState<Settings | null>(null);

  const [name, setName] = React.useState('');
  const [gender, setGender] = React.useState<Gender | undefined>(undefined);
  const [age, setAge] = React.useState('');

  React.useEffect(() => {
    (async () => {
      const s = await loadSettings();
      setSettings(s);
      setName(s.name || '');
      setGender(s.gender);
      setAge(s.age ? String(s.age) : '');
    })();
  }, []);

  function nextFromName() {
    const cleaned = name.trim();
    if (cleaned.length < 2) {
      Alert.alert('Name', 'Please enter your name.');
      return;
    }
    setName(cleaned);
    setStep('gender');
  }

  function nextFromGender() {
    if (!gender) {
      Alert.alert('Gender', 'Please choose one option.');
      return;
    }
    setStep('age');
  }

  async function finish() {
    const n = Number(age);
    if (!Number.isFinite(n) || n < 13 || n > 100) {
      Alert.alert('Age', 'Enter an age between 13 and 100.');
      return;
    }

    if (!settings) return;

    const micros = micronutrientDefaults({ gender, age: n });

    await saveSettings({
      ...settings,
      name: name.trim(),
      gender,
      age: Math.round(n),
      onboardingDone: true,
      ...micros,
    });

    onFinished();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 18, flexGrow: 1 }}>
      <View style={styles.centerWrap}>
        <Text style={styles.h1}>Welcome to CalTrack</Text>
        <Text style={styles.sub}>Quick setup. We’ll use this to prefill healthy default micronutrient goals.</Text>

      {step === 'name' ? (
        <View style={styles.card}>
          <Text style={styles.title}>What’s your name?</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Saroj"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={nextFromName}
          />
          <Pressable style={styles.primaryBtn} onPress={nextFromName}>
            <Text style={styles.primaryTxt}>Continue</Text>
          </Pressable>
        </View>
      ) : null}

      {step === 'gender' ? (
        <View style={styles.card}>
          <Text style={styles.title}>Gender</Text>
          <Text style={styles.muted}>Optional, but helps choose better defaults.</Text>
          <View style={{ marginTop: 10, gap: 10 }}>
            {GENDER_OPTIONS.map((o) => {
              const selected = gender === o.value;
              return (
                <Pressable
                  key={o.value}
                  onPress={() => setGender(o.value)}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{o.label}</Text>
                  <Text style={[styles.optionCheck, selected && styles.optionCheckSelected]}>{selected ? '✓' : ''}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable style={styles.primaryBtn} onPress={nextFromGender}>
            <Text style={styles.primaryTxt}>Continue</Text>
          </Pressable>
        </View>
      ) : null}

      {step === 'age' ? (
        <View style={styles.card}>
          <Text style={styles.title}>Age</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 28"
            value={age}
            onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            returnKeyType="done"
            onSubmitEditing={finish}
          />
          <Pressable style={styles.primaryBtn} onPress={finish}>
            <Text style={styles.primaryTxt}>Finish setup</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.footer}>Not medical advice. You can change goals anytime in Profile.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F1A' },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 18,
    paddingBottom: 18,
  },
  h1: { fontSize: 28, fontWeight: '900', color: '#fff' },
  sub: { marginTop: 8, color: 'rgba(255,255,255,0.68)', lineHeight: 20 },
  card: {
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  title: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 10 },
  muted: { color: 'rgba(255,255,255,0.60)', marginTop: -6 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 2,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 18,
  },
  primaryBtn: {
    marginTop: 14,
    backgroundColor: 'rgba(236, 72, 153, 0.95)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  optionSelected: { borderColor: 'rgba(236, 72, 153, 0.55)', backgroundColor: 'rgba(236, 72, 153, 0.14)' },
  optionText: { color: '#fff', fontWeight: '800' },
  optionTextSelected: { color: '#fff' },
  optionCheck: { width: 20, textAlign: 'right', color: 'rgba(255,255,255,0.85)', fontWeight: '900' },
  optionCheckSelected: { color: '#fff' },
  footer: { marginTop: 16, color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 16 },
});
