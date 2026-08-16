import { offlineQueueService } from '@/services/offlineQueueService';
import {
  ConflictRecord,
  MutationAction,
  MutationEntity,
  SyncProgress,
} from '@/types/offline';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  conflictCount: number;
  lastSyncedAt: number | null;
  conflicts: ConflictRecord[];
  toggleNetworkMode: () => void;
  syncNow: () => Promise<void>;
  resolveConflict: (
    conflictId: string,
    strategy: 'client_wins' | 'server_wins' | 'merged',
    mergedPayload?: any
  ) => Promise<void>;
  enqueueOfflineAction: <T = any>(
    entity: MutationEntity,
    action: MutationAction,
    entityId: string,
    payload: T
  ) => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | null>(null);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<SyncProgress>(() =>
    offlineQueueService.getSyncProgress()
  );
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);

  useEffect(() => {
    const unsubscribe = offlineQueueService.onSyncProgressChange((p) => {
      setProgress(p);
      offlineQueueService.getConflicts().then(setConflicts);
    });
    return unsubscribe;
  }, []);

  const toggleNetworkMode = useCallback(() => {
    offlineQueueService.setOnline(!progress.isOnline);
  }, [progress.isOnline]);

  const syncNow = useCallback(async () => {
    await offlineQueueService.processSyncQueue();
  }, []);

  const resolveConflict = useCallback(
    async (
      conflictId: string,
      strategy: 'client_wins' | 'server_wins' | 'merged',
      mergedPayload?: any
    ) => {
      await offlineQueueService.resolveConflict(conflictId, strategy, mergedPayload);
      const updated = await offlineQueueService.getConflicts();
      setConflicts(updated);
    },
    []
  );

  const enqueueOfflineAction = useCallback(
    async <T = any>(
      entity: MutationEntity,
      action: MutationAction,
      entityId: string,
      payload: T
    ) => {
      await offlineQueueService.enqueueMutation(entity, action, entityId, payload);
    },
    []
  );

  const value = useMemo<OfflineContextType>(
    () => ({
      isOnline: progress.isOnline,
      isSyncing: progress.isSyncing,
      pendingCount: progress.pendingCount,
      conflictCount: progress.conflictCount,
      lastSyncedAt: progress.lastSyncedAt,
      conflicts,
      toggleNetworkMode,
      syncNow,
      resolveConflict,
      enqueueOfflineAction,
    }),
    [progress, conflicts, toggleNetworkMode, syncNow, resolveConflict, enqueueOfflineAction]
  );

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline(): OfflineContextType {
  const ctx = useContext(OfflineContext);
  if (!ctx) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return ctx;
}
