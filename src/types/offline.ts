export type MutationEntity =
  | 'inventory'
  | 'stock_count'
  | 'ocr_result'
  | 'purchase_order';

export type MutationAction = 'create' | 'update' | 'delete' | 'sync';

export type MutationStatus =
  | 'pending'
  | 'syncing'
  | 'completed'
  | 'conflict'
  | 'failed';

export interface OfflineMutation<T = any> {
  id: string;
  entity: MutationEntity;
  action: MutationAction;
  entityId: string;
  payload: T;
  localTimestamp: number;
  serverTimestamp?: number;
  retryCount: number;
  status: MutationStatus;
  baseVersion: number;
  userId: string;
  userRole: string;
  error?: string;
}

export interface ConflictRecord {
  id: string;
  mutationId: string;
  entity: MutationEntity;
  entityName: string;
  clientPayload: any;
  serverPayload: any;
  conflictReason: string;
  detectedAt: number;
  resolved: boolean;
}

export interface SyncProgress {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: number | null;
  conflictCount: number;
}

export interface SyncResult {
  syncedCount: number;
  failedCount: number;
  conflicts: ConflictRecord[];
  timestamp: number;
}

export interface AuditEntry {
  id: string;
  timestamp: number;
  entity: MutationEntity;
  action: MutationAction;
  entityId: string;
  userId: string;
  summary: string;
  status: 'local_queued' | 'synced' | 'conflict_resolved';
}
