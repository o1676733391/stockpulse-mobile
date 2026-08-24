import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantStoreGuard } from '../../common/guards/tenant-store.guard';
import { StockCountController } from '../stock-count.controller';

describe('Stock Count - Security, RBAC & Store Isolation Tests', () => {
  let reflector: Reflector;
  let permissionsGuard: PermissionsGuard;
  let rolesGuard: RolesGuard;
  let tenantStoreGuard: TenantStoreGuard;

  beforeEach(() => {
    reflector = new Reflector();
    permissionsGuard = new PermissionsGuard(reflector);
    rolesGuard = new RolesGuard(reflector);
    tenantStoreGuard = new TenantStoreGuard();
  });

  const createMockContext = (user: any, headers: Record<string, string> = {}): ExecutionContext => {
    return {
      getHandler: () => StockCountController.prototype.approveVariance,
      getClass: () => StockCountController,
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          headers,
          params: { sessionId: 'session-01' },
        }),
      }),
    } as unknown as ExecutionContext;
  };

  it('1. Permissions Guard: Should allow user with "stock_count:approve" permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['stock_count:approve']);

    const user = {
      id: 'user-mgr-01',
      role: 'manager',
      permissions: ['stock_count:conduct', 'stock_count:approve'],
    };

    const ctx = createMockContext(user);
    const canActivate = permissionsGuard.canActivate(ctx);
    expect(canActivate).toBe(true);
  });

  it('2. Permissions Guard: Should reject staff user without "stock_count:approve" permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['stock_count:approve']);

    const user = {
      id: 'user-staff-01',
      role: 'staff',
      permissions: ['stock_count:conduct'], // Missing stock_count:approve
    };

    const ctx = createMockContext(user);
    expect(() => permissionsGuard.canActivate(ctx)).toThrow();
  });

  it('3. Roles Guard: Should allow manager or supervisor role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['manager', 'supervisor', 'superadmin']);

    const user = {
      id: 'user-mgr-01',
      role: 'manager',
    };

    const ctx = createMockContext(user);
    const canActivate = rolesGuard.canActivate(ctx);
    expect(canActivate).toBe(true);
  });

  it('4. Roles Guard: Should reject auditor role from approving variance', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['manager', 'supervisor', 'superadmin']);

    const user = {
      id: 'user-aud-01',
      role: 'auditor',
    };

    const ctx = createMockContext(user);
    expect(() => rolesGuard.canActivate(ctx)).toThrow();
  });

  it('5. Tenant Store Guard: Should reject access when active store does not match user assigned stores', () => {
    const user = {
      id: 'user-01',
      role: 'manager',
      assignedStoreIds: ['01915dfa-9012-7000-8000-000000000002'],
    };

    const ctx = createMockContext(user, {
      'x-store-id': '01915dfa-9012-7000-8000-000000000999', // Different unauthorized store
    });

    expect(() => tenantStoreGuard.canActivate(ctx)).toThrow();
  });
});
