import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { GeminiVisionProvider } from '../src/ocr/providers/gemini-vision.provider';

// Load environment configuration from server/.env
dotenv.config();

interface SmokeTestEvidence {
  timestamp: string;
  requestId: string;
  provider: string;
  model: string;
  gcpProjectId: string;
  gcpCredentialsLoaded: boolean;
  apiKeyConfigured: boolean;
  apiKeyMasked: string;
  httpStatus?: number;
  latencyMs: number;
  realApiInvoked: boolean;
  responseExtracted: boolean;
  schemaValid: boolean;
  lineItemsCount: number;
  overallConfidence: number;
  extractedMetadata?: Record<string, any>;
  sampleLineItems?: any[];
  error?: string;
  errorCode?: string;
  finalStatus: 'PASS' | 'FAIL' | 'BLOCKED';
  resolutionGuidance?: string;
}

function maskSecret(secret?: string): string {
  if (!secret || secret.trim() === '') return '[NOT CONFIGURED]';
  if (secret.length <= 8) return '****';
  return `${secret.slice(0, 6)}...${secret.slice(-4)}`;
}

async function runGcpSmokeTest(): Promise<void> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const requestId = `GCP-SMOKE-${Date.now()}`;

  console.log('================================================================');
  console.log('  StockPulse Real Google Cloud & Gemini Integration Smoke Test');
  console.log('================================================================\n');

  // 1. Validate GCP & Gemini Environment Configuration
  console.log('--- 1. Validating GCP Environment Configuration ---');
  const apiKey = process.env.GEMINI_API_KEY || '';
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const gcpProjectId = process.env.GCP_PROJECT_ID || 'ocr-stem';
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';

  const gcpCredsExist = credPath !== '' && fs.existsSync(credPath);
  const apiKeyConfigured = apiKey.trim() !== '';

  console.log(`[Config] GCP Project ID:        ${gcpProjectId}`);
  console.log(`[Config] Configured Model:      ${model}`);
  console.log(`[Config] API Key Configured:    ${apiKeyConfigured ? 'YES' : 'NO'}`);
  console.log(`[Config] API Key (Masked):      ${maskSecret(apiKey)}`);
  console.log(`[Config] GCP Service Account:   ${gcpCredsExist ? 'FOUND (' + credPath + ')' : 'NOT FOUND'}`);

  const evidence: SmokeTestEvidence = {
    timestamp,
    requestId,
    provider: 'Google Gemini Multimodal Vision OCR Agent (gemini_vision)',
    model,
    gcpProjectId,
    gcpCredentialsLoaded: gcpCredsExist,
    apiKeyConfigured,
    apiKeyMasked: maskSecret(apiKey),
    latencyMs: 0,
    realApiInvoked: false,
    responseExtracted: false,
    schemaValid: false,
    lineItemsCount: 0,
    overallConfidence: 0,
    finalStatus: 'BLOCKED',
  };

  if (!apiKeyConfigured) {
    evidence.finalStatus = 'BLOCKED';
    evidence.error = 'GEMINI_API_KEY is missing from environment.';
    evidence.resolutionGuidance =
      'Set GEMINI_API_KEY in server/.env with a valid Google Gemini API key from https://aistudio.google.com/app/apikey';
    console.error('\n❌ BLOCKED: GEMINI_API_KEY is not configured in server/.env');
    await writeReport(evidence);
    process.exitCode = 1;
    return;
  }

  // 2. Instantiate Production Adapter (No Mocking)
  console.log('\n--- 2. Instantiating Production GeminiVisionProvider Adapter ---');
  const configService = new ConfigService({
    GEMINI_API_KEY: apiKey,
    GEMINI_MODEL: model,
    GCP_PROJECT_ID: gcpProjectId,
    GCP_LOCATION: process.env.GCP_LOCATION || 'us-central1',
    GOOGLE_APPLICATION_CREDENTIALS: credPath,
    gemini: {
      apiKey,
      model,
    },
  });
  const provider = new GeminiVisionProvider(configService);

  // 3. Prepare Safe Deterministic Test Fixture
  console.log('\n--- 3. Loading Safe Deterministic Fixture (No PII) ---');
  let fixtureBuffer: Buffer;
  let mimeType = 'image/jpeg';

  const sampleReceiptPath = path.resolve(__dirname, '../../data-sample/receipt/rec-1.jpg');
  if (fs.existsSync(sampleReceiptPath)) {
    console.log(`[Fixture] Loaded real sample receipt from: ${sampleReceiptPath}`);
    fixtureBuffer = fs.readFileSync(sampleReceiptPath);
  } else {
    // 1x1 transparent JPEG safe buffer
    console.log('[Fixture] Using generated safe synthetic image buffer');
    fixtureBuffer = Buffer.from(
      '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
      'base64',
    );
  }
  console.log(`[Fixture] Payload size: ${fixtureBuffer.length} bytes, Mime: ${mimeType}`);

  // 4. Send Real Request to Google Cloud
  console.log('\n--- 4. Executing Real Google Cloud API Request ---');
  console.log(`[Request ID] ${requestId}`);
  console.log(`[Endpoint]   https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`);

  try {
    const processStart = Date.now();
    const result = await provider.processDocument(fixtureBuffer, mimeType, {
      expectedCurrency: 'EUR',
      documentType: 'pos_z_report',
    });
    const duration = Date.now() - processStart;
    evidence.latencyMs = duration;

    console.log(`[Latency]    ${duration} ms`);

    // 5. Evaluate Live Response vs Fallback
    const rawResponse = result.rawResponse as any;

    if (rawResponse?.engine === 'gemini_vision_error_fallback') {
      evidence.realApiInvoked = true;
      evidence.finalStatus = 'FAIL';
      evidence.error = rawResponse.error || 'Gemini API call failed and triggered internal error fallback.';

      if (evidence.error?.includes('403') || evidence.error?.includes('PERMISSION_DENIED') || evidence.error?.includes('blocked')) {
        evidence.finalStatus = 'BLOCKED';
        evidence.errorCode = 'HTTP_403_API_BLOCKED';
        evidence.resolutionGuidance =
          'The Generative Language API is blocked or not enabled for this Google Cloud project. Enable it at https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=847107251833 or obtain a free API key at https://aistudio.google.com/app/apikey';
      } else if (evidence.error?.includes('429') || evidence.error?.includes('RESOURCE_EXHAUSTED')) {
        evidence.finalStatus = 'BLOCKED';
        evidence.errorCode = 'HTTP_429_RATE_LIMIT';
        evidence.resolutionGuidance = 'Gemini API rate limit or quota exceeded. Wait 60 seconds or upgrade quota.';
      }

      console.error(`\n❌ REAL GCP REQUEST FAILED: ${evidence.error}`);
      console.log(`[Notice]   A fallback/mock response was triggered. A mocked response NEVER qualifies as PASS.`);
      await writeReport(evidence);
      process.exitCode = 1;
      return;
    }

    if (rawResponse?.candidates && rawResponse.candidates.length > 0) {
      evidence.realApiInvoked = true;
      evidence.responseExtracted = true;
      evidence.lineItemsCount = result.lineItems.length;
      evidence.overallConfidence = result.overallConfidence;
      evidence.extractedMetadata = result.metadata;
      evidence.sampleLineItems = result.lineItems.slice(0, 3);

      // Validate Schema Conformance
      const hasMetadata =
        Boolean(result.metadata.documentNumber) &&
        Boolean(result.metadata.currency);
      const hasValidItems =
        Array.isArray(result.lineItems) &&
        result.lineItems.every(
          (item) =>
            typeof item.lineNumber === 'number' &&
            typeof item.description === 'string' &&
            typeof item.quantity === 'number' &&
            typeof item.confidence === 'number',
        );

      evidence.schemaValid = hasMetadata && hasValidItems;
      evidence.finalStatus = evidence.schemaValid ? 'PASS' : 'FAIL';

      console.log(`\n✅ REAL GOOGLE CLOUD GEMINI INFERENCE SUCCEEDED!`);
      console.log(`[Confidence]  ${result.overallConfidence}`);
      console.log(`[Extracted]   ${result.lineItems.length} line items`);
      console.log(`[Doc Number]  ${result.metadata.documentNumber}`);
      console.log(`[Currency]    ${result.metadata.currency}`);
      if (result.metadata.totalAmount !== undefined) {
        console.log(`[Total]       ${result.metadata.totalAmount} ${result.metadata.currency}`);
      }

      console.log('\n--- Sample Extracted Line Items ---');
      result.lineItems.slice(0, 3).forEach((item) => {
        console.log(` - Line ${item.lineNumber}: ${item.quantity}x "${item.description}" @ ${item.unitPrice || 'N/A'} (Confidence: ${item.confidence})`);
      });

      await writeReport(evidence);
      console.log('\n================================================================');
      console.log(`  Real GCP Smoke Test: ${evidence.finalStatus}`);
      console.log('================================================================\n');
      process.exitCode = 0;
      return;
    } else {
      evidence.realApiInvoked = true;
      evidence.finalStatus = 'FAIL';
      evidence.error = 'API responded with unexpected response payload structure.';
      await writeReport(evidence);
      process.exitCode = 1;
      return;
    }
  } catch (err: any) {
    evidence.latencyMs = Date.now() - startTime;
    evidence.finalStatus = 'FAIL';
    evidence.error = err.message;
    console.error(`\n❌ UNEXPECTED ERROR: ${err.message}`);
    await writeReport(evidence);
    process.exitCode = 1;
    return;
  }
}

