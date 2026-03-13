import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { FAQ_TEXT, PRIVACY_TEXT, TERMS_TEXT } from '../legal/legalText';

type Kind = 'terms' | 'privacy' | 'faq';

export function LegalScreen() {
  const route = useRoute<any>();
  const kind: Kind = route.params?.kind || 'terms';
  const title = kind === 'terms' ? 'Terms of Use' : kind === 'privacy' ? 'Privacy Policy' : 'FAQ';

  const text = kind === 'terms' ? TERMS_TEXT : kind === 'privacy' ? PRIVACY_TEXT : FAQ_TEXT;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 14 }}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{text}</Text>
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
  title: { fontSize: 18, fontWeight: '600', color: '#111', marginBottom: 10 },
  body: { color: '#111', lineHeight: 20 },
});
