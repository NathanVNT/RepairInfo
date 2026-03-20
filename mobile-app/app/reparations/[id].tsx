import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { fetchReparationById, type Reparation, updateReparationStatus } from '@/lib/api';
import { queueStatusUpdate } from '@/lib/offline-sync';

export default function ReparationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<Reparation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const data = await fetchReparationById(id);
        setItem(data);
        setError(null);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Erreur chargement';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error || 'Reparation introuvable'}</Text>
      </View>
    );
  }

  const markAsDone = async () => {
    setUpdating(true);

    try {
      await updateReparationStatus(item.id, 'terminee');
      setItem({ ...item, statut: 'terminee' });
    } catch {
      await queueStatusUpdate(item.id, 'terminee');
      setItem({ ...item, statut: 'terminee (offline en attente sync)' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card label="Reference" value={item.ref} />
      <Card label="Client" value={item.client_name || 'Non renseigne'} />
      <Card label="Appareil" value={item.appareil || 'Non renseigne'} />
      <Card label="Marque / Modele" value={`${item.marque || 'N/A'} ${item.modele || ''}`} />
      <Card label="Statut" value={item.statut || 'Inconnu'} />
      <Card label="Priorite" value={item.priorite || 'Inconnue'} />
      <Card label="Technicien" value={item.technicien || 'Non assigne'} />
      <Card label="Date depot" value={new Date(item.date_depot).toLocaleString()} />

      <Pressable style={[styles.action, updating && styles.actionDisabled]} onPress={markAsDone} disabled={updating}>
        <Text style={styles.actionText}>{updating ? 'Mise a jour...' : 'Marquer comme terminee'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    gap: 10,
    backgroundColor: '#f3f4f6',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: '#b91c1c',
  },
  card: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
  },
  label: {
    color: '#6b7280',
    fontSize: 13,
  },
  value: {
    marginTop: 4,
    color: '#111827',
    fontSize: 17,
    fontWeight: '600',
  },
  action: {
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: '#111827',
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionDisabled: {
    opacity: 0.5,
  },
  actionText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
