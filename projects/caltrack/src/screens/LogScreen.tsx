import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { addEntry, loadEntries } from '../storage/store';
import type { Entry, Meal } from '../types/models';
import { recommendEmoji } from '../utils/recommendEmoji';
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
  const [meal, setMeal] = React.useState<Meal>(autoMealFromTime(now));
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
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

  // Autocomplete from history (local, free, works offline)
  React.useEffect(() => {
    let alive = true;
    (async () => {
      const entries = await loadEntries();
      if (!alive) return;

      const pool = entries
        .map((e) => (e.caption || e.rawText || '').split('\n')[0].trim())
        .filter(Boolean);

      const uniq: string[] = [];
      const seen = new Set<string>();
      for (const s of pool) {
        const k = s.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        uniq.push(s);
        if (uniq.length >= 200) break;
      }

      setSuggestions(uniq);
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function onSave() {
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
    const cleanedCaption = caption.trim() ? caption.trim() : undefined;
    const cleanedRaw = rawText.trim() ? rawText.trim() : undefined;

    const hasBarcode = (cleanedRaw || '').toLowerCase().includes('barcode:');
    const emoji = recommendEmoji({ meal, text: `${cleanedCaption || ''} ${cleanedRaw || ''}`, hasBarcode });

    const entry: Entry = {
      id: makeId(),
      createdAt,
      dateKey: toDateKey(new Date(createdAt)),
      meal,
      emoji,
      caption: cleanedCaption,
      rawText: cleanedRaw,
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

    // Jump back to Home so dashboard/feed updates on focus
    navigation.navigate('HomeTab', { screen: 'Home' });
  }

  const filtered = rawText.trim()
    ? suggestions
        .filter((s) => s.toLowerCase().includes(rawText.trim().toLowerCase()))
        .slice(0, 6)
    : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 14, gap: 12 }}>
      <Pressable
        onPress={() =>
          navigation.navigate('BarcodeScan', {
            onScanned: async (data: string) => {
              setBarcodeLoading(true);
              try {
                const facts = await lookupOpenFoodFacts(data);
                const name = facts?.name ? String(facts.name).trim() : '';

                // Always record barcode for traceability.
                setRawText((prev) => {
                  const base = prev?.trim() ? prev.trim() + '\n' : '';
                  const title = name ? `name: ${name}\n` : '';
                  return `${base}${title}barcode: ${data}`;
                });

                if (facts?.calories != null && !calories) setCalories(String(Math.round(facts.calories)));
                if (facts?.protein != null && !protein) setProtein(String(Math.round(facts.protein)));

                if (!facts) {
                  Alert.alert('Not found', 'No product found for this barcode. You can still type it manually.');
                } else if (facts.calories == null && facts.protein == null) {
                  Alert.alert('No nutrition data', 'Found product but no calories/protein in the free database.');
                }
              } catch {
                Alert.alert('Lookup failed', 'Could not fetch nutrition details. Try again.');
              } finally {
                setBarcodeLoading(false);
              }
            },
          })
        }
        style={[styles.longBtn, { opacity: barcodeLoading ? 0.6 : 1 }]}
        disabled={barcodeLoading}
      >
        <Text style={styles.longBtnTxt}>{barcodeLoading ? 'Scanning…' : 'Scan barcode  🏷️'}</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.title}>Quick log</Text>
        <Text style={styles.subtle}>Start typing and pick from suggestions. Add numbers like "650c 30p".</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Chicken rice bowl 650c 35p"
          value={rawText}
          onChangeText={(t) => {
            setRawText(t);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
        />

        {showSuggestions && filtered.length > 0 ? (
          <View style={styles.suggestBox}>
            {filtered.map((s) => (
              <Pressable
                key={s}
                onPress={() => {
                  setRawText(s);
                  setShowSuggestions(false);
                }}
                style={styles.suggestRow}
              >
                <Text style={styles.suggestTxt}>{s}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
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
        <Text style={styles.title}>Caption (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. felt great after this"
          value={caption}
          onChangeText={setCaption}
        />
      </View>

      <Pressable onPress={onSave} style={styles.longBtn}>
        <Text style={styles.longBtnTxt}>Save entry</Text>
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
  longBtn: {
    backgroundColor: '#6D28D9',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  longBtnTxt: { color: '#fff', fontWeight: '900', fontSize: 16 },
  suggestBox: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  suggestRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  suggestTxt: { color: '#111', fontWeight: '700' },
});
