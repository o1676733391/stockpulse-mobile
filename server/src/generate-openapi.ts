import * as fs from 'fs';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as YAML from 'yaml';
import { AppModule } from './app.module';

async function generateOpenApiSpec() {
  const app = await NestFactory.create(AppModule, { logger: false });

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

  const docsDir = path.resolve(__dirname, '../../docs/api');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // 1. Export JSON format
  const jsonPath = path.join(docsDir, 'openapi.json');
  fs.writeFileSync(jsonPath, JSON.stringify(document, null, 2), 'utf-8');
  console.log(`[OpenAPI Generator] Successfully generated JSON: ${jsonPath}`);

  // 2. Export YAML format
  const yamlPath = path.join(docsDir, 'openapi.yaml');
  fs.writeFileSync(yamlPath, YAML.stringify(document), 'utf-8');
  console.log(`[OpenAPI Generator] Successfully generated YAML: ${yamlPath}`);

  await app.close();
  process.exit(0);
}

generateOpenApiSpec().catch((err) => {
  console.error('[OpenAPI Generator] Error:', err);
  process.exit(1);
});
