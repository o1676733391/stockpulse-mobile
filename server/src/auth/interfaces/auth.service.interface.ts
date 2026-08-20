import {
  AuthResponseDto,
  LoginDto,
  RefreshTokenDto,
  SignupDto,
  SwitchStoreDto,
  SyncUserWebhookDto,
} from '../dto/auth.dto';

export interface IAuthService {
  login(dto: LoginDto): Promise<AuthResponseDto>;
  signup(dto: SignupDto): Promise<AuthResponseDto>;
  refreshToken(dto: RefreshTokenDto): Promise<AuthResponseDto>;
  logout(userId: string, token?: string): Promise<void>;
  switchStore(userId: string, dto: SwitchStoreDto): Promise<AuthResponseDto>;
  syncUser(payload: Record<string, unknown>): Promise<void>;
  handleAuthWebhook(payload: SyncUserWebhookDto): Promise<{ success: boolean; message: string }>;
}
