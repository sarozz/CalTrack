import React from 'react';
import * as Haptics from 'expo-haptics';
import {
  Alert,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { addEntry, loadEntries, loadFavorites, toggleFavorite, type Favorite } from '../storage/store';
import { formatTime } from '../utils/date';
import type { Entry, Meal } from '../types/models';
import { COLORS } from '../styles/theme';
import { recommendEmoji } from '../utils/recommendEmoji';
import { MealPicker } from '../components/MealPicker';
import { toDateKey } from '../utils/date';
import { parseNutritionFromText } from '../utils/nutrition';
import { parseSugarFromText } from '../utils/sugar';
import { lookupOpenFoodFacts } from '../utils/openfoodfacts';
import { usdaFactsFromItem, usdaSearch } from '../utils/usda';
import { guessCaloriesProtein } from '../utils/quickFacts';

function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const QUICK_TEMPLATES: Array<{
  name: string;
  calories: number;
  protein: number;
  sugar?: number;
  carbs?: number;
  fat?: number;
}> = [
  { name: 'Chai (milk + sugar)', calories: 120, protein: 3, sugar: 10, carbs: 16, fat: 4 },
  { name: 'Coffee (with sugar)', calories: 60, protein: 1, sugar: 8, carbs: 10, fat: 1 },
  { name: 'Dal + rice (1 plate)', calories: 520, protein: 18, carbs: 86, fat: 10 },
  { name: 'Roti + curry (2 + 1)', calories: 480, protein: 16, carbs: 70, fat: 14 },
  { name: 'Chicken biryani (1 plate)', calories: 650, protein: 28, carbs: 85, fat: 18 },
];

export function LogScreen() {
  const navigation = useNavigation<any>();

  const now = React.useMemo(() => new Date(), []);
  const [rawText, setRawText] = React.useState('');
  const [meal, setMeal] = React.useState<Meal>('Lunch');
  const [suggestions, setSuggestions] = React.useState<string[]>([]); // local history (strings)
  const [recent, setRecent] = React.useState<Entry[]>([]);
  const [favorites, setFavorites] = React.useState<Favorite[]>([]);
  const [usdaSuggestions, setUsdaSuggestions] = React.useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [calories, setCalories] = React.useState<string>('');
  const [protein, setProtein] = React.useState<string>('');
  const [manualServings, setManualServings] = React.useState<string>('1');
  const [caption, setCaption] = React.useState<string>('');
  const [barcodeLoading, setBarcodeLoading] = React.useState(false);
  const [showMicros, setShowMicros] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  // Animations
  const previewAnim = React.useRef(new Animated.Value(0)).current;
  const suggestAnim = React.useRef(new Animated.Value(0)).current;

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
  const [servings, setServings] = React.useState<string>('1');

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

    const sug = parseSugarFromText(rawText);
    if (sug.sugarG != null && sugar == null) setSugar(Math.round(sug.sugarG));

    // only auto-fill once (keep user overrides)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawText]);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 900);
    return () => clearTimeout(t);
  }, [toast]);

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

      // Recent foods list (unique by caption/text)
      const rec: Entry[] = [];
      const seen2 = new Set<string>();
      for (const e of entries) {
        const label = (e.caption || e.rawText || '').split('\n')[0].trim();
        if (!label) continue;
        const k = label.toLowerCase();
        if (seen2.has(k)) continue;
        seen2.add(k);
        rec.push(e);
        if (rec.length >= 12) break;
      }
      setRecent(rec);

      const favs = await loadFavorites();
      setFavorites(favs);
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function onSave() {
    const c = Number(calories);
    const p = Number(protein);
    const s = Math.max(0.25, Math.min(20, Number(manualServings || '1') || 1));

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
      calories: Math.round(c * s),
      protein: Math.round(p * s),
      fat: fat != null ? Math.round(fat * s) : undefined,
      carbs: carbs != null ? Math.round(carbs * s) : undefined,
      fiber: fiber != null ? Math.round(fiber * s) : undefined,
      sugar: sugar != null ? Math.round(sugar * s) : undefined,
      cholesterol: cholesterol != null ? Math.round(cholesterol * s) : undefined,
      sodium: sodium != null ? Math.round(sodium * s) : undefined,
    };

    await addEntry(entry);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert('Saved', 'Added to today', [
      {
        text: 'Save as preset',
        onPress: async () => {
          const label = (cleanedCaption || cleanedRaw || '').trim();
          if (!label) {
            Alert.alert('Name required', 'Add a caption or quick log text first.');
            return;
          }
          const fav = {
            name: label,
            calories: Math.round(c * s),
            protein: Math.round(p * s),
            fat: fat != null ? Math.round(fat * s) : undefined,
            carbs: carbs != null ? Math.round(carbs * s) : undefined,
            fiber: fiber != null ? Math.round(fiber * s) : undefined,
            sugar: sugar != null ? Math.round(sugar * s) : undefined,
            cholesterol: cholesterol != null ? Math.round(cholesterol * s) : undefined,
            sodium: sodium != null ? Math.round(sodium * s) : undefined,
          };
          const next = await toggleFavorite(fav);
          setFavorites(next);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          Alert.alert('Preset saved', label);
        },
      },
      { text: 'OK' },
    ]);

    // Reset form for quick consecutive logging
    setRawText('');
    setCalories('');
    setProtein('');
    setCaption('');
    setManualServings('1');
    setFat(undefined);
    setCarbs(undefined);
    setFiber(undefined);
    setSugar(undefined);
    setCholesterol(undefined);
    setSodium(undefined);

    // Stay on Log screen (user can jump to Home when they want)
    // navigation.navigate('HomeTab', { screen: 'Home' });
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

  // Animate suggestions open/close
  React.useEffect(() => {
    const open = showSuggestions && (filtered.length > 0 || usdaSuggestions.length > 0);
    Animated.timing(suggestAnim, {
      toValue: open ? 1 : 0,
      duration: open ? 180 : 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [showSuggestions, filtered.length, usdaSuggestions.length, suggestAnim]);

  // Animate scan preview card in/out
  React.useEffect(() => {
    Animated.timing(previewAnim, {
      toValue: scanPreview ? 1 : 0,
      duration: scanPreview ? 220 : 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [scanPreview, previewAnim]);

  async function savePreview() {
    if (!scanPreview) return;

    const mult = Math.max(0.25, Math.min(20, Number(servings || '1') || 1));

    const c = scanPreview.calories;
    if (c == null || !Number.isFinite(c) || c <= 0) {
      Alert.alert('Calories required', 'This item has no calories. Enter manually before saving.');
      return;
    }

    const createdAt = Date.now();

    // Keep log clean: don't store barcode lines.
    const name = (scanPreview.name || '').trim();
    const emoji = recommendEmoji({ meal, text: name, hasBarcode: false });

    const scale = (n?: number) => (n == null ? undefined : Math.round(n * mult));

    const entry: Entry = {
      id: makeId(),
      createdAt,
      dateKey: toDateKey(new Date(createdAt)),
      meal,
      emoji,
      caption: name || undefined,
      rawText: undefined,
      calories: Math.round(c * mult),
      protein: Math.round((scanPreview.protein || 0) * mult),
      fat: scale(scanPreview.fat),
      carbs: scale(scanPreview.carbs),
      fiber: scale(scanPreview.fiber),
      sugar: scale(scanPreview.sugar),
      cholesterol: scale(scanPreview.cholesterol),
      sodium: scale(scanPreview.sodium),
    };

    await addEntry(entry);
    setScanPreview(null);
    Alert.alert('Saved', 'Logged');
    // Stay on Log screen
    // navigation.navigate('HomeTab', { screen: 'Home' });
  }

  if (scanPreview) {
    const mult = Math.max(0.25, Math.min(20, Number(servings || '1') || 1));
    const show = (n?: number, unit?: string) => (n == null ? '—' : `${Math.round(n * mult)}${unit || ''}`);

    return (
      <View style={styles.overlayWrap}>
        <Pressable style={styles.backdrop} onPress={Keyboard.dismiss} />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View
            style={[
              styles.overlayCard,
              {
                opacity: previewAnim,
                transform: [
                  { translateY: previewAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
                  { scale: previewAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
                ],
              },
            ]}
          >
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 6 }}>
              <View style={styles.overlayHeader}>
                <Text style={styles.overlayTitle}>Scanned item</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable
                    onPress={async () => {
                      const name = (scanPreview.name || 'Scanned food').trim();
                      setFavorites(
                        await toggleFavorite({
                          name,
                          calories: scanPreview.calories,
                          protein: scanPreview.protein,
                          fat: scanPreview.fat,
                          carbs: scanPreview.carbs,
                          fiber: scanPreview.fiber,
                          sugar: scanPreview.sugar,
                          cholesterol: scanPreview.cholesterol,
                          sodium: scanPreview.sodium,
                        })
                      );
                    }}
                    style={styles.xBtn}
                  >
                    <Text style={styles.xTxt}>⭐</Text>
                  </Pressable>
                  <Pressable onPress={() => setScanPreview(null)} style={styles.xBtn}>
                    <Text style={styles.xTxt}>✕</Text>
                  </Pressable>
                </View>
              </View>

              {!!scanPreview.name && <Text style={styles.scanName}>{scanPreview.name}</Text>}

              <Text style={styles.scanSub}>Servings</Text>
              <View style={styles.stepRow}>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => setServings(String(Math.max(0.25, (Number(servings || '1') || 1) - 0.5)))}
                >
                  <Text style={styles.stepTxt}>−</Text>
                </Pressable>
                <TextInput
                  value={servings}
                  onChangeText={(t) => setServings(t.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                  style={styles.stepInput}
                  placeholder="1"
                  returnKeyType="done"
                  blurOnSubmit
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => setServings(String(Math.min(20, (Number(servings || '1') || 1) + 0.5)))}
                >
                  <Text style={styles.stepTxt}>+</Text>
                </Pressable>
              </View>
              <View style={styles.presetRow}>
                {['0.5', '1', '1.5', '2'].map((v) => (
                  <Pressable key={v} style={styles.presetChip} onPress={() => setServings(v)}>
                    <Text style={styles.presetTxt}>{v}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.scanGrid}>
                <Text style={styles.scanCell}>Calories: {show(scanPreview.calories, ' kcal')}</Text>
                <Text style={styles.scanCell}>Protein: {show(scanPreview.protein, ' g')}</Text>
                <Text style={styles.scanCell}>Fat: {show(scanPreview.fat, ' g')}</Text>
                <Text style={styles.scanCell}>Carbs: {show(scanPreview.carbs, ' g')}</Text>
                <Text style={styles.scanCell}>Fiber: {show(scanPreview.fiber, ' g')}</Text>
                <Text style={styles.scanCell}>Sugar: {show(scanPreview.sugar, ' g')}</Text>
                <Text style={styles.scanCell}>Cholesterol: {show(scanPreview.cholesterol, ' mg')}</Text>
                <Text style={styles.scanCell}>Sodium: {show(scanPreview.sodium, ' mg')}</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <Pressable onPress={() => setScanPreview(null)} style={[styles.longBtn, { flex: 1 }]}>
                  <Text style={styles.longBtnTxt}>Cancel</Text>
                </Pressable>
                <Pressable onPress={savePreview} style={[styles.longBtn, { flex: 1 }]}>
                  <Text style={styles.longBtnTxt}>Save</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 14, gap: 12 }}>
      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastTxt}>{toast}</Text>
        </View>
      ) : null}
      <Pressable
        onPress={() =>
          navigation.navigate('BarcodeScan', {
            onScanned: async (data: string) => {
              setBarcodeLoading(true);
              try {
                const facts = await lookupOpenFoodFacts(data);
                const name = facts?.name ? String(facts.name).trim() : '';

                // Do not inject scan text into the manual "What did you eat?" field.
                setRawText('');
                setCaption('');

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
                } else {
                  setServings('1');
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
                // Silent failure; user can still type manually.
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
        <Text style={styles.title}>Quick add (templates)</Text>
        <Text style={styles.subtle}>Tap to prefill. Adjust calories/protein if needed.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {QUICK_TEMPLATES.map((t) => (
            <Pressable
              key={t.name}
              style={({ pressed }) => [styles.recentChip, pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] }]}
              onPress={() => {
                setCaption(t.name);
                setRawText(t.name);
                setCalories(String(t.calories));
                setProtein(String(t.protein));
                setManualServings('1');
                setSugar(t.sugar);
                setCarbs(t.carbs);
                setFat(t.fat);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setShowMicros(true);
                setToast('Template added');
              }}
            >
              <Text style={styles.recentEmoji}>⚡</Text>
              <Text style={styles.recentTxt} numberOfLines={1}>
                {t.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {favorites.length ? (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.title}>Favorites</Text>
            <Pressable
              style={styles.smallBtn}
              onPress={async () => {
                const all = await loadEntries();
                if (!all.length) {
                  Alert.alert('Nothing to repeat', 'Log something first.');
                  return;
                }
                const last = all[0];
                const createdAt = Date.now();
                const next = await addEntry({
                  ...last,
                  id: makeId(),
                  createdAt,
                  dateKey: toDateKey(new Date(createdAt)),
                });
                Alert.alert('Logged', `Repeated last entry · ${formatTime(new Date(createdAt))}`);
                // keep local lists reasonably fresh
                setRecent(next.slice(0, 12));
              }}
            >
              <Text style={styles.smallBtnTxt}>Repeat last</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {favorites.map((f) => (
              <Pressable
                key={f.name}
                style={styles.recentChip}
                onPress={async () => {
                  const createdAt = Date.now();
                  const name = f.name;
                  const emoji = recommendEmoji({ meal, text: name, hasBarcode: false });
                  await addEntry({
                    id: makeId(),
                    createdAt,
                    dateKey: toDateKey(new Date(createdAt)),
                    meal,
                    emoji,
                    caption: name,
                    rawText: undefined,
                    calories: Math.round(f.calories || 0),
                    protein: Math.round(f.protein || 0),
                    fat: f.fat,
                    carbs: f.carbs,
                    fiber: f.fiber,
                    sugar: f.sugar,
                    cholesterol: f.cholesterol,
                    sodium: f.sodium,
                  });
                  Alert.alert('Logged', `${name} · ${formatTime(new Date(createdAt))}`);
                }}
                onLongPress={async () => setFavorites(await toggleFavorite(f))}
              >
                <Text style={styles.recentEmoji}>⭐</Text>
                <Text style={styles.recentTxt} numberOfLines={1}>
                  {f.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={styles.hint}>Long‑press to remove</Text>
        </View>
      ) : null}

      {recent.length ? (
        <View style={styles.card}>
          <Text style={styles.title}>Recent</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {recent.map((e) => {
              const label = (e.caption || e.rawText || e.meal).split('\n')[0].trim();
              return (
                <Pressable
                  key={e.id}
                  style={styles.recentChip}
                  onPress={async () => {
                    const createdAt = Date.now();
                    const name = label;
                    const emoji = recommendEmoji({ meal, text: name, hasBarcode: false });
                    await addEntry({
                      ...e,
                      id: makeId(),
                      createdAt,
                      dateKey: toDateKey(new Date(createdAt)),
                      meal,
                      emoji,
                      caption: name,
                      rawText: undefined,
                    });
                    Alert.alert('Logged', `${name} · ${formatTime(new Date(createdAt))}`);
                  }}
                  onLongPress={async () =>
                    setFavorites(
                      await toggleFavorite({
                        name: label,
                        calories: e.calories,
                        protein: e.protein,
                        fat: e.fat,
                        carbs: e.carbs,
                        fiber: e.fiber,
                        sugar: e.sugar,
                        cholesterol: e.cholesterol,
                        sodium: e.sodium,
                      })
                    )
                  }
                >
                  <Text style={styles.recentEmoji}>{e.emoji || '🍽️'}</Text>
                  <Text style={styles.recentTxt} numberOfLines={1}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Text style={styles.hint}>Long‑press to add to Favorites</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.title}>What did you eat?</Text>
        <Text style={styles.subtle}>Start typing and pick a match. You can still add "650c 30p".</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Chicken rice bowl 650c 35p"
          value={rawText}
          onChangeText={(t) => {
            setRawText(t);
            setShowSuggestions(true);

            // If user is typing free-form and hasn't chosen a USDA suggestion,
            // guess basic calories/protein for common foods.
            const guess = guessCaloriesProtein(t);
            if (guess) {
              if (!calories) setCalories(String(guess.calories));
              if (!protein) setProtein(String(guess.protein));
            }
          }}
          onFocus={() => setShowSuggestions(true)}
        />

        {showSuggestions && (filtered.length > 0 || usdaSuggestions.length > 0) ? (
          <Animated.View
            style={[
              styles.suggestBox,
              {
                opacity: suggestAnim,
                transform: [
                  {
                    translateY: suggestAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }),
                  },
                  {
                    scaleY: suggestAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }),
                  },
                ],
              },
            ]}
          >
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {!!right && <Text style={styles.suggestMeta}>{right}</Text>}
                    <Pressable
                      onPress={async () =>
                        setFavorites(
                          await toggleFavorite({
                            name: facts.name,
                            calories: facts.calories,
                            protein: facts.protein,
                            fat: facts.fat,
                            carbs: facts.carbs,
                            fiber: facts.fiber,
                            sugar: facts.sugar,
                            cholesterol: facts.cholesterol,
                            sodium: facts.sodium,
                          })
                        )
                      }
                      hitSlop={10}
                    >
                      <Text style={styles.suggestMeta}>⭐</Text>
                    </Pressable>
                  </View>
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
          </Animated.View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Meal</Text>
        <MealPicker value={meal} onChange={setMeal} />
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

        <View style={{ marginTop: 10 }}>
          <Text style={styles.label}>Servings</Text>
          <View style={styles.stepRow}>
            <Pressable
              style={styles.stepBtn}
              onPress={() => setManualServings(String(Math.max(0.25, (Number(manualServings || '1') || 1) - 0.5)))}
            >
              <Text style={styles.stepTxt}>−</Text>
            </Pressable>
            <TextInput
              value={manualServings}
              onChangeText={(t) => setManualServings(t.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              style={styles.stepInput}
              placeholder="1"
              returnKeyType="done"
            />
            <Pressable
              style={styles.stepBtn}
              onPress={() => setManualServings(String(Math.min(20, (Number(manualServings || '1') || 1) + 0.5)))}
            >
              <Text style={styles.stepTxt}>+</Text>
            </Pressable>
          </View>
          <View style={styles.presetRow}>
            {['0.5', '1', '1.5', '2'].map((v) => (
              <Pressable key={v} style={styles.presetChip} onPress={() => setManualServings(v)}>
                <Text style={styles.presetTxt}>{v}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable style={styles.advRow} onPress={() => setShowMicros((v) => !v)}>
          <Text style={styles.advTxt}>{showMicros ? 'Hide micros' : 'Add micros (sugar, carbs, fat…)'} </Text>
          <Text style={styles.advChevron}>{showMicros ? '˄' : '˅'}</Text>
        </Pressable>

        {showMicros ? (
          <View style={styles.microGrid}>
            <View style={styles.microField}>
              <Text style={styles.label}>Sugar (g)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={sugar == null ? '' : String(sugar)}
                onChangeText={(t) => setSugar(t.trim() ? Number(t.replace(/[^0-9.]/g, '')) : undefined)}
                placeholder="e.g. 8"
              />
              <Text style={styles.microHint}>Tip: type “2 tsp sugar” in Quick log → auto-fills (~8g).</Text>
            </View>
            <View style={styles.microField}>
              <Text style={styles.label}>Carbs (g)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={carbs == null ? '' : String(carbs)}
                onChangeText={(t) => setCarbs(t.trim() ? Number(t.replace(/[^0-9.]/g, '')) : undefined)}
                placeholder="e.g. 30"
              />
            </View>
            <View style={styles.microField}>
              <Text style={styles.label}>Fat (g)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={fat == null ? '' : String(fat)}
                onChangeText={(t) => setFat(t.trim() ? Number(t.replace(/[^0-9.]/g, '')) : undefined)}
                placeholder="e.g. 10"
              />
            </View>
            <View style={styles.microField}>
              <Text style={styles.label}>Fiber (g)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={fiber == null ? '' : String(fiber)}
                onChangeText={(t) => setFiber(t.trim() ? Number(t.replace(/[^0-9.]/g, '')) : undefined)}
                placeholder="e.g. 4"
              />
            </View>
            <View style={styles.microField}>
              <Text style={styles.label}>Sodium (mg)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={sodium == null ? '' : String(sodium)}
                onChangeText={(t) => setSodium(t.trim() ? Number(t.replace(/[^0-9.]/g, '')) : undefined)}
                placeholder="e.g. 400"
              />
            </View>
            <View style={styles.microField}>
              <Text style={styles.label}>Chol (mg)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={cholesterol == null ? '' : String(cholesterol)}
                onChangeText={(t) => setCholesterol(t.trim() ? Number(t.replace(/[^0-9.]/g, '')) : undefined)}
                placeholder="e.g. 50"
              />
            </View>
          </View>
        ) : null}
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
  toast: {
    backgroundColor: '#0B0F1A',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  toastTxt: { color: '#fff', fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(236, 72, 153, 0.35)',
  },
  smallBtnTxt: { color: '#9D174D', fontWeight: '800' },
  subtle: { color: '#666', marginTop: -6, marginBottom: 10 },
  label: { fontWeight: '600', color: '#222', marginBottom: 6 },
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
  longBtnTxt: { color: COLORS.btnText, fontWeight: '600', fontSize: 16 },
  suggestBox: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    overflow: 'hidden',
  },

  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
    maxWidth: 220,
  },
  recentEmoji: { fontSize: 16 },
  recentTxt: { color: '#111', fontWeight: '600', maxWidth: 170 },
  hint: { marginTop: 10, color: 'rgba(17,17,17,0.55)' },

  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTxt: { fontSize: 20, color: 'rgba(17,17,17,0.75)', fontWeight: '600' },
  stepInput: {
    flex: 1,
    textAlign: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
    fontSize: 16,
  },
  presetRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  presetChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  presetTxt: { color: 'rgba(17,17,17,0.65)', fontWeight: '600' },

  advRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  advTxt: { color: '#111', fontWeight: '700' },
  advChevron: { color: 'rgba(17,17,17,0.55)', fontSize: 18, fontWeight: '700' },
  microGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  microField: { flexGrow: 1, flexBasis: 160 },
  microHint: { marginTop: 6, color: 'rgba(17,17,17,0.55)', fontSize: 12, lineHeight: 16 },

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
  suggestTxt: { color: '#111', fontWeight: '600', flex: 1 },
  suggestMeta: { color: 'rgba(17,17,17,0.55)', fontWeight: '600', fontSize: 12 },

  // Overlay (scan preview)
  overlayWrap: { flex: 1, backgroundColor: '#f6f6f6', justifyContent: 'center', padding: 14 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.30)' },
  overlayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overlayTitle: { fontSize: 16, fontWeight: '600', color: '#111' },
  xBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  xTxt: { fontSize: 16, fontWeight: '600', color: 'rgba(17,17,17,0.7)' },
  overlayCard: {
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
    maxHeight: 520,
  },
  cardInlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  servingInput: {
    width: 90,
    textAlign: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
    fontSize: 16,
    fontWeight: '600',
  },
  scanName: { fontWeight: '600', fontSize: 16, color: '#111', marginTop: 6 },
  scanSub: { color: 'rgba(17,17,17,0.55)', fontWeight: '600' },
  scanGrid: { marginTop: 12, gap: 8 },
  scanCell: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#111',
    fontWeight: '600',
  },
});
