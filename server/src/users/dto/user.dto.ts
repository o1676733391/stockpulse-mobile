import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'staff1@stockpulse.app' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Luigi Mario' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: '+49 30 1234 5678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'staff', enum: ['superadmin', 'manager', 'supervisor', 'staff', 'auditor'] })
  @IsEnum(['superadmin', 'manager', 'supervisor', 'staff', 'auditor'])
  role!: string;

  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000001' })
  @IsString()
  organizationId!: string;

  @ApiProperty({ example: ['01915dfa-9012-7000-8000-000000000002'] })
  @IsArray()
  @IsString({ each: true })
  assignedStoreIds!: string[];
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Luigi Mario Jr' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+49 30 1234 5678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'supervisor', enum: ['superadmin', 'manager', 'supervisor', 'staff', 'auditor'] })
  @IsOptional()
  @IsEnum(['superadmin', 'manager', 'supervisor', 'staff', 'auditor'])
  role?: string;

  @ApiPropertyOptional({ example: ['01915dfa-9012-7000-8000-000000000002'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedStoreIds?: string[];
}

export class UserResponseDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e002' })
  id!: string;

  @ApiProperty({ example: 'luigi@stockpulse.app' })
  email!: string;

  @ApiProperty({ example: 'Luigi Mario' })
  name!: string;

  @ApiProperty({ example: 'staff' })
  role!: string;

  @ApiPropertyOptional({ example: '+49 30 1234 5678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000001' })
  organizationId!: string;

  @ApiProperty({ example: ['01915dfa-9012-7000-8000-000000000002'] })
  assignedStoreIds!: string[];

  @ApiProperty({ example: '2026-08-20T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-20T00:00:00.000Z' })
  updatedAt!: string;
}
