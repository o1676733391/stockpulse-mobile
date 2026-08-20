export class AuditLogEntity {
  id!: string;
  organizationId!: string;
  storeId!: string;
  eventNumber!: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  ipAddress?: string;
  userAgent?: string;
  eventAction!: string;
  entityType!: string;
  entityId!: string;
  entityIdentifier?: string;
  stateBefore?: Record<string, unknown>;
  stateAfter?: Record<string, unknown>;
  stateDiff?: Record<string, unknown>;
  reasonCode?: string;
  prevHash!: string;
  currentHash!: string;
  createdAt!: Date;
}