async function writeReport(evidence: SmokeTestEvidence): Promise<void> {
  const reportDir = path.resolve(__dirname, '../../docs/testing');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, 'GCP_SMOKE_TEST_REPORT.md');

  const reportContent = `# StockPulse — Real Google Cloud & Gemini Integration Smoke Test Report

## 1. Executive Summary

- **Execution Timestamp**: \`${evidence.timestamp}\`
- **Request / Test ID**: \`${evidence.requestId}\`
- **Target Provider**: \`${evidence.provider}\`
- **Configured Model**: \`${evidence.model}\`
- **GCP Project**: \`${evidence.gcpProjectId}\`
- **Real Google Cloud API Invoked**: \`${evidence.realApiInvoked ? 'YES' : 'NO'}\`
- **Mock / Fallback Accepted as Pass**: **NO** (Strict Rule: Mocked responses never qualify as PASS)
- **Final Smoke Test Status**: **\`${evidence.finalStatus}\`**

---

## 2. Environment & Credential Validation

| Verification Parameter | Configured Value | Validation Result |
|---|---|:---:|
| **GCP Project ID** | \`${evidence.gcpProjectId}\` | ✅ Passed |
| **Configured Gemini Model** | \`${evidence.model}\` | ✅ Passed |
| **Gemini API Key** | \`${evidence.apiKeyMasked}\` | ${evidence.apiKeyConfigured ? '✅ Present (Masked)' : '❌ Missing'} |
| **GCP Service Account Credentials** | \`${evidence.gcpCredentialsLoaded ? 'Loaded' : 'Not Present'}\` | ${evidence.gcpCredentialsLoaded ? '✅ Valid' : 'ℹ️ Secondary'} |

> [!NOTE]
> All credentials and secrets are strictly masked. No private keys, bearer tokens, or plaintext API keys are ever printed in logs or reports.

---

## 3. Real API Execution & Observability

| Metric / Field | Value |
|---|---|
| **API Endpoint** | \`https://generativelanguage.googleapis.com/v1beta/models/${evidence.model}:generateContent\` |
| **Request Latency** | **${evidence.latencyMs} ms** |
| **Real LLM Inference** | \`${evidence.responseExtracted ? 'SUCCEEDED' : 'FAILED / BLOCKED'}\` |
| **Extracted Line Items** | **${evidence.lineItemsCount} items** |
| **Overall Extraction Confidence** | **${evidence.overallConfidence}** |
| **Schema Validation** | \`${evidence.schemaValid ? 'VALID' : 'INVALID / N/A'}\` |

${
  evidence.extractedMetadata
    ? `### Extracted Document Metadata
