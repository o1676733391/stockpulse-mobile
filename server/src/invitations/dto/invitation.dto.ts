import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({ example: 'chef.mario@restaurant.de', description: 'Work email of the invited staff' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'supervisor', description: 'Target user role: manager | supervisor | staff | auditor' })
  @IsString()
  @IsNotEmpty()
  role!: string;

  @ApiPropertyOptional({ example: 'Mario Rossi', description: 'Display name of invited member' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '+49 151 23456789', description: 'Phone number of invited member' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 7, description: 'Invitation validity period in days (1 - 30)' })
  @IsNumber()
  @Min(1)
  @Max(30)
  @IsOptional()
  expiresInDays?: number;
}

export class ResendInvitationDto {
  @ApiPropertyOptional({ example: 7, description: 'Extended validity period in days (1 - 30)' })
  @IsNumber()
  @Min(1)
  @Max(30)
  @IsOptional()
  expiresInDays?: number;
}

export class ValidateInvitationDto {
  @ApiProperty({ example: 'INV-A9B8C7', description: 'Invitation code or raw token' })
  @IsString()
  @IsNotEmpty()
  codeOrToken!: string;
}

export class AcceptInvitationDto {
  @ApiProperty({ example: 'INV-A9B8C7', description: 'Invitation code or secret token' })
  @IsString()
  @IsNotEmpty()
  codeOrToken!: string;

  @ApiPropertyOptional({ example: 'Mario Rossi', description: 'Full name for account creation / profile' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '+49 151 23456789', description: 'Phone number' })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class AcceptInvitationLegacyDto {
  @ApiPropertyOptional({ example: 'Mario Rossi', description: 'Full name for profile' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '+49 151 23456789', description: 'Phone number' })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class InvitationResponseDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e050' })
  id!: string;

  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000002' })
  storeId!: string;

  @ApiPropertyOptional({ example: 'Bella Cucina / Hoang Tu Be' })
  storeName?: string;

  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000001' })
  organizationId!: string;

  @ApiProperty({ example: 'chef.mario@restaurant.de' })
  email!: string;

  @ApiProperty({ example: 'supervisor' })
  role!: string;

  @ApiProperty({ example: 'INV-A1B2C3' })
  invitationCode!: string;

  @ApiProperty({ example: 'PENDING', enum: ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'] })
  status!: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

  @ApiProperty({ example: '2026-09-06T12:00:00.000Z' })
  expiresAt!: string;

  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e001' })
  createdBy!: string;

  @ApiPropertyOptional({ example: 'Admin User' })
  createdByName?: string;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e002' })
  acceptedBy?: string;

  @ApiPropertyOptional({ example: '2026-08-30T14:30:00.000Z' })
  acceptedAt?: string;

  @ApiPropertyOptional({ example: '2026-08-30T14:30:00.000Z' })
  revokedAt?: string;

  @ApiPropertyOptional({ example: 'https://app.stockpulse.io/invite?token=a1b2c3d4...' })
  inviteUrl?: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4...' })
  rawToken?: string;

  @ApiProperty({ example: '2026-08-30T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-30T12:00:00.000Z' })
  updatedAt!: string;
}

export class VerifyInvitationResponseDto {
  @ApiProperty({ example: true })
  valid!: boolean;

  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000002' })
  storeId!: string;

  @ApiProperty({ example: 'Bella Cucina / Hoang Tu Be' })
  storeName!: string;

  @ApiProperty({ example: 'chef.mario@restaurant.de' })
  email!: string;

  @ApiProperty({ example: 'supervisor' })
  role!: string;

  @ApiProperty({ example: 'INV-A1B2C3' })
  invitationCode!: string;

  @ApiProperty({ example: '2026-09-06T12:00:00.000Z' })
  expiresAt!: string;
}

export class AcceptInvitationResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000002' })
  storeId!: string;

  @ApiProperty({ example: 'Bella Cucina / Hoang Tu Be' })
  storeName!: string;

  @ApiProperty({ example: 'supervisor' })
  role!: string;

  @ApiProperty({ example: 'Invitation accepted successfully and store role granted' })
  message!: string;
}
