import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthResponse: AuthResponseDto = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresIn: 3600,
    tokenType: 'Bearer',
    user: {
      id: 'test-user-id',
      email: 'test@stockpulse.io',
      name: 'Test User',
      role: 'manager',
      organizationId: 'test-org-id',
      assignedStoreIds: ['test-store-id'],
      permissions: ['inventory:view'],
    },
  };

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn().mockResolvedValue(mockAuthResponse),
      signup: jest.fn().mockResolvedValue(mockAuthResponse),
      refreshToken: jest.fn().mockResolvedValue(mockAuthResponse),
      logout: jest.fn().mockResolvedValue(undefined),
      switchStore: jest.fn().mockResolvedValue(mockAuthResponse),
      handleAuthWebhook: jest.fn().mockResolvedValue({ success: true, message: 'OK' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should delegate to AuthService.login', async () => {
      const dto = { email: 'test@stockpulse.io', password: 'Password123!' };
      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('signup', () => {
    it('should delegate to AuthService.signup', async () => {
      const dto = {
        email: 'test@stockpulse.io',
        password: 'Password123!',
        name: 'Test User',
        organizationName: 'Test Org',
      };
      const result = await controller.signup(dto);

      expect(authService.signup).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('logout', () => {
    it('should revoke token and return success', async () => {
      const result = await controller.logout('test-user-id', 'Bearer test-token');

      expect(authService.logout).toHaveBeenCalledWith('test-user-id', 'test-token');
      expect(result).toEqual({ success: true, message: 'Logged out successfully' });
    });
  });

  describe('getProfile', () => {
    it('should return authenticated user', async () => {
      const user = mockAuthResponse.user;
      const result = await controller.getProfile(user as any);

      expect(result).toEqual(user);
    });
  });
});
