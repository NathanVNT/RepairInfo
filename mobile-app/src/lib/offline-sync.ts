import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Reparation } from '@/lib/api';

type PendingStatusUpdate = {
  id: string;
  statut: string;
  queuedAt: string;
};

const REPARATIONS_CACHE_KEY = 'repairinfo.mobile.cache.reparations';
const PENDING_STATUS_UPDATES_KEY = 'repairinfo.mobile.queue.statusUpdates';

export async function saveReparationsCache(items: Reparation[]): Promise<void> {
  await AsyncStorage.setItem(REPARATIONS_CACHE_KEY, JSON.stringify(items));
}

export async function readReparationsCache(): Promise<Reparation[]> {
  const raw = await AsyncStorage.getItem(REPARATIONS_CACHE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Reparation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function queueStatusUpdate(id: string, statut: string): Promise<void> {
  const queue = await readPendingStatusUpdates();

  const withoutPrevious = queue.filter((item) => item.id !== id);
  withoutPrevious.push({ id, statut, queuedAt: new Date().toISOString() });

  await AsyncStorage.setItem(PENDING_STATUS_UPDATES_KEY, JSON.stringify(withoutPrevious));
}

export async function readPendingStatusUpdates(): Promise<PendingStatusUpdate[]> {
  const raw = await AsyncStorage.getItem(PENDING_STATUS_UPDATES_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as PendingStatusUpdate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function processPendingStatusUpdates(
  updater: (id: string, statut: string) => Promise<void>
): Promise<{ processed: number; remaining: number }> {
  const queue = await readPendingStatusUpdates();
  if (!queue.length) {
    return { processed: 0, remaining: 0 };
  }

  const remaining: PendingStatusUpdate[] = [];
  let processed = 0;

  for (const item of queue) {
    try {
      await updater(item.id, item.statut);
      processed += 1;
    } catch {
      remaining.push(item);
    }
  }

  await AsyncStorage.setItem(PENDING_STATUS_UPDATES_KEY, JSON.stringify(remaining));

  return {
    processed,
    remaining: remaining.length,
  };
}
