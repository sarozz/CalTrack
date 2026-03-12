import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Meal } from '../types/models';

const MEALS: Meal[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export function MealPicker({ value, onChange }: { value: Meal; onChange: (m: Meal) => void }) {
  return (
    <View style={styles.row}>
      {MEALS.map((m) => {
        const selected = m === value;
        return (
          <Pressable key={m} onPress={() => onChange(m)} style={[styles.btn, selected && styles.selected]}>
            <Text style={[styles.txt, selected && styles.txtSelected]}>{m}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  selected: { borderColor: '#111', backgroundColor: '#111' },
  txt: { color: '#222', fontWeight: '600', fontSize: 13 },
  txtSelected: { color: '#fff' },
});
