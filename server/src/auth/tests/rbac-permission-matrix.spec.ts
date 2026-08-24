import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

describe('RBAC - Comprehensive Permission Matrix & Role Security Tests', () => {
  let reflector: Reflector;
  let permissionsGuard: PermissionsGuard;
  let rolesGuard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    permissionsGuard = new PermissionsGuard(reflector);
    rolesGuard = new RolesGuard(reflector);
  });

  const createMockContext = (user: any): ExecutionContext => {
    return {
      getHandler: () => () => {},
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  // Canonical Role-Permission Catalog
  const ROLE_PERMISSIONS: Record<string, string[]> = {
    superadmin: ['*'],
    manager: [
      'inventory:create',
      'inventory:view',
      'inventory:adjust',
      'inventory:archive',
      'stock_count:conduct',
      'stock_count:approve',
      'ocr:scan',
      'ocr:view',
      'ocr:review',
      'procurement:create',
      'procurement:view',
      'procurement:approve',
      'procurement:receive',
      'notifications:send',
      'audit:read',
    ],
    supervisor: [
      'inventory:view',
      'inventory:adjust',
      'stock_count:conduct',
      'ocr:scan',
      'ocr:view',
      'ocr:review',
      'procurement:create',
      'procurement:view',
      'procurement:receive',
    ],
    staff: [
      'inventory:view',
      'stock_count:conduct',
      'ocr:scan',
      'ocr:view',
      'procurement:view',
      'procurement:receive',
    ],
    auditor: [
      'inventory:view',
      'stock_count:conduct',
      'ocr:view',
      'procurement:view',
      'audit:read',
    ],
  };

  const ALL_PERMISSIONS = [
    'inventory:create',
    'inventory:view',
    'inventory:adjust',
    'inventory:archive',
    'stock_count:conduct',
    'stock_count:approve',
    'ocr:scan',
    'ocr:view',
    'ocr:review',
    'procurement:create',
    'procurement:view',
    'procurement:approve',
    'procurement:receive',
    'notifications:send',
    'audit:read',
  ];

  describe('1. Exhaustive Permission Matrix Validation', () => {
    ALL_PERMISSIONS.forEach((permission) => {
      describe(`Permission: "${permission}"`, () => {
        Object.entries(ROLE_PERMISSIONS).forEach(([role, grantedPermissions]) => {
          const isGranted =
            role === 'superadmin' ||
            grantedPermissions.includes('*') ||
            grantedPermissions.includes(permission);

          it(`Role "${role}" should be ${isGranted ? 'ALLOWED' : 'DENIED'}`, () => {
            jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([permission]);

            const user = {
              id: `user-${role}-01`,
              role,
              permissions: grantedPermissions,
            };

            const ctx = createMockContext(user);

            if (isGranted) {
              expect(permissionsGuard.canActivate(ctx)).toBe(true);
            } else {
              expect(() => permissionsGuard.canActivate(ctx)).toThrow(ForbiddenException);
            }
          });
        });
      });
    });
  });

  describe('2. Missing Context & Privilege Escalation Edge Cases', () => {
    it('should throw ForbiddenException if user context is missing from request', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['inventory:view']);
      const ctx = createMockContext(null); // No user

      expect(() => permissionsGuard.canActivate(ctx)).toThrow(ForbiddenException);
      expect(() => rolesGuard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('Privilege Escalation Protection: Staff cannot access manager route even with forged role name if permissions array is missing', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['procurement:approve']);

      const maliciousStaffUser = {
        id: 'user-hacker-01',
        role: 'staff',
        permissions: ['inventory:view', 'procurement:receive'], // Lacks procurement:approve
      };

      const ctx = createMockContext(maliciousStaffUser);
      expect(() => permissionsGuard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('Superadmin Wildcard: User with role "superadmin" bypasses all explicit permission checks', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['super_secret_restricted_perm']);

      const adminUser = {
        id: 'user-admin-01',
        role: 'superadmin',
        permissions: ['*'],
      };

      const ctx = createMockContext(adminUser);
      expect(permissionsGuard.canActivate(ctx)).toBe(true);
      expect(rolesGuard.canActivate(ctx)).toBe(true);
    });
  });
});
