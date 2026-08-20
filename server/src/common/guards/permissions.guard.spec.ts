import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: jest.Mocked<Reflector>;

  const createMockContext = (user: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
        getResponse: () => ({}),
        getNext: () => ({}),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
    reflector = module.get(Reflector);
  });

  it('should allow access if no permissions required', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(undefined);
    const context = createMockContext({ permissions: [] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow SuperAdmin or wildcard permission bypass', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(['inventory:adjust']);
    const context = createMockContext({ role: 'superadmin', permissions: ['*'] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user possesses all required permissions', () => {
    reflector.getAllAndOverride.mockReturnValueOnce([
      'inventory:view',
      'stock_count:conduct',
    ]);
    const context = createMockContext({
      role: 'supervisor',
      permissions: ['inventory:view', 'stock_count:conduct', 'ocr:scan'],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user lacks any required permission', () => {
    reflector.getAllAndOverride.mockReturnValueOnce([
      'inventory:view',
      'procurement:approve_po',
    ]);
    const context = createMockContext({
      role: 'staff',
      permissions: ['inventory:view'],
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
