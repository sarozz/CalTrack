import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { addEntry, loadEntries } from '../storage/store';
import type { Entry, Meal } from '../types/models';
import { COLORS } from '../styles/theme';
import { recommendEmoji } from '../utils/recommendEmoji';
import { MealPicker } from '../components/MealPicker';
import { toDateKey } from '../utils/date';
import { autoMealFromTime, parseNutritionFromText } from '../utils/nutrition';
import { lookupOpenFoodFacts } from '../utils/openfoodfacts';
import { usdaFactsFromItem, usdaSearch } from '../utils/usda';

function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function LogScreen() {
  const navigation = useNavigation<any>();

  const now = React.useMemo(() => new Date(), []);
  const [rawText, setRawText] = React.useState('');
  const [meal, setMeal] = React.useState<Meal>(autoMealFromTime(now));
  const [suggestions, setSuggestions] = React.useState<string[]>([]); // local history
  const [usdaSuggestions, setUsdaSuggestions] = React.useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [calories, setCalories] = React.useState<string>('');
  const [protein, setProtein] = React.useState<string>('');
  const [caption, setCaption] = React.useState<string>('');
  const [barcodeLoading, setBarcodeLoading] = React.useState(false);
  const [scanPreview, setScanPreview] = React.useState<
    | null
    | {
        name?: string;
        barcode: string;
        calories?: number;
        protein?: number;
        fat?: number;
        carbs?: number;
        fiber?: number;
        sugar?: number;
        cholesterol?: number;
        sodium?: number;
        source?: string;
      }
  >(null);

  const [fat, setFat] = React.useState<number | undefined>(undefined);
  const [carbs, setCarbs] = React.useState<number | undefined>(undefined);
  const [fiber, setFiber] = React.useState<number | undefined>(undefined);
  const [sugar, setSugar] = React.useState<number | undefined>(undefined);
  const [cholesterol, setCholesterol] = React.useState<number | undefined>(undefined);
  const [sodium, setSodium] = React.useState<number | undefined>(undefined);

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
      fat,
      carbs,
      fiber,
      sugar,
      cholesterol,
      sodium,
    };

    await addEntry(entry);
    Alert.alert('Saved', 'Added to today');

    // Reset form for quick consecutive logging
    setRawText('');
    setCalories('');
    setProtein('');
    setCaption('');
    setFat(undefined);
    setCarbs(undefined);
    setFiber(undefined);
    setSugar(undefined);
    setCholesterol(undefined);
    setSodium(undefined);

    // Jump back to Home so dashboard/feed updates on focus
    navigation.navigate('HomeTab', { screen: 'Home' });
  }

  const filtered = rawText.trim()
    ? suggestions
        .filter((s) => s.toLowerCase().includes(rawText.trim().toLowerCase()))
        .slice(0, 6)
    : [];

  // USDA search suggestions (if key is configured)
  React.useEffect(() => {
    if (!showSuggestions) return;
    const q = rawText.trim();
    if (q.length < 3) {
      setUsdaSuggestions([]);
      return;
    }

    const t = setTimeout(() => {
      usdaSearch(q)
        .then((foods) => setUsdaSuggestions(foods))
        .catch(() => setUsdaSuggestions([]));
    }, 450);

    return () => clearTimeout(t);
  }, [rawText, showSuggestions]);

  async function savePreview() {
    if (!scanPreview) return;

    const c = scanPreview.calories;
    if (c == null || !Number.isFinite(c) || c <= 0) {
      Alert.alert('Calories required', 'This item has no calories. Enter manually before saving.');
      return;
    }

    const createdAt = Date.now();
    const mealAuto = autoMealFromTime(new Date(createdAt));
    const raw = `${scanPreview.name ? `name: ${scanPreview.name}\n` : ''}barcode: ${scanPreview.barcode}`;
    const emoji = recommendEmoji({ meal: mealAuto, text: `${scanPreview.name || ''} ${raw}`, hasBarcode: true });

    const entry: Entry = {
      id: makeId(),
      createdAt,
      dateKey: toDateKey(new Date(createdAt)),
      meal: mealAuto,
      emoji,
      caption: scanPreview.name || undefined,
      rawText: raw,
      calories: Math.round(c),
      protein: Math.round(scanPreview.protein || 0),
      fat: scanPreview.fat,
      carbs: scanPreview.carbs,
      fiber: scanPreview.fiber,
      sugar: scanPreview.sugar,
      cholesterol: scanPreview.cholesterol,
      sodium: scanPreview.sodium,
    };

    await addEntry(entry);
    setScanPreview(null);
    Alert.alert('Saved', 'Logged from barcode');
    navigation.navigate('HomeTab', { screen: 'Home' });
  }

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

                // Fill form fields (so user can edit)
                const c = facts?.calories != null ? Math.round(facts.calories) : undefined;
                const p = facts?.protein != null ? Math.round(facts.protein) : undefined;

                if (c != null) setCalories(String(c));
                if (p != null) setProtein(String(p));

                if (facts?.fat != null) setFat(facts.fat);
                if (facts?.carbs != null) setCarbs(facts.carbs);
                if (facts?.fiber != null) setFiber(facts.fiber);
                if (facts?.sugar != null) setSugar(facts.sugar);
                if (facts?.cholesterol != null) setCholesterol(facts.cholesterol);
                if (facts?.sodium != null) setSodium(facts.sodium);

                // Show preview card instead of auto-logging
                if (!facts) {
                  setScanPreview(null);
                  Alert.alert('Not found', 'No product found for this barcode. You can still type it manually.');
                } else {
                  setScanPreview({
                    name: name || undefined,
                    barcode: data,
                    calories: c,
                    protein: p,
                    fat: facts.fat,
                    carbs: facts.carbs,
                    fiber: facts.fiber,
                    sugar: facts.sugar,
                    cholesterol: facts.cholesterol,
                    sodium: facts.sodium,
                    source: facts.source,
                  });
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

      {scanPreview ? (
        <View style={styles.card}>
          <Text style={styles.title}>Scan result</Text>
          {!!scanPreview.name && <Text style={styles.scanName}>{scanPreview.name}</Text>}
          <Text style={styles.scanSub}>Barcode: {scanPreview.barcode}{scanPreview.source ? ` · ${scanPreview.source}` : ''}</Text>

          <View style={styles.scanGrid}>
            <Text style={styles.scanCell}>Calories: {scanPreview.calories ?? '—'} kcal</Text>
            <Text style={styles.scanCell}>Protein: {scanPreview.protein ?? '—'} g</Text>
            <Text style={styles.scanCell}>Fat: {scanPreview.fat ?? '—'} g</Text>
            <Text style={styles.scanCell}>Carbs: {scanPreview.carbs ?? '—'} g</Text>
            <Text style={styles.scanCell}>Fiber: {scanPreview.fiber ?? '—'} g</Text>
            <Text style={styles.scanCell}>Sugar: {scanPreview.sugar ?? '—'} g</Text>
            <Text style={styles.scanCell}>Chol: {scanPreview.cholesterol ?? '—'} mg</Text>
            <Text style={styles.scanCell}>Sodium: {scanPreview.sodium ?? '—'} mg</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <Pressable onPress={() => setScanPreview(null)} style={[styles.longBtn, { flex: 1 }]}>
              <Text style={styles.longBtnTxt}>Dismiss</Text>
            </Pressable>
            <Pressable onPress={savePreview} style={[styles.longBtn, { flex: 1 }]}>
              <Text style={styles.longBtnTxt}>Save</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

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

        {showSuggestions && (filtered.length > 0 || usdaSuggestions.length > 0) ? (
          <View style={styles.suggestBox}>
            {usdaSuggestions.slice(0, 5).map((it: any) => {
              const facts = usdaFactsFromItem(it);
              const right =
                facts.calories != null || facts.protein != null
                  ? `${facts.calories != null ? Math.round(facts.calories) + ' kcal' : ''}${
                      facts.calories != null && facts.protein != null ? ' · ' : ''
                    }${facts.protein != null ? Math.round(facts.protein) + 'p' : ''}`
                  : '';
              return (
                <Pressable
                  key={`usda_${it.fdcId}`}
                  onPress={() => {
                    setRawText(facts.name);
                    if (facts.calories != null && !calories) setCalories(String(Math.round(facts.calories)));
                    if (facts.protein != null && !protein) setProtein(String(Math.round(facts.protein)));

                    if (facts.fat != null) setFat(facts.fat);
                    if (facts.carbs != null) setCarbs(facts.carbs);
                    if (facts.fiber != null) setFiber(facts.fiber);
                    if (facts.sugar != null) setSugar(facts.sugar);
                    if (facts.cholesterol != null) setCholesterol(facts.cholesterol);
                    if (facts.sodium != null) setSodium(facts.sodium);

                    setShowSuggestions(false);
                  }}
                  style={styles.suggestRow}
                >
                  <Text style={styles.suggestTxt}>{facts.name}</Text>
                  {!!right && <Text style={styles.suggestMeta}>{right}</Text>}
                </Pressable>
              );
            })}

            {filtered.map((s) => (
              <Pressable
                key={`local_${s}`}
                onPress={() => {
                  setRawText(s);
                  setShowSuggestions(false);
                }}
                style={styles.suggestRow}
              >
                <Text style={styles.suggestTxt}>{s}</Text>
                <Text style={styles.suggestMeta}>history</Text>
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
    backgroundColor: COLORS.btnBg,
    borderColor: COLORS.btnBorder,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  longBtnTxt: { color: COLORS.btnText, fontWeight: '900', fontSize: 16 },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  suggestTxt: { color: '#111', fontWeight: '800', flex: 1 },
  suggestMeta: { color: 'rgba(17,17,17,0.55)', fontWeight: '800', fontSize: 12 },

  scanName: { fontWeight: '900', fontSize: 16, color: '#111' },
  scanSub: { color: 'rgba(17,17,17,0.55)', fontWeight: '800', marginTop: 4 },
  scanGrid: { marginTop: 10, gap: 6 },
  scanCell: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    color: '#111',
    fontWeight: '800',
  },
});
