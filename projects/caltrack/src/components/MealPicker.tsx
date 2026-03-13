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
  selected: {
    borderColor: 'rgba(236, 72, 153, 0.35)',
    backgroundColor: 'rgba(236, 72, 153, 0.18)',
  },
  txt: { color: '#222', fontWeight: '700', fontSize: 13 },
  txtSelected: { color: '#9D174D' },
});
