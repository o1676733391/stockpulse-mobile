import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantStoreGuard } from '../../common/guards/tenant-store.guard';

describe('Security - Tenant Store & Cross-Organization Isolation Tests', () => {
  let guard: TenantStoreGuard;

  beforeEach(() => {
    guard = new TenantStoreGuard(new Reflector());
  });

  const createMockContext = (
    user: any,
    headers: Record<string, string> = {},
    params: Record<string, string> = {},
    query: Record<string, string> = {},
  ): ExecutionContext => {
    const req: any = { user, headers, params, query };
    return {
      getHandler: () => () => {},
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as unknown as ExecutionContext;
  };

  it('1. Authorized Store Access: Should permit user accessing assigned store via header', () => {
    const user = {
      id: 'user-01',
      role: 'manager',
      assignedStoreIds: ['01915dfa-9012-7000-8000-000000000002'],
    };

    const ctx = createMockContext(user, {
      'x-store-id': '01915dfa-9012-7000-8000-000000000002',
    });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('2. CROSS-STORE VIOLATION: Should reject user attempting to access store outside assigned list', () => {
    const user = {
      id: 'user-01',
      role: 'manager',
      assignedStoreIds: ['01915dfa-9012-7000-8000-000000000002'], // Store A
    };

    const ctx = createMockContext(user, {
      'x-store-id': '01915dfa-9012-7000-8000-000000000099', // Store B (Unauthorized)
    });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('3. CROSS-ORGANIZATION VIOLATION: Should reject access when target store belongs to separate tenant org', () => {
    const user = {
      id: 'user-org-a',
      role: 'manager',
      organizationId: 'org-alpha',
      assignedStoreIds: ['01915dfa-9012-7000-8000-000000000002'],
    };

    const ctx = createMockContext(user, {
      'x-store-id': '01915dfa-9012-7000-8000-000000000888', // Org Beta Store
    });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('4. Superadmin Global Exemption: Superadmin can access any store across all tenants', () => {
    const superadminUser = {
      id: 'user-superadmin',
      role: 'superadmin',
      assignedStoreIds: [], // Empty assigned stores, but global admin
    };

    const ctx = createMockContext(superadminUser, {
      'x-store-id': '01915dfa-9012-7000-8000-000000000888',
    });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('5. Non-store scoped endpoint: Should allow access when no store context is provided in request', () => {
    const user = {
      id: 'user-01',
      role: 'staff',
      assignedStoreIds: ['store-01'],
    };

    const ctx = createMockContext(user, {}); // No X-Store-Id header or param
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
