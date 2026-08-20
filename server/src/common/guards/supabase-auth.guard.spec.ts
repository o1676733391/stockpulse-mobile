import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from '../../database/supabase.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';

describe('SupabaseAuthGuard', () => {
  let guard: SupabaseAuthGuard;
  let reflector: jest.Mocked<Reflector>;
  let supabaseService: jest.Mocked<SupabaseService>;

  const mockSupabaseClient = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  };

  const createMockContext = (headers: Record<string, string> = {}): ExecutionContext => {
    const request = {
      headers,
      user: null,
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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: SupabaseService,
          useValue: {
            getAdminClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
      ],
    }).compile();

    guard = module.get<SupabaseAuthGuard>(SupabaseAuthGuard);
    reflector = module.get(Reflector);
    supabaseService = module.get(SupabaseService);
  });

  it('should allow access when endpoint is marked as @Public()', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(true);
    const context = createMockContext();

    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
  });

  it('should throw UnauthorizedException when Authorization header is missing', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false);
    const context = createMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when token verification fails in Supabase', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false);
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'JWT expired' },
    });

    const context = createMockContext({ authorization: 'Bearer expired-jwt-token' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should attach user payload to request on valid token', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false);
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-123',
          email: 'valid@stockpulse.io',
          user_metadata: {
            name: 'Valid User',
            role: 'manager',
            organization_id: 'org-123',
            assigned_store_ids: ['store-123'],
          },
        },
      },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValueOnce({
        data: {
          id: 'user-123',
          email: 'valid@stockpulse.io',
          name: 'Valid User',
          organization_id: 'org-123',
          default_store_id: 'store-123',
          user_store_assignments: [
            { store_id: 'store-123', roles: { name: 'manager' } },
          ],
        },
        error: null,
      }),
    } as any);

    const context = createMockContext({ authorization: 'Bearer valid-jwt-token' });
    const canActivate = await guard.canActivate(context);

    expect(canActivate).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.user).toBeDefined();
    expect(req.user.email).toBe('valid@stockpulse.io');
    expect(req.user.role).toBe('manager');
  });
});
