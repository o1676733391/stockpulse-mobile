import { UnitOfMeasure } from '../../inventory/entities/inventory-item.entity';

export class OcrBomDeductionEntity {
  id!: string;
  ocrDocumentId!: string;
  ocrItemId!: string;
  itemId!: string;
  quantityDeducted!: number;
  unit!: UnitOfMeasure;
  unitCost!: number;
  totalCost!: number;
  createdAt!: Date;
}