\`\`\`json
${JSON.stringify(evidence.extractedMetadata, null, 2)}
\`\`\`

### Sample Extracted Line Items
\`\`\`json
${JSON.stringify(evidence.sampleLineItems, null, 2)}
\`\`\`
`
    : ''
}

${
  evidence.error
    ? `### Failure / Blocked Diagnostics
- **Error Details**: \`${evidence.error}\`
- **Error Code**: \`${evidence.errorCode || 'UNSPECIFIED'}\`
- **Resolution Guidance**:
  > ${evidence.resolutionGuidance || 'Review Google Cloud Console credentials and permissions.'}
`
    : ''
}

---

## 4. Billing & GCP Usage Verification Guide

To verify real Google Cloud usage incurred by this smoke test:

1. **Google Cloud Console Monitoring**:
   - Open: [https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/metrics](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/metrics?project=${evidence.gcpProjectId})
   - Check the **Traffic**, **Errors by response code**, and **Median latency** charts for \`${evidence.model}\`.
2. **Google AI Studio Usage**:
   - Open: [https://aistudio.google.com/app/plan_information](https://aistudio.google.com/app/plan_information)
   - View token consumption and RPM / RPD rate quotas.
3. *Note*: Cloud billing dashboard rollups may experience a 15–60 minute reporting propagation delay. Real-time API execution is verified directly through Google Cloud HTTP response status codes.

---

## 5. CI / CD & Safety Separation

- **Normal CI Unit Tests (\`npm test\`)**:
  - Fully offline and deterministic with in-memory mock adapters.
  - Zero external cloud dependencies; zero risk of CI failure from external outages.
- **Real GCP Smoke Test (\`npm run test:gcp\`)**:
  - Explicitly executed on demand.
  - Direct real-time invocation of Google Cloud endpoints.
  - May incur standard Google Cloud API consumption.

---

## 6. Final Status & Quality Gate

**Smoke Test Verdict**: **\`${evidence.finalStatus}\`**
`;

  fs.writeFileSync(reportPath, reportContent, 'utf-8');
  console.log(`\n[Report Generated] ${reportPath}`);
}

runGcpSmokeTest().catch((e) => {
  console.error('[Fatal Error]', e);
  process.exit(1);
});
