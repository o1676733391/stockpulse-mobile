import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode!: number;

  @ApiProperty({
    example: 'Validation failed',
    description: 'Error title or primary message',
  })
  message!: string | string[];

  @ApiProperty({
    example: 'Bad Request',
    description: 'HTTP error reason phrase',
  })
  error!: string;

  @ApiPropertyOptional({
    example: '01915dfa-b1c4-7221-9988-000000000001',
    description: 'Unique trace identifier for debugging',
  })
  correlationId?: string;

  @ApiProperty({
    example: '2026-08-20T08:30:00.000Z',
    description: 'ISO 8601 server timestamp',
  })
  timestamp!: string;

  @ApiProperty({
    example: '/api/v1/inventory/items',
    description: 'Request path that triggered the error',
  })
  path!: string;
}

export class UnauthorizedErrorDto {
  @ApiProperty({ example: 401 })
  statusCode!: number;

  @ApiProperty({ example: 'Invalid or expired Supabase JWT token' })
  message!: string;

  @ApiProperty({ example: 'Unauthorized' })
  error!: string;
}

export class ForbiddenErrorDto {
  @ApiProperty({ example: 403 })
  statusCode!: number;

  @ApiProperty({ example: 'User does not possess the required permissions: [inventory:adjust]' })
  message!: string;

  @ApiProperty({ example: 'Forbidden' })
  error!: string;
}

export class NotFoundErrorDto {
  @ApiProperty({ example: 404 })
  statusCode!: number;

  @ApiProperty({ example: 'Inventory item with ID "01915dfa-b1c4-..." not found' })
  message!: string;

  @ApiProperty({ example: 'Not Found' })
  error!: string;
}

export class ConflictErrorDto {
  @ApiProperty({ example: 409 })
  statusCode!: number;

  @ApiProperty({ example: 'Inventory SKU "DAI-001" already exists in store' })
  message!: string;

  @ApiProperty({ example: 'Conflict' })
  error!: string;
}
