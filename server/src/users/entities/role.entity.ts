export class RoleEntity {
  id!: string;
  name!: string;
  description?: string;
  isSystem!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
