/**
 * Deterministic Mock Gemini Multimodal Agent OCR Fixtures
 * For local and CI automated testing without calling live Google APIs.
 */

export const MOCK_CLEAR_GERMAN_RECEIPT = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: JSON.stringify({
              metadata: {
                documentNumber: 'BON-DE-20260820-001',
                date: '2026-08-20',
                supplierName: 'Brauhaus & Biergarten München',
                currency: 'EUR',
                netAmount: 38.66,
                taxAmount: 7.34,
                totalAmount: 46.0,
              },
              lineItems: [
                {
                  lineNumber: 1,
                  description: 'Schnitzel Wiener Art m. Pommes',
                  rawText: '2x Schnitzel Wiener Art 16.50 33.00',
                  quantity: 2,
                  unitPrice: 16.5,
                  totalPrice: 33.0,
                  confidence: 0.98,
                },
                {
                  lineNumber: 2,
                  description: 'Apfelschorle 0.5L',
                  rawText: '2x Apfelschorle 0.5l 4.50 9.00',
                  quantity: 2,
                  unitPrice: 4.5,
                  totalPrice: 9.0,
                  confidence: 0.97,
                },
                {
                  lineNumber: 3,
                  description: 'Espresso einfach',
                  rawText: '2x Espresso 2.00 4.00',
                  quantity: 2,
                  unitPrice: 2.0,
                  totalPrice: 4.0,
                  confidence: 0.99,
                },
              ],
            }),
          },
        ],
      },
    },
  ],
};

export const MOCK_CLEAR_DUTCH_RECEIPT = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: JSON.stringify({
              metadata: {
                documentNumber: 'BON-NL-99218',
                date: '2026-08-20',
                supplierName: 'Grand Café de Gracht Amsterdam',
                currency: 'EUR',
                netAmount: 22.94,
                taxAmount: 2.06,
                totalAmount: 25.0,
              },
              lineItems: [
                {
                  lineNumber: 1,
                  description: 'Bitterballen (8 Stk)',
                  rawText: '1x Bitterballen 8st 8.50 8.50',
                  quantity: 1,
                  unitPrice: 8.5,
                  totalPrice: 8.5,
                  confidence: 0.96,
                },
                {
                  lineNumber: 2,
                  description: 'Koffie Verkeerd',
                  rawText: '2x Koffie verkeerd 4.00 8.00',
                  quantity: 2,
                  unitPrice: 4.0,
                  totalPrice: 8.0,
                  confidence: 0.95,
                },
                {
                  lineNumber: 3,
                  description: 'Heineken Tap 0.5L',
                  rawText: '1x Bier v.d. Tap 0.5l 8.50 8.50',
                  quantity: 1,
                  unitPrice: 8.5,
                  totalPrice: 8.5,
                  confidence: 0.94,
                },
              ],
            }),
          },
        ],
      },
    },
  ],
};

export const MOCK_CLEAR_ENGLISH_POS_ZREPORT = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: JSON.stringify({
              metadata: {
                documentNumber: 'Z-REP-20260820-TILL1',
                date: '2026-08-20',
                supplierName: 'StockPulse Demo Cafe & Bar',
                currency: 'EUR',
                netAmount: 125.0,
                taxAmount: 23.75,
                totalAmount: 148.75,
              },
              lineItems: [
                {
                  lineNumber: 1,
                  description: 'Classic Cheeseburger',
                  rawText: '5x Classic Cheeseburger @ 14.00 = 70.00',
                  quantity: 5,
                  unitPrice: 14.0,
                  totalPrice: 70.0,
                  confidence: 0.99,
                },
                {
                  lineNumber: 2,
                  description: 'Truffle Fries',
                  rawText: '5x Truffle Fries @ 6.50 = 32.50',
                  quantity: 5,
                  unitPrice: 6.5,
                  totalPrice: 32.5,
                  confidence: 0.98,
                },
                {
                  lineNumber: 3,
                  description: 'Caffe Latte Large',
                  rawText: '10x Caffe Latte L @ 4.625 = 46.25',
                  quantity: 10,
                  unitPrice: 4.625,
                  totalPrice: 46.25,
                  confidence: 0.95,
                },
              ],
            }),
          },
        ],
      },
    },
  ],
};

