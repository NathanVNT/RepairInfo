import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { fetchReparations, type Reparation, updateReparationStatus } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';
import { processPendingStatusUpdates, readReparationsCache, saveReparationsCache } from '@/lib/offline-sync';

export default function ReparationsScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const { enabled, initNotifications, sendLocalNotification } = useNotifications();

  const [items, setItems] = useState<Reparation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const reps = await fetchReparations();
      setItems(reps);
      setOfflineMode(false);
      await saveReparationsCache(reps);
      const queueResult = await processPendingStatusUpdates(updateReparationStatus);

      if (queueResult.processed > 0) {
        await sendLocalNotification(
          'Synchronisation terminee',
          `${queueResult.processed} mise(s) a jour offline synchronisee(s).`
        );
      }
    } catch (e) {
      const cached = await readReparationsCache();
      if (cached.length) {
        setItems(cached);
        setOfflineMode(true);
        setError('Mode hors-ligne: donnees en cache');
      } else {
        const message = e instanceof Error ? e.message : 'Erreur chargement';
        setError(message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void initNotifications();
      void load();
    }, [initNotifications, load])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Reparations</Text>
          <Text style={styles.subtitle}>{user?.firstname || user?.username || 'Utilisateur'}</Text>
        </View>
        <View style={styles.headerButtons}>
          <Pressable style={styles.secondaryButton} onPress={() => router.push('/reparations/scan')}>
            <Text style={styles.secondaryButtonText}>Scanner</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => void logout()}>
            <Text style={styles.secondaryButtonText}>Deconnexion</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.badgesRow}>
        <View style={[styles.badge, enabled ? styles.badgeOk : styles.badgeWarn]}>
          <Text style={styles.badgeText}>{enabled ? 'Push active' : 'Push inactive'}</Text>
        </View>
        {offlineMode ? (
          <View style={[styles.badge, styles.badgeWarn]}>
            <Text style={styles.badgeText}>Hors-ligne</Text>
          </View>
        ) : null}
      </View>

      <Pressable
        style={styles.testPushButton}
        onPress={() => void sendLocalNotification('RepairInfo', 'Notifications operationnelles sur ce mobile.')}
      >
        <Text style={styles.testPushButtonText}>Tester notification locale</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList<Reparation>
        data={items}
        keyExtractor={(item: Reparation) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={styles.empty}>Aucune reparation</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/reparations/${item.id}`)}>
            <Text style={styles.cardRef}>{item.ref}</Text>
            <Text style={styles.cardClient}>{item.client_name || 'Client non renseigne'}</Text>
            <Text style={styles.cardMeta}>
              {(item.marque || 'N/A') + ' ' + (item.modele || '')} - {item.statut || 'inconnu'}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  badge: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  badgeOk: {
    backgroundColor: '#bbf7d0',
  },
  badgeWarn: {
    backgroundColor: '#fde68a',
  },
  badgeText: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },
  testPushButton: {
    marginBottom: 12,
    alignSelf: 'flex-start',
    borderRadius: 10,
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  testPushButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#6b7280',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '600',
  },
  error: {
    color: '#b91c1c',
    marginBottom: 10,
  },
  separator: {
    height: 10,
  },
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardRef: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  cardClient: {
    marginTop: 4,
    color: '#1f2937',
    fontWeight: '600',
  },
  cardMeta: {
    marginTop: 6,
    color: '#4b5563',
  },
  empty: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 40,
  },
});
