import {
  AuditEntry,
  ConflictRecord,
  MutationAction,
  MutationEntity,
  OfflineMutation,
  SyncProgress,
  SyncResult,
} from '@/types/offline';

export interface IOfflineQueueService {
  isOnline(): boolean;
  setOnline(online: boolean): void;
  enqueueMutation<T = any>(
    entity: MutationEntity,
    action: MutationAction,
    entityId: string,
    payload: T,
    userId?: string,
    userRole?: string
  ): Promise<OfflineMutation<T>>;
  getPendingMutations(): Promise<OfflineMutation[]>;
  getConflicts(): Promise<ConflictRecord[]>;
  resolveConflict(
    conflictId: string,
    strategy: 'client_wins' | 'server_wins' | 'merged',
    mergedPayload?: any
  ): Promise<void>;
  processSyncQueue(): Promise<SyncResult>;
  getSyncProgress(): SyncProgress;
  getAuditLog(): Promise<AuditEntry[]>;
  onSyncProgressChange(callback: (progress: SyncProgress) => void): () => void;
}

export class MockOfflineQueueService implements IOfflineQueueService {
  private online: boolean = true;
  private syncing: boolean = false;
  private lastSyncedAt: number | null = Date.now() - 5 * 60 * 1000;
  private queue: OfflineMutation[] = [];
  private conflicts: ConflictRecord[] = [];
  private auditLog: AuditEntry[] = [
    {
      id: 'a1',
      timestamp: Date.now() - 15 * 60 * 1000,
      entity: 'stock_count',
      action: 'create',
      entityId: 'c1',
      userId: 'u1',
      summary: 'Physical stock count completed (42 items)',
      status: 'synced',
    },
    {
      id: 'a2',
      timestamp: Date.now() - 30 * 60 * 1000,
      entity: 'ocr_result',
      action: 'create',
      entityId: 'ocr-2048',
      userId: 'u1',
      summary: 'POS register report #2048 BOM deducted',
      status: 'synced',
    },
  ];

  private listeners: Array<(progress: SyncProgress) => void> = [];

  isOnline(): boolean {
    return this.online;
  }

  setOnline(online: boolean): void {
    const prev = this.online;
    this.online = online;
    this.notifyProgress();

    // Auto-sync when transitioning from offline to online
    if (!prev && online && this.queue.length > 0) {
      this.processSyncQueue();
    }
  }

  async enqueueMutation<T = any>(
    entity: MutationEntity,
    action: MutationAction,
    entityId: string,
    payload: T,
    userId: string = 'u1',
    userRole: string = 'admin'
  ): Promise<OfflineMutation<T>> {
    const mutation: OfflineMutation<T> = {
      id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      entity,
      action,
      entityId,
      payload,
      localTimestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
      baseVersion: 1,
      userId,
      userRole,
    };

    this.queue.push(mutation);

    // Append to audit log
    this.auditLog.unshift({
      id: `audit-${Date.now()}`,
      timestamp: Date.now(),
      entity,
      action,
      entityId,
      userId,
      summary: `Queued offline ${action} for ${entity} (${entityId})`,
      status: 'local_queued',
    });

    this.notifyProgress();

    // If online, immediately process queue
    if (this.online) {
      setTimeout(() => {
        this.processSyncQueue();
      }, 500);
    }

    return mutation;
  }

  async getPendingMutations(): Promise<OfflineMutation[]> {
    return [...this.queue.filter((m) => m.status === 'pending' || m.status === 'syncing')];
  }

  async getConflicts(): Promise<ConflictRecord[]> {
    return [...this.conflicts.filter((c) => !c.resolved)];
  }

  async resolveConflict(
    conflictId: string,
    strategy: 'client_wins' | 'server_wins' | 'merged',
    mergedPayload?: any
  ): Promise<void> {
    const conflictIndex = this.conflicts.findIndex((c) => c.id === conflictId);
    if (conflictIndex === -1) return;

    const conflict = this.conflicts[conflictIndex];
    conflict.resolved = true;

    // Log resolution to audit log
    this.auditLog.unshift({
      id: `audit-${Date.now()}`,
      timestamp: Date.now(),
      entity: conflict.entity,
      action: 'update',
      entityId: conflict.mutationId,
      userId: 'u1',
      summary: `Resolved conflict for ${conflict.entityName} via strategy: ${strategy}`,
      status: 'conflict_resolved',
    });

    this.notifyProgress();
  }

  async processSyncQueue(): Promise<SyncResult> {
    if (this.syncing || !this.online || this.queue.length === 0) {
      return {
        syncedCount: 0,
        failedCount: 0,
        conflicts: [],
        timestamp: Date.now(),
      };
    }

    this.syncing = true;
    this.notifyProgress();

    // Simulate network processing
    await new Promise((resolve) => setTimeout(resolve, 800));

    let syncedCount = 0;
    const remainingQueue: OfflineMutation[] = [];
    const newConflicts: ConflictRecord[] = [];

    for (const mutation of this.queue) {
      // Simulate deterministic conflict handling:
      // If mutation payload has a simulated conflict flag, create conflict record
      if ((mutation.payload as any)?._simulateConflict) {
        mutation.status = 'conflict';
        const conflictRec: ConflictRecord = {
          id: `conf-${Date.now()}-${mutation.id}`,
          mutationId: mutation.id,
          entity: mutation.entity,
          entityName: (mutation.payload as any)?.name ?? `${mutation.entity} (${mutation.entityId})`,
          clientPayload: mutation.payload,
          serverPayload: {
            ...mutation.payload,
            stockLevel: ((mutation.payload as any)?.stockLevel ?? 10) + 5,
            lastModifiedBy: 'POS Register (auto-sync)',
          },
          conflictReason:
            mutation.entity === 'stock_count'
              ? 'Physical floor count differs from interim POS sales transaction recorded on cloud.'
              : 'Concurrent modification by another terminal.',
          detectedAt: Date.now(),
          resolved: false,
        };
        this.conflicts.push(conflictRec);
        newConflicts.push(conflictRec);
      } else {
        mutation.status = 'completed';
        mutation.serverTimestamp = Date.now();
        syncedCount++;

        // Update audit log item
        const logItem = this.auditLog.find((a) => a.entityId === mutation.entityId);
        if (logItem) {
          logItem.status = 'synced';
        }
      }
    }

    this.queue = remainingQueue;
    this.syncing = false;
    this.lastSyncedAt = Date.now();
    this.notifyProgress();

    return {
      syncedCount,
      failedCount: remainingQueue.length,
      conflicts: newConflicts,
      timestamp: Date.now(),
    };
  }

  getSyncProgress(): SyncProgress {
    return {
      isOnline: this.online,
      isSyncing: this.syncing,
      pendingCount: this.queue.filter((m) => m.status === 'pending' || m.status === 'syncing').length,
      lastSyncedAt: this.lastSyncedAt,
      conflictCount: this.conflicts.filter((c) => !c.resolved).length,
    };
  }

  async getAuditLog(): Promise<AuditEntry[]> {
    return [...this.auditLog];
  }

  onSyncProgressChange(callback: (progress: SyncProgress) => void): () => void {
    this.listeners.push(callback);
    callback(this.getSyncProgress());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyProgress(): void {
    const current = this.getSyncProgress();
    this.listeners.forEach((l) => l(current));
  }
}

export const offlineQueueService: IOfflineQueueService = new MockOfflineQueueService();
