import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ example: true, description: 'Indicates whether the request was successful' })
  success!: boolean;

  @ApiPropertyOptional({ example: 'Operation completed successfully', description: 'User-friendly message' })
  message?: string;

  @ApiProperty({ description: 'Payload data' })
  data!: T;

  @ApiProperty({ example: '2026-08-20T08:30:00.000Z', description: 'ISO 8601 server timestamp' })
  timestamp!: string;
}
