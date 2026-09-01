import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptimeSeconds: number;
  version: string;
  environment: string;
  region: string;
  services: {
    database: string;
    ocr: string;
  };
}

@ApiTags('Health')
@Controller()
export class HealthController {
  private readonly startupTime = Date.now();

  @Get(['health', 'api/v1/health'])
  @Public()
  @ApiOperation({
    summary: 'Cloud Run & Uptime Liveness Health Check',
    description:
      'Lightweight, non-blocking health check endpoint for Google Cloud Run startup and liveness probes. Returns 200 OK without exposing secrets or calling expensive external APIs.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy and ready to accept traffic',
  })
  check(): HealthCheckResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startupTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      region: process.env.GCP_LOCATION || 'europe-west3',
      services: {
        database: 'supabase-postgresql',
        ocr: process.env.OCR_DEFAULT_PROVIDER || 'gemini_vision',
      },
    };
  }
}
