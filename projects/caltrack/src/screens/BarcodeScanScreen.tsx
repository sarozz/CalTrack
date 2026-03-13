import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';

/**
 * Minimal barcode scanner screen.
 *
 * Returns `data` back to the Log screen via a callback passed in route params.
 */
export function BarcodeScanScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const onScanned: undefined | ((data: string) => void) = route.params?.onScanned;

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = React.useState(false);

  React.useEffect(() => {
    if (!permission) return;
    if (permission.granted) return;
    if (permission.canAskAgain) requestPermission();
  }, [permission, requestPermission]);

  function handleScan(result: BarcodeScanningResult) {
    if (scanned) return;
    setScanned(true);

    const data = String(result.data ?? '').trim();
    if (!data) {
      setScanned(false);
      return;
    }

    try {
      onScanned?.(data);
    } catch {
      // ignore callback errors
    }

    // Immediately return to the Log screen; Log will present the info card.
    // popToTop is more reliable than goBack (avoids jumping to a different tab).
    navigation.popToTop();
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Requesting camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera permission needed</Text>
        <Text style={styles.subtle}>Enable camera access to scan barcodes.</Text>
        <Pressable style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnTxt}>Grant permission</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnSecondary]} onPress={() => navigation.goBack()}>
          <Text style={[styles.btnTxt, { color: '#111' }]}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={handleScan}
        barcodeScannerSettings={{
          // Common UPC/EAN codes used on food packaging.
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
        }}
      />

      <View style={styles.overlay}>
        <Text style={styles.overlayTitle}>Scan barcode</Text>
        <Text style={styles.overlaySub}>Point the camera at the barcode. It will auto-capture.</Text>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <Pressable style={[styles.smallBtn, styles.smallBtnDark]} onPress={() => navigation.goBack()}>
            <Text style={styles.smallBtnTxt}>Back</Text>
          </Pressable>
          {scanned ? (
            <Pressable style={[styles.smallBtn, styles.smallBtnLight]} onPress={() => setScanned(false)}>
              <Text style={[styles.smallBtnTxt, { color: '#111' }]}>Scan again</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18, backgroundColor: '#f6f6f6' },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  subtle: { color: '#666', textAlign: 'center', marginBottom: 16 },
  btn: {
    backgroundColor: '#6D28D9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 10,
    minWidth: 180,
    alignItems: 'center',
  },
  btnSecondary: { backgroundColor: '#eaeaea' },
  btnTxt: { color: '#fff', fontWeight: '600' },
  overlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    padding: 14,
  },
  overlayTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  overlaySub: { color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  smallBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 },
  smallBtnDark: { backgroundColor: '#6D28D9' },
  smallBtnLight: { backgroundColor: '#fff' },
  smallBtnTxt: { color: '#fff', fontWeight: '600' },
});
