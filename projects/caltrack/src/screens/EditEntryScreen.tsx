import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { deleteEntry, loadEntries, updateEntry } from '../storage/store';
import type { Entry, Meal } from '../types/models';
import { MealPicker } from '../components/MealPicker';
import { recommendEmoji } from '../utils/recommendEmoji';
import { parseNutritionFromText } from '../utils/nutrition';

export function EditEntryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id: string | undefined = route.params?.id;

  const [entry, setEntry] = React.useState<Entry | null>(null);
  const [rawText, setRawText] = React.useState('');
  const [meal, setMeal] = React.useState<Meal>('Lunch');
  const [calories, setCalories] = React.useState('');
  const [protein, setProtein] = React.useState('');
  const [caption, setCaption] = React.useState('');

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!id) return;
      const all = await loadEntries();
      const found = all.find((e) => e.id === id) || null;
      if (!alive) return;
      setEntry(found);
      if (!found) return;
      setRawText(found.rawText || '');
      setCaption(found.caption || '');
      setMeal(found.meal);
      setCalories(String(found.calories));
      setProtein(String(found.protein));
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  React.useEffect(() => {
    const parsed = parseNutritionFromText(rawText);
    if (parsed.calories != null && !calories) setCalories(String(parsed.calories));
    if (parsed.protein != null && !protein) setProtein(String(parsed.protein));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawText]);

  async function onSave() {
    if (!entry) return;
    const c = Number(calories);
    const p = Number(protein);
    if (!Number.isFinite(c) || c <= 0) {
      Alert.alert('Calories required', 'Enter calories (number).');
      return;
    }
    if (!Number.isFinite(p) || p < 0) {
      Alert.alert('Protein required', 'Enter protein grams (number).');
      return;
    }

    const cleanedCaption = caption.trim() ? caption.trim() : undefined;
    const cleanedRaw = rawText.trim() ? rawText.trim() : undefined;
    const hasBarcode = (cleanedRaw || '').toLowerCase().includes('barcode:');
    const emoji = recommendEmoji({ meal, text: `${cleanedCaption || ''} ${cleanedRaw || ''}`, hasBarcode });

    await updateEntry(entry.id, {
      meal,
      caption: cleanedCaption,
      rawText: cleanedRaw,
      calories: Math.round(c),
      protein: Math.round(p),
      emoji,
    });

    Alert.alert('Saved', 'Entry updated');
    navigation.goBack();
  }

  async function onDelete() {
    if (!entry) return;
    Alert.alert('Delete entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteEntry(entry.id);
          navigation.goBack();
        },
      },
    ]);
  }

  if (!id) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Missing entry id</Text>
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 14, gap: 12 }}>
      <View style={styles.card}>
        <Text style={styles.title}>Meal</Text>
        <MealPicker value={meal} onChange={setMeal} />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Quick log</Text>
        <TextInput
          style={[styles.input, { height: 92, textAlignVertical: 'top' }]}
          placeholder="e.g. Chicken rice bowl 650c 35p"
          value={rawText}
          onChangeText={setRawText}
          multiline
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Nutrition</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Calories (kcal)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={calories}
              onChangeText={(t) => setCalories(t.replace(/[^0-9]/g, ''))}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Protein (g)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={protein}
              onChangeText={(t) => setProtein(t.replace(/[^0-9]/g, ''))}
            />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Caption</Text>
        <TextInput style={styles.input} placeholder="e.g. felt great after this" value={caption} onChangeText={setCaption} />
      </View>

      <Pressable onPress={onSave} style={styles.primaryBtn}>
        <Text style={styles.primaryTxt}>Save changes</Text>
      </Pressable>
      <Pressable onPress={onDelete} style={styles.dangerBtn}>
        <Text style={styles.dangerTxt}>Delete entry</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f6' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6f6f6' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  title: { fontSize: 16, fontWeight: '900', marginBottom: 10, color: '#111' },
  label: { fontWeight: '800', color: '#222', marginBottom: 6 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fafafa',
    fontSize: 16,
  },
  row: { flexDirection: 'row', gap: 10 },
  primaryBtn: {
    backgroundColor: 'rgba(236, 72, 153, 0.18)',
    borderColor: 'rgba(236, 72, 153, 0.35)',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryTxt: { color: '#9D174D', fontWeight: '900', fontSize: 16 },
  dangerBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    marginBottom: 30,
  },
  dangerTxt: { color: '#b91c1c', fontWeight: '900', fontSize: 16 },
});
