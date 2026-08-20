import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ example: 'SUP-001', description: 'Unique vendor identifier code' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  supplierCode!: string;

  @ApiProperty({ example: 'Fresh Farms Direct', description: 'Supplier commercial business name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ example: 'John Miller', description: 'Primary contact representative' })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({ example: 'orders@freshfarms.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+1 555-0199' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 2, default: 1, description: 'Order lead time in business days' })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number = 1;

  @ApiPropertyOptional({ example: 'Net 30', description: 'Agreed commercial payment terms' })
  @IsOptional()
  @IsString()
  paymentTerms?: string;
}

export class UpdateSupplierDto {
  @ApiPropertyOptional({ example: 'Fresh Farms Direct LLC' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'John Miller' })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({ example: 'orders@freshfarms.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+1 555-0199' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @ApiPropertyOptional({ example: 'Net 15' })
  @IsOptional()
  @IsString()
  paymentTerms?: string;
}

export class SupplierResponseDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e020' })
  id!: string;

  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000002' })
  storeId!: string;

  @ApiProperty({ example: 'SUP-001' })
  supplierCode!: string;

  @ApiProperty({ example: 'Fresh Farms Direct' })
  name!: string;

  @ApiPropertyOptional({ example: 'John Miller' })
  contactName?: string;

  @ApiPropertyOptional({ example: 'orders@freshfarms.com' })
  email?: string;

  @ApiPropertyOptional({ example: '+1 555-0199' })
  phone?: string;

  @ApiProperty({ example: 2 })
  leadTimeDays!: number;

  @ApiPropertyOptional({ example: 'Net 30' })
  paymentTerms?: string;

  @ApiProperty({ example: '2026-08-20T00:00:00.000Z' })
  createdAt!: string;
}
