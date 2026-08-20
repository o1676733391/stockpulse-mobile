import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number (1-indexed)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20, description: 'Number of items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 0, default: 0, description: 'Offset for cursor queries' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({ example: 'milk', description: 'Search term for name/SKU/code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'created_at', default: 'createdAt', description: 'Field to sort by' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'DESC', enum: ['ASC', 'DESC', 'asc', 'desc'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC', 'asc', 'desc'])
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc' = 'DESC';
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1, description: 'Current page number' })
  page!: number;

  @ApiProperty({ example: 20, description: 'Items requested per page' })
  limit!: number;

  @ApiProperty({ example: 45, description: 'Total records across all pages' })
  total!: number;

  @ApiProperty({ example: 3, description: 'Total available pages' })
  totalPages!: number;

  @ApiProperty({ example: true, description: 'Whether next page exists' })
  hasNextPage!: boolean;

  @ApiProperty({ example: false, description: 'Whether previous page exists' })
  hasPreviousPage!: boolean;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true, description: 'List of records' })
  data!: T[];

  @ApiProperty({ type: () => PaginationMetaDto, description: 'Pagination metadata' })
  meta!: PaginationMetaDto;
}
