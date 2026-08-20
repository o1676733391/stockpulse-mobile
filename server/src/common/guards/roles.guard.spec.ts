import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
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
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  it('should allow access if no roles metadata is set', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(undefined);
    const context = createMockContext({ role: 'staff' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow SuperAdmin regardless of required roles', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(['manager', 'auditor']);
    const context = createMockContext({ role: 'superadmin' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user role matches one of required roles', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(['manager', 'supervisor']);
    const context = createMockContext({ role: 'manager' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user role is not permitted', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(['manager', 'supervisor']);
    const context = createMockContext({ role: 'staff' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
