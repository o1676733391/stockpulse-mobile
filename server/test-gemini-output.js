const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { GoogleAuth } = require('google-auth-library');

dotenv.config();

async function inspectGemini() {
  console.log('======================================================================');
  console.log('  StockPulse Gemini Multimodal Vision Live Inspection & Logs');
  console.log('======================================================================\n');

  const apiKey = process.env.GEMINI_API_KEY || '';
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const gcpProjectId = process.env.GCP_PROJECT_ID || 'ocr-stem';
  const gcpLocation = process.env.GCP_LOCATION || 'us-central1';
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';

  const isVertexAi = Boolean(credPath && fs.existsSync(credPath));

  console.log('[1] Configuration & Credentials:');
  console.log(`  • Model:                ${model}`);
  console.log(`  • Engine:               ${isVertexAi ? 'Google Cloud Vertex AI (Service Account)' : 'Google AI Studio (API Key)'}`);
  console.log(`  • GCP Project ID:       ${gcpProjectId}`);
  console.log(`  • GCP Location:         ${gcpLocation}`);
  console.log(`  • Service Account Key:  ${credPath ? (fs.existsSync(credPath) ? '✅ Loaded (' + credPath + ')' : '❌ Not Found') : '[None]'}`);
  console.log(`  • API Key:              ${apiKey ? '✅ Configured (' + apiKey.slice(0, 6) + '...' + apiKey.slice(-4) + ')' : '[None]'}`);

  // Load sample image
  const samplePaths = [
    path.resolve(__dirname, '../data-sample/receipt/rec-1.jpg'),
    path.resolve(__dirname, 'data-sample/receipt/rec-1.jpg'),
  ];
  let sampleBuffer = null;
  let samplePathUsed = '';
  for (const sp of samplePaths) {
    if (fs.existsSync(sp)) {
      sampleBuffer = fs.readFileSync(sp);
      samplePathUsed = sp;
      break;
    }
  }

  if (!sampleBuffer) {
    console.log('\n[!] No local sample receipt found, generating synthetic test buffer.');
    sampleBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xd9]);
  } else {
    console.log(`\n[2] Sample Image Loaded: ${samplePathUsed} (${sampleBuffer.length} bytes, ${(sampleBuffer.length / 1024).toFixed(1)} KB)`);
  }

  const base64Data = sampleBuffer.toString('base64');

  const systemPrompt = `You are an expert F&B (Food & Beverage) OCR and Inventory Intelligence AI agent specialized in European and International hospitality markets (English, German, and Dutch).
Analyze the provided receipt, POS end-of-day Z-report / register closure, or supplier delivery invoice image.
Extract all sold or purchased line items, quantities, prices, taxes, and metadata with high precision.

Language & Regional Expertise:
1. English: Common hospitality terms ('Receipt', 'Tax Invoice', 'Subtotal', 'VAT', 'Total Due').
2. German: Kassenzettel, Bewirtungsbeleg, Z-Bon, Tagesabschluss, Lieferantenrechnung ('Rechnungs-Nr', 'Datum', 'USt / MwSt', 'Netto', 'Brutto', 'Gesamtsumme').
3. Dutch: Kassabon, Dagafsluiting, Z-Rapport ('Factuurnummer', 'Btw-tarief', 'Excl. Btw', 'Incl. Btw', 'Totaal te betalen').

Numerical Rules: Parse European comma decimals (12,50 -> 12.50). Assign realistic confidence (0.0 to 1.0).

Respond ONLY with valid JSON conforming to this schema:
{
  "metadata": {
    "documentNumber": "string",
    "date": "YYYY-MM-DD",
    "supplierName": "string",
    "currency": "EUR",
    "netAmount": 0.0,
    "taxAmount": 0.0,
    "totalAmount": 0.0
  },
  "lineItems": [
    {
      "lineNumber": 1,
      "description": "Standardized item name",
      "rawText": "Exact line text",
      "quantity": 1,
      "unitPrice": 14.0,
      "totalPrice": 28.0,
      "confidence": 0.98
    }
  ]
}`;

  console.log('\n[3] Dispatching Request to Gemini API...');
  const headers = { 'Content-Type': 'application/json' };
  let endpoint = '';

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: systemPrompt },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      response_mime_type: 'application/json',
      temperature: 0.1,
    },
  };

  const startTime = Date.now();

  try {
    if (isVertexAi) {
      const auth = new GoogleAuth({
        keyFilename: credPath,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
      const authClient = await auth.getClient();
      const tokenResponse = await authClient.getAccessToken();
      headers['Authorization'] = `Bearer ${tokenResponse.token}`;

      const location = gcpLocation === 'us' ? 'us-central1' : gcpLocation;
      endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${gcpProjectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
      console.log(`  • Endpoint (Vertex AI): ${endpoint}`);
    } else {
      endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      console.log(`  • Endpoint (AI Studio): https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=[MASKED]`);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const elapsedMs = Date.now() - startTime;
    console.log(`\n[4] Gemini Response Received in ${elapsedMs}ms (HTTP ${response.status} ${response.statusText})`);

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`  ❌ Gemini API Error:\n${errBody}`);
      return;
    }

    const jsonRes = await response.json();
    console.log('\n--- Raw Gemini Response JSON Structure ---');
    console.log(JSON.stringify({
      candidatesCount: jsonRes?.candidates?.length || 0,
      finishReason: jsonRes?.candidates?.[0]?.finishReason,
      usageMetadata: jsonRes?.usageMetadata,
    }, null, 2));

    const rawText = jsonRes?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    console.log('\n--- Gemini Extracted Content ---');
    console.log(rawText);

    const parsed = JSON.parse(rawText);

    console.log('\n======================================================================');
    console.log('  Extracted Document Metadata');
    console.log('======================================================================');
    console.log(`  • Document No:  ${parsed.metadata?.documentNumber || 'N/A'}`);
    console.log(`  • Date:         ${parsed.metadata?.date || 'N/A'}`);
    console.log(`  • Supplier/POS: ${parsed.metadata?.supplierName || 'N/A'}`);
    console.log(`  • Net Amount:   ${parsed.metadata?.netAmount !== undefined ? parsed.metadata?.currency + ' ' + parsed.metadata?.netAmount : 'N/A'}`);
    console.log(`  • Tax Amount:   ${parsed.metadata?.taxAmount !== undefined ? parsed.metadata?.currency + ' ' + parsed.metadata?.taxAmount : 'N/A'}`);
    console.log(`  • Total Amount: ${parsed.metadata?.totalAmount !== undefined ? parsed.metadata?.currency + ' ' + parsed.metadata?.totalAmount : 'N/A'}`);

    console.log('\n======================================================================');
    console.log(`  Extracted Line Items (${parsed.lineItems?.length || 0} items)`);
    console.log('======================================================================');
    (parsed.lineItems || []).forEach((item, idx) => {
      console.log(`  [${item.lineNumber || idx + 1}] ${item.description || item.rawText}`);
      console.log(`      Qty: ${item.quantity} | Unit: €${item.unitPrice || 0} | Total: €${item.totalPrice || 0} | Confidence: ${(item.confidence * 100).toFixed(1)}%`);
    });

  } catch (err) {
    console.error(`\n❌ Execution Error: ${err.message}`, err.stack);
  }
}

inspectGemini();
