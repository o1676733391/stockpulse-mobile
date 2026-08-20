import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from '../database/supabase.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let supabaseService: jest.Mocked<SupabaseService>;

  const mockSupabaseClient = {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      refreshSession: jest.fn(),
      admin: {
        signOut: jest.fn(),
      },
    },
    from: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: SupabaseService,
          useValue: {
            getAdminClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    supabaseService = module.get(SupabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should authenticate user and return auth response', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
          },
          user: {
            id: 'user-uuid-1',
            email: 'chef@stockpulse.io',
            user_metadata: {
              role: 'manager',
              assigned_store_ids: ['store-uuid-1'],
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
            id: 'user-uuid-1',
            email: 'chef@stockpulse.io',
            name: 'Chef Mario',
            organization_id: 'org-uuid-1',
            default_store_id: 'store-uuid-1',
            organizations: { name: 'Mario Trattoria Group' },
            user_store_assignments: [
              { store_id: 'store-uuid-1', roles: { name: 'manager' } },
            ],
          },
          error: null,
        }),
      } as any);

      const result = await service.login({
        email: 'chef@stockpulse.io',
        password: 'Password123!',
      });

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.user.email).toBe('chef@stockpulse.io');
      expect(result.user.role).toBe('manager');
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { session: null, user: null },
        error: { message: 'Invalid login credentials' },
      });

      await expect(
        service.login({ email: 'bad@stockpulse.io', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signup', () => {
    it('should throw BadRequestException if Supabase Auth signup fails', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      await expect(
        service.signup({
          email: 'duplicate@stockpulse.io',
          password: 'Password123!',
          name: 'Owner',
          organizationName: 'Owner Corp',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshToken', () => {
    it('should rotate session and return new token pair', async () => {
      mockSupabaseClient.auth.refreshSession.mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
            expires_in: 3600,
          },
          user: {
            id: 'user-uuid-1',
            email: 'user@stockpulse.io',
            user_metadata: { role: 'staff' },
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
            id: 'user-uuid-1',
            email: 'user@stockpulse.io',
            name: 'Staff User',
            organization_id: 'org-uuid-1',
            user_store_assignments: [],
          },
          error: null,
        }),
      } as any);

      const result = await service.refreshToken({
        refreshToken: 'old-refresh-token',
      });

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });
  });

  describe('handleAuthWebhook', () => {
    it('should process user synchronization on INSERT event', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        upsert: jest.fn().mockResolvedValueOnce({ error: null }),
      } as any);

      const response = await service.handleAuthWebhook({
        type: 'INSERT',
        table: 'users',
        schema: 'auth',
        record: {
          id: 'auth-user-99',
          email: 'synced@stockpulse.io',
          raw_user_meta_data: { name: 'Synced User' },
        },
      });

      expect(response.success).toBe(true);
      expect(response.message).toContain('processed successfully');
    });
  });
});
