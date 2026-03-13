import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { addEntry } from '../storage/store';
import type { Entry, Meal } from '../types/models';
import { EmojiPicker } from '../components/EmojiPicker';
import { MealPicker } from '../components/MealPicker';
import { toDateKey } from '../utils/date';
import { autoMealFromTime, parseNutritionFromText } from '../utils/nutrition';
import { lookupOpenFoodFacts } from '../utils/openfoodfacts';

function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function LogScreen() {
  const navigation = useNavigation<any>();

  const now = React.useMemo(() => new Date(), []);
  const [rawText, setRawText] = React.useState('');
  const [emoji, setEmoji] = React.useState<string | undefined>(undefined);
  const [meal, setMeal] = React.useState<Meal>(autoMealFromTime(now));
  const [calories, setCalories] = React.useState<string>('');
  const [protein, setProtein] = React.useState<string>('');
  const [caption, setCaption] = React.useState<string>('');
  const [barcodeLoading, setBarcodeLoading] = React.useState(false);

  React.useEffect(() => {
    const parsed = parseNutritionFromText(rawText);
    if (parsed.calories != null && !calories) setCalories(String(parsed.calories));
    if (parsed.protein != null && !protein) setProtein(String(parsed.protein));
    // only auto-fill once (keep user overrides)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawText]);

  async function onSave() {
    if (!emoji) {
      Alert.alert('Pick a tag', 'Please select an emoji tag.');
      return;
    }
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

    const createdAt = Date.now();
    const entry: Entry = {
      id: makeId(),
      createdAt,
      dateKey: toDateKey(new Date(createdAt)),
      meal,
      emoji,
      caption: caption.trim() ? caption.trim() : undefined,
      rawText: rawText.trim() ? rawText.trim() : undefined,
      calories: Math.round(c),
      protein: Math.round(p),
    };

    await addEntry(entry);
    Alert.alert('Saved', 'Added to today');

    // Reset form for quick consecutive logging
    setRawText('');
    setCalories('');
    setProtein('');
    setCaption('');
    setEmoji(undefined);

    // Jump back to Home so dashboard/feed updates on focus
    navigation.navigate('HomeTab', { screen: 'Home' });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 14, gap: 12 }}>
      <View style={styles.card}>
        <Text style={styles.title}>Quick log</Text>
        <Text style={styles.subtle}>Text mode demo: enter food + (optional) numbers like "650c 30p".</Text>
        <TextInput
          style={[styles.input, { height: 92, textAlignVertical: 'top' }]}
          placeholder="e.g. Chicken rice bowl 650c 35p"
          value={rawText}
          onChangeText={setRawText}
          multiline
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Meal</Text>
        <MealPicker value={meal} onChange={setMeal} />
        <Text style={styles.subtle}>Auto-detected from time; override if needed.</Text>
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
              placeholder="650"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Protein (g)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={protein}
              onChangeText={(t) => setProtein(t.replace(/[^0-9]/g, ''))}
              placeholder="35"
            />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Tag (required)</Text>
        <EmojiPicker value={emoji} onChange={setEmoji} />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Caption (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. felt great after this"
          value={caption}
          onChangeText={setCaption}
        />
      </View>

      <View style={styles.row}>
        <Pressable
          onPress={() =>
            navigation.navigate('BarcodeScan', {
              onScanned: async (data: string) => {
                setBarcodeLoading(true);
                try {
                  const facts = await lookupOpenFoodFacts(data);
                  const name = facts?.name ? String(facts.name).trim() : '';

                  // Always record the barcode in raw text for traceability.
                  setRawText((prev) => {
                    const base = prev?.trim() ? prev.trim() + '\n' : '';
                    const title = name ? `name: ${name}\n` : '';
                    return `${base}${title}barcode: ${data}`;
                  });

                  if (facts?.calories != null && !calories) setCalories(String(Math.round(facts.calories)));
                  if (facts?.protein != null && !protein) setProtein(String(Math.round(facts.protein)));

                  if (!facts) {
                    Alert.alert('Not found', 'No product found for this barcode.');
                  } else if (facts.calories == null && facts.protein == null) {
                    Alert.alert('No nutrition data', 'Found product but no calories/protein in OpenFoodFacts.');
                  } else if (facts.source === '100g') {
                    Alert.alert('Loaded (per 100g)', 'Calories/protein filled from OpenFoodFacts per 100g.');
                  } else {
                    Alert.alert('Loaded', 'Calories/protein filled from OpenFoodFacts per serving.');
                  }
                } catch {
                  Alert.alert('Lookup failed', 'Could not fetch nutrition details. Try again.');
                } finally {
                  setBarcodeLoading(false);
                }
              },
            })
          }
          style={[styles.actionBtn, { backgroundColor: '#6D28D9', opacity: barcodeLoading ? 0.6 : 1 }]}
          disabled={barcodeLoading}
        >
          <Text style={styles.actionTxt}>{barcodeLoading ? 'Loading…' : 'Scan barcode'}</Text>
        </Pressable>

        <Pressable onPress={onSave} style={[styles.actionBtn, { backgroundColor: '#6D28D9' }]}>
          <Text style={styles.actionTxt}>Save entry</Text>
        </Pressable>
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
  title: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  subtle: { color: '#666', marginTop: -6, marginBottom: 10 },
  label: { fontWeight: '700', color: '#222', marginBottom: 6 },
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
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 40,
  },
  actionTxt: { color: '#fff', fontWeight: '900', fontSize: 16 },
});
