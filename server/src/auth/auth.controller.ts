import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AuthService } from './auth.service';
import {
  AuthResponseDto,
  LoginDto,
  RefreshTokenDto,
  SignupDto,
  SwitchStoreDto,
  SyncUserWebhookDto,
} from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and issue JWT access/refresh token pair' })
  @ApiResponse({ status: 200, description: 'Authentication successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new tenant organization and superadmin owner account' })
  @ApiResponse({ status: 201, description: 'Registration and workspace initialized', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error or email already exists' })
  async signup(@Body() dto: SignupDto): Promise<AuthResponseDto> {
    return this.authService.signup(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue fresh JWT session' })
  @ApiResponse({ status: 200, description: 'Tokens rotated successfully', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshToken(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshToken(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('BearerAuth')
  @ApiOperation({ summary: 'Revoke active session token' })
  @ApiResponse({ status: 200, description: 'Session terminated' })
  async logout(
    @CurrentUser('id') userId: string,
    @Headers('authorization') authHeader?: string,
  ): Promise<{ success: boolean; message: string }> {
    const token = authHeader?.replace('Bearer ', '').trim();
    await this.authService.logout(userId, token);
    return { success: true, message: 'Logged out successfully' };
  }

  @Get('me')
  @ApiBearerAuth('BearerAuth')
  @ApiOperation({ summary: 'Get current authenticated user profile, permissions, and store access' })
  @ApiResponse({ status: 200, description: 'Authenticated user profile' })
  async getProfile(@CurrentUser() user: AuthenticatedUser): Promise<AuthenticatedUser> {
    return user;
  }

  @Post('switch-store')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('BearerAuth')
  @ApiOperation({ summary: 'Switch active store context for multi-store supervisors/managers' })
  @ApiResponse({ status: 200, description: 'Switched store context successfully', type: AuthResponseDto })
  async switchStore(
    @CurrentUser('id') userId: string,
    @Body() dto: SwitchStoreDto,
  ): Promise<AuthResponseDto> {
    return this.authService.switchStore(userId, dto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify and confirm pending user email and ensure tenant profile exists' })
  async verifyEmail(
    @Body('email') email: string,
  ): Promise<{ verified: boolean; message: string }> {
    return this.authService.verifyEmailByAddress(email);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supabase Auth Webhook receiver for automatic user synchronization' })
  @ApiResponse({ status: 200, description: 'Webhook event processed' })
  async handleWebhook(
    @Body() payload: SyncUserWebhookDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.authService.handleAuthWebhook(payload);
  }
}
