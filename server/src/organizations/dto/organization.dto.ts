import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Union Street Cafe Group' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'union-street-cafe' })
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiPropertyOptional({ example: 'US-99201923' })
  @IsOptional()
  @IsString()
  taxIdentifier?: string;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'Union Street Cafe Global Group' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'US-99201923' })
  @IsOptional()
  @IsString()
  taxIdentifier?: string;
}

export class OrganizationResponseDto {
  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000001' })
  id!: string;

  @ApiProperty({ example: 'Union Street Cafe Group' })
  name!: string;

  @ApiProperty({ example: 'union-street-cafe' })
  slug!: string;

  @ApiPropertyOptional({ example: 'US-99201923' })
  taxIdentifier?: string;

  @ApiProperty({ example: 'pro', enum: ['free', 'starter', 'pro', 'enterprise'] })
  subscriptionPlan!: string;

  @ApiProperty({ example: 'active', enum: ['active', 'past_due', 'canceled'] })
  subscriptionStatus!: string;

  @ApiProperty({ example: '2026-08-20T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-20T00:00:00.000Z' })
  updatedAt!: string;
}
