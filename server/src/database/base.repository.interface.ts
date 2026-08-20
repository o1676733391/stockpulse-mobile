/**
 * Generic Base Repository Interface following the Repository Pattern.
 */
export interface IBaseRepository<T, TCreateDto = Partial<T>, TUpdateDto = Partial<T>> {
  findById(id: string, storeId?: string): Promise<T | null>;
  findAll(storeId?: string, options?: { limit?: number; offset?: number; cursor?: string }): Promise<T[]>;
  create(data: TCreateDto, storeId?: string): Promise<T>;
  update(id: string, data: TUpdateDto, storeId?: string): Promise<T>;
  delete(id: string, storeId?: string): Promise<boolean>;
}
