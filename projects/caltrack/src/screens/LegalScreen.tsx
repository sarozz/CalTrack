import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';

// Minimal in-app legal/faq renderer.
// For v1 we load markdown files bundled in the repo via metro using `require`.

type Kind = 'terms' | 'privacy' | 'faq';

function getAsset(kind: Kind) {
  switch (kind) {
    case 'terms':
      return require('../../legal/TERMS.md');
    case 'privacy':
      return require('../../legal/PRIVACY.md');
    case 'faq':
      return require('../../legal/FAQ.md');
  }
}

export function LegalScreen() {
  const route = useRoute<any>();
  const kind: Kind = route.params?.kind || 'terms';
  const title = kind === 'terms' ? 'Terms of Use' : kind === 'privacy' ? 'Privacy Policy' : 'FAQ';

  const [text, setText] = React.useState<string>('');

  React.useEffect(() => {
    (async () => {
      try {
        const asset = getAsset(kind);
        // expo-file-system can read from asset modules in Expo.
        const uri = asset?.uri || asset;
        const t = await FileSystem.readAsStringAsync(uri);
        setText(t);
      } catch {
        setText('Unable to load document.');
      }
    })();
  }, [kind]);

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
