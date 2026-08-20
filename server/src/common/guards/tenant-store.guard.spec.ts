import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TenantStoreGuard } from './tenant-store.guard';

describe('TenantStoreGuard', () => {
  let guard: TenantStoreGuard;

  const createMockContext = (
    user: any,
    headers: Record<string, string> = {},
  ): ExecutionContext => {
    const request = {
      headers,
      user,
      storeId: undefined,
    };
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
        getNext: () => ({}),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    guard = new TenantStoreGuard();
  });

  it('should allow request if no storeId header or parameter is present', () => {
    const context = createMockContext({ id: 'user-1', assignedStoreIds: [] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow SuperAdmin to access any store location', () => {
    const context = createMockContext(
      { id: 'admin-1', role: 'superadmin', assignedStoreIds: [] },
      { 'x-store-id': 'any-store-uuid' },
    );

    expect(guard.canActivate(context)).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.storeId).toBe('any-store-uuid');
  });

  it('should allow user if target store is in assignedStoreIds', () => {
    const context = createMockContext(
      {
        id: 'user-1',
        role: 'manager',
        assignedStoreIds: ['store-alpha', 'store-beta'],
      },
      { 'x-store-id': 'store-alpha' },
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user attempts cross-store unauthorized access', () => {
    const context = createMockContext(
      {
        id: 'user-1',
        role: 'staff',
        assignedStoreIds: ['store-alpha'],
      },
      { 'x-store-id': 'store-unauthorized' },
    );

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
