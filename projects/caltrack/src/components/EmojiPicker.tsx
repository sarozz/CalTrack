import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const EMOJI_GROUPS: { title: string; items: string[] }[] = [
  { title: 'Meals', items: ['🍳', '🥗', '🍛', '🍣'] },
  { title: 'Protein', items: ['🥩', '🍗', '🐟', '🫘'] },
  { title: 'Carbs', items: ['🍞', '🍚', '🥔', '🍜'] },
  { title: 'Treats', items: ['🍫', '🍩', '🍦', '🍺'] },
];

export function EmojiPicker({ value, onChange }: { value?: string; onChange: (e: string) => void }) {
  return (
    <View style={styles.container}>
      {EMOJI_GROUPS.map((g) => (
        <View key={g.title} style={styles.group}>
          <Text style={styles.groupTitle}>{g.title}</Text>
          <View style={styles.grid}>
            {g.items.map((e) => {
              const selected = e === value;
              return (
                <Pressable
                  key={e}
                  onPress={() => onChange(e)}
                  style={[styles.emojiBtn, selected && styles.emojiSelected]}
                  accessibilityRole="button"
                  accessibilityLabel={`Emoji ${e}`}
                >
                  <Text style={styles.emoji}>{e}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  group: {
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 10,
  },
  groupTitle: { fontWeight: '600', marginBottom: 8, color: '#222' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emojiBtn: {
    width: 56,
    height: 44,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  emojiSelected: { borderColor: '#111', backgroundColor: '#eef6ff' },
  emoji: { fontSize: 22 },
});
