import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { fetchReparationByRef } from '@/lib/api';

export default function ReparationScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Permission camera requise</Text>
        <Pressable style={styles.button} onPress={() => void requestPermission()}>
          <Text style={styles.buttonText}>Autoriser la camera</Text>
        </Pressable>
      </View>
    );
  }

  const onBarcodeScanned = async ({ data }: { data: string }) => {
    if (locked || loading) return;

    setLocked(true);
    setLoading(true);
    setMessage(null);

    try {
      const rep = await fetchReparationByRef(data.trim());
      if (!rep) {
        setMessage(`Reference non trouvee: ${data}`);
        return;
      }

      router.replace(`/reparations/${rep.id}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur de scan';
      setMessage(msg);
    } finally {
      setLoading(false);
      setTimeout(() => setLocked(false), 1200);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" onBarcodeScanned={onBarcodeScanned} />
      <View style={styles.overlay}>
        <Text style={styles.title}>Scanne une reference (ex: REP-2026-00001)</Text>
        {loading ? <ActivityIndicator size="small" color="#ffffff" /> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
    backgroundColor: '#111827',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: 'rgba(17, 24, 39, 0.75)',
    gap: 8,
  },
  title: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    color: '#fde68a',
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  buttonText: {
    color: '#111827',
    fontWeight: '700',
  },
});
