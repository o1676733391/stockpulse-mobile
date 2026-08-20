export class UserStoreAssignmentEntity {
  id!: string;
  userId!: string;
  storeId!: string;
  roleId!: string;
  assignedAt!: Date;
  assignedBy?: string;
  deletedAt?: Date | null;
  deletedBy?: string | null;
}
