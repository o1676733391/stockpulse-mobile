import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000001' })
  @IsString()
  @IsNotEmpty()
  organizationId!: string;

  @ApiProperty({ example: 'STR-01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  storeCode!: string;

  @ApiProperty({ example: 'Downtown Bistro & Cafe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ example: '123 Main Street, Suite 100' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Berlin' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'DE' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: '10117' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: '+49 30 1234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'store@restaurant.de' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'EUR', default: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string = 'EUR';

  @ApiPropertyOptional({ example: 'Europe/Berlin', default: 'Europe/Berlin' })
  @IsOptional()
  @IsString()
  timezone?: string = 'Europe/Berlin';
}

export class UpdateStoreDto {
  @ApiPropertyOptional({ example: 'Downtown Bistro & Lounge' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '123 Main Street, Suite 200' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Berlin' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'DE' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: '10117' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: '+49 30 1234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'store@restaurant.de' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'Europe/Berlin' })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class StoreResponseDto {
  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000002' })
  id!: string;

  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000001' })
  organizationId!: string;

  @ApiProperty({ example: 'STR-01' })
  storeCode!: string;

  @ApiProperty({ example: 'Downtown Bistro & Cafe' })
  name!: string;

  @ApiPropertyOptional({ example: '123 Main Street, Suite 100' })
  address?: string;

  @ApiPropertyOptional({ example: 'Berlin' })
  city?: string;

  @ApiPropertyOptional({ example: 'DE' })
  country?: string;

  @ApiPropertyOptional({ example: '10117' })
  postalCode?: string;

  @ApiPropertyOptional({ example: '+49 30 1234567' })
  phone?: string;

  @ApiPropertyOptional({ example: 'store@restaurant.de' })
  email?: string;

  @ApiProperty({ example: 'EUR' })
  currency!: string;

  @ApiProperty({ example: 'Europe/Berlin' })
  timezone!: string;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-08-20T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-20T00:00:00.000Z' })
  updatedAt!: string;
}
