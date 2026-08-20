export abstract class BaseEntity {
  id!: string;
  createdAt!: Date;
  updatedAt!: Date;
  createdBy?: string;
  updatedBy?: string;
  version!: number;
  deletedAt?: Date | null;
  deletedBy?: string | null;

  isDeleted(): boolean {
    return this.deletedAt !== null && this.deletedAt !== undefined;
  }
}
