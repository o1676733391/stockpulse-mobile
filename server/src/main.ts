import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

import { json, urlencoded } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Increase payload limit for base64 OCR receipt images
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  const configService = app.get(ConfigService);
  const port = parseInt(process.env.PORT || '', 10) || configService.get<number>('app.port') || 8080;
  const apiPrefix = configService.get<string>('app.apiPrefix') || '/api/v1';
  const nodeEnv = configService.get<string>('app.nodeEnv') || process.env.NODE_ENV || 'development';
  const swaggerEnabled =
    process.env.SWAGGER_ENABLED === 'true' ||
    configService.get<boolean>('app.swaggerEnabled') ||
    nodeEnv !== 'production';

  // Global API Routing Prefix (exclude /health and /api/v1/health for direct Cloud Run startup/liveness probes and v1 clients)
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['health', 'api/v1/health'],
  });

  // Global Request Validation Pipeline
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Cross-Origin Resource Sharing
  const corsOriginsConfig = configService.get<string>('app.corsOrigins') || process.env.CORS_ORIGINS || '*';
  const allowedOrigins = corsOriginsConfig === '*'
    ? '*'
    : corsOriginsConfig.split(',').map((o) => o.trim());

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // OpenAPI / Swagger Documentation
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('StockPulse SaaS API')
      .setDescription(
        `## Multi-Tenant F&B Inventory & Intelligence Platform API

StockPulse provides unified backend capabilities for restaurant and cloud kitchen inventory intelligence, FEFO lot management, Document AI & Gemini Vision OCR processing, and finite-state procurement workflows.

### Universal Request Protocols
- **Authentication**: Bearer JWT token issued by Supabase Auth (\`Authorization: Bearer <token>\`).
- **Multi-Tenancy Context**: Store location context must be passed via the \`X-Store-Id\` header.
- **Idempotency**: Critical mutations support \`Idempotency-Key\` header for replay protection.
- **Concurrency**: Optimistic locking supported via version tags.
`,
      )
      .setVersion('1.0.0')
      .addTag('Authentication', 'Authentication, Tenant Registration, Store Switching, and Supabase Webhooks')
      .addTag('Inventory', 'Master catalog, stock balances, FEFO batch tracking, and manual adjustments')
      .addTag('Stock Counts', 'Blind & standard count sessions, shrinkage calculation, and variance ledger sync')
      .addTag('OCR', 'Google Gemini Multimodal Vision & Document AI OCR, review workflow, and BOM deductions')
      .addTag('Procurement', 'Purchase Orders (Draft/Submit/Approve/Receive/Cancel) and Goods Receipts')
      .addTag('Suppliers', 'Supplier master directory, payment terms, and lead time tracking')
      .addTag('Notifications', 'In-app notifications, device push tokens, and notification preferences')
      .addTag('Audit', 'Cryptographic WORM audit logging, SHA-256 hash chaining, and ledger integrity verification')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter Supabase JWT Access Token',
          in: 'header',
        },
        'BearerAuth',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'X-Store-Id',
          in: 'header',
          description: 'Active store tenant UUID context',
        },
        'StoreIdHeader',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

    logger.log(`Swagger OpenAPI Documentation enabled: http://0.0.0.0:${port}${apiPrefix}/docs`);
  } else {
    logger.log('Swagger OpenAPI Documentation disabled in production (SWAGGER_ENABLED=false)');
  }

  await app.listen(port, '0.0.0.0');
  logger.log(`StockPulse SaaS Backend running on: http://0.0.0.0:${port}${apiPrefix} (Health: http://0.0.0.0:${port}/health)`);
}

bootstrap();