export const MOCK_BLURRY_LOW_CONFIDENCE_RECEIPT = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: JSON.stringify({
              metadata: {
                documentNumber: 'POS-BLUR-001',
                date: '2026-08-20',
                supplierName: 'Unknown Smudged Vendor',
                currency: 'EUR',
                totalAmount: 15.0,
              },
              lineItems: [
                {
                  lineNumber: 1,
                  description: 'Unclear smudged item ???',
                  rawText: '?? smudged text 1x 10.00',
                  quantity: 1,
                  unitPrice: 10.0,
                  totalPrice: 10.0,
                  confidence: 0.42,
                },
                {
                  lineNumber: 2,
                  description: 'Faint drink text',
                  rawText: 'faint text 5.00',
                  quantity: 1,
                  unitPrice: 5.0,
                  totalPrice: 5.0,
                  confidence: 0.51,
                },
              ],
            }),
          },
        ],
      },
    },
  ],
};

export const MOCK_ROTATED_CROPPED_RECEIPT = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: JSON.stringify({
              metadata: {
                currency: 'EUR',
              },
              lineItems: [
                {
                  lineNumber: 1,
                  description: 'Cropped burger item',
                  rawText: '..erger 12.00',
                  quantity: 1,
                  unitPrice: 12.0,
                  totalPrice: 12.0,
                  confidence: 0.72,
                },
              ],
            }),
          },
        ],
      },
    },
  ],
};

export const MOCK_MISSING_DATA_RECEIPT = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: JSON.stringify({
              metadata: {
                documentNumber: 'MISSING-FIELDS-01',
              },
              lineItems: [
                {
                  lineNumber: 1,
                  description: 'Item without explicit quantity or price',
                  rawText: 'Bakery Pastry Assorted',
                  confidence: 0.65,
                },
              ],
            }),
          },
        ],
      },
    },
  ],
};

export const MOCK_MARKDOWN_WRAPPED_GEMINI_RESPONSE = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: '```json\n{\n  "metadata": {\n    "documentNumber": "MD-FENCE-001",\n    "totalAmount": 20.0\n  },\n  "lineItems": [\n    {\n      "lineNumber": 1,\n      "description": "Cleaned from Markdown",\n      "quantity": 1,\n      "unitPrice": 20.0,\n      "totalPrice": 20.0,\n      "confidence": 0.95\n    }\n  ]\n}\n```',
          },
        ],
      },
    },
  ],
};

export const MOCK_CONFLICTING_FINANCIALS_RECEIPT = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: JSON.stringify({
              metadata: {
                documentNumber: 'CONFLICT-001',
                totalAmount: 100.0, // Stated total
              },
              lineItems: [
                {
                  lineNumber: 1,
                  description: 'Single Item',
                  quantity: 1,
                  unitPrice: 15.0,
                  totalPrice: 15.0, // Item sum (15.00) != stated total (100.00)
                  confidence: 0.9,
                },
              ],
            }),
          },
        ],
      },
    },
  ],
};

export const MOCK_DUPLICATE_ITEMS_RECEIPT = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: JSON.stringify({
              metadata: {
                documentNumber: 'DUP-001',
                totalAmount: 30.0,
              },
              lineItems: [
                {
                  lineNumber: 1,
                  description: 'Espresso',
                  rawText: '1x Espresso 2.50',
                  quantity: 1,
                  unitPrice: 2.5,
                  totalPrice: 2.5,
                  confidence: 0.95,
                },
                {
                  lineNumber: 2,
                  description: 'Espresso',
                  rawText: '1x Espresso 2.50',
                  quantity: 1,
                  unitPrice: 2.5,
                  totalPrice: 2.5,
                  confidence: 0.95,
                },
              ],
            }),
          },
        ],
      },
    },
  ],
};
