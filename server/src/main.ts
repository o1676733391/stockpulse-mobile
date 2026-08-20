import * as fs from 'fs';
import * as path from 'path';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;
  const apiPrefix = configService.get<string>('app.apiPrefix') || '/api/v1';

  // Global API Routing Prefix
  app.setGlobalPrefix(apiPrefix);

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
  app.enableCors({
    origin: configService.get<string>('app.corsOrigins') || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('StockPulse SaaS API')
    .setDescription(
      `## Multi-Tenant F&B Inventory & Intelligence Platform API

StockPulse provides unified backend capabilities for restaurant and cloud kitchen inventory intelligence, FEFO lot management, Document AI OCR processing, and finite-state procurement workflows.

### Universal Request Protocols
- **Authentication**: Bearer JWT token issued by Supabase Auth (\`Authorization: Bearer <token>\`).
- **Multi-Tenancy Context**: Store location context must be passed via the \`X-Store-Id\` header.
- **Idempotency**: Critical mutations support \`Idempotency-Key\` header for replay protection.
- **Concurrency**: Optimistic locking supported via version tags.
`,
    )
    .setVersion('1.0.0')
    .addTag('Auth', 'Authentication, Tenant Registration, Store Switching, and Supabase Webhooks')
    .addTag('Users', 'User account provisioning and RBAC store assignments')
    .addTag('Organizations', 'Tenant organization entity and subscription plan management')
    .addTag('Stores', 'Store location branches, operational currency, and timezones')
    .addTag('Inventory', 'Master catalog, stock balances, FEFO batch tracking, and manual adjustments')
    .addTag('Stock Count', 'Blind & standard count sessions, shrinkage calculation, and variance ledger sync')
    .addTag('OCR', 'Google Document AI integration, presigned uploads, review workflow, and BOM deductions')
    .addTag('Procurement', 'Purchase Orders (Draft/Submit/Approve/Receive/Cancel) and Goods Receipts')
    .addTag('Suppliers', 'Supplier master directory, payment terms, and lead time tracking')
    .addTag('Notifications', 'In-app notifications, device push tokens, and notification preferences')
    .addTag('Audit', 'Cryptographic WORM audit logging, hash chaining, and ledger integrity verification')
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

  // Write static OpenAPI JSON spec to docs/api/openapi.json
  try {
    const docsDir = path.resolve(__dirname, '../../docs/api');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(docsDir, 'openapi.json'),
      JSON.stringify(document, null, 2),
      'utf-8',
    );
    logger.log(`Exported production OpenAPI spec to: ${path.join(docsDir, 'openapi.json')}`);
  } catch (err: any) {
    logger.warn(`Could not export static openapi.json: ${err.message}`);
  }

  await app.listen(port);
  logger.log(`StockPulse SaaS Backend running on: http://localhost:${port}${apiPrefix}`);
  logger.log(`Swagger OpenAPI Documentation: http://localhost:${port}${apiPrefix}/docs`);
}

bootstrap();
