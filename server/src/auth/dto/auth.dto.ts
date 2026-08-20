import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'mario@stockpulse.app', description: 'User account email address' })
  @IsEmail({}, { message: 'A valid email address is required' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  email!: string;

  @ApiProperty({ example: 'Secret123!', description: 'User password (min 6 characters)' })
  @IsString()
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;
}

export class SignupDto {
  @ApiProperty({ example: 'chef@restaurant.com', description: 'Tenant owner email' })
  @IsEmail({}, { message: 'A valid email address is required' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'StrongPassword123!', description: 'Secure password (min 8 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @ApiProperty({ example: 'Gordon Ramsay', description: 'Full name of tenant administrator' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  name!: string;

  @ApiProperty({ example: 'Union Street Cafe Group', description: 'Name of the business organization' })
  @IsString()
  @IsNotEmpty({ message: 'Organization name is required' })
  organizationName!: string;

  @ApiPropertyOptional({ example: 'union-street-cafe', description: 'Unique organization subdomain / slug' })
  @IsOptional()
  @IsString()
  organizationSlug?: string;

  @ApiPropertyOptional({ example: '+1 555-0144', description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'v1.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'Supabase Auth refresh token' })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token cannot be empty' })
  refreshToken!: string;
}

export class SwitchStoreDto {
  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000002', description: 'Target store location UUID' })
  @IsString()
  @IsNotEmpty({ message: 'Target store ID is required' })
  storeId!: string;
}

export class SyncUserWebhookDto {
  @ApiProperty({ example: 'INSERT', enum: ['INSERT', 'UPDATE', 'DELETE'] })
  @IsString()
  @IsNotEmpty()
  type!: 'INSERT' | 'UPDATE' | 'DELETE';

  @ApiProperty({ example: 'users' })
  @IsString()
  @IsNotEmpty()
  table!: string;

  @ApiProperty({ example: 'auth' })
  @IsString()
  @IsNotEmpty()
  schema!: string;

  @ApiProperty({
    example: {
      id: '01915dfa-b1c4-7221-9988-51b72e04e001',
      email: 'mario@stockpulse.app',
      raw_user_meta_data: { full_name: 'Mario Batali', role: 'manager' },
    },
  })
  record!: {
    id: string;
    email?: string;
    raw_user_meta_data?: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
  };

  @ApiPropertyOptional({ example: { id: '01915dfa-b1c4-7221-9988-51b72e04e001' } })
  old_record?: {
    id: string;
    email?: string;
  };
}

export class AuthUserSummaryDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e001' })
  id!: string;

  @ApiProperty({ example: 'mario@stockpulse.app' })
  email!: string;

  @ApiProperty({ example: 'Mario Batali' })
  name!: string;

  @ApiProperty({ example: 'manager', enum: ['superadmin', 'manager', 'supervisor', 'staff', 'auditor'] })
  role!: string;

  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000001' })
  organizationId!: string;

  @ApiPropertyOptional({ example: 'StockPulse Demo Cafe Group' })
  organizationName?: string;

  @ApiPropertyOptional({ example: '01915dfa-9012-7000-8000-000000000002' })
  defaultStoreId?: string;

  @ApiProperty({
    example: ['01915dfa-9012-7000-8000-000000000002', '01915dfa-9012-7000-8000-000000000003'],
  })
  assignedStoreIds!: string[];

  @ApiProperty({
    example: [
      'inventory:view',
      'inventory:create',
      'inventory:update',
      'inventory:adjust',
      'procurement:create',
      'procurement:approve',
      'ocr:upload',
      'ocr:confirm',
    ],
  })
  permissions!: string[];
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Supabase JWT access token for Bearer authentication',
  })
  accessToken!: string;

  @ApiProperty({
    example: 'v1.refresh-token-abc123xyz...',
    description: 'Refresh token to renew expired access tokens',
  })
  refreshToken!: string;

  @ApiProperty({ example: 3600, description: 'Token lifespan in seconds' })
  expiresIn!: number;

  @ApiProperty({ example: 'Bearer', description: 'Token authorization type' })
  tokenType: string = 'Bearer';

  @ApiProperty({ type: () => AuthUserSummaryDto, description: 'Authenticated user profile and permissions' })
  user!: AuthUserSummaryDto;
}
