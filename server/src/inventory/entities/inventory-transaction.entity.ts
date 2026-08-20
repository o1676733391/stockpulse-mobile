export type InventoryTransactionType =
  | 'PURCHASE_RECEIPT'
  | 'POS_DEDUCTION'
  | 'COUNT_VARIANCE'
  | 'WASTE_DISCARD'
  | 'MANUAL_ADJUSTMENT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT';

export class InventoryTransactionEntity {
  id!: string;
  storeId!: string;
  itemId!: string;
  batchId?: string;
  transactionNumber!: string;
  transactionType!: InventoryTransactionType;
  delta!: number;
  previousStock!: number;
  newStock!: number;
  costImpact!: number;
  actorId?: string;
  actorName?: string;
  referenceType?: string;
  referenceId?: string;
  note?: string;
  createdAt!: Date;
}
