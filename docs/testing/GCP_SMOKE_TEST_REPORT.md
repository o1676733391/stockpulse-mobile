# StockPulse — Real Google Cloud & Gemini Integration Smoke Test Report

## 1. Executive Summary

- **Execution Timestamp**: `2026-09-14T09:49:56.319Z`
- **Request / Test ID**: `GCP-SMOKE-1789379396319`
- **Target Provider**: `Google Gemini Multimodal Vision OCR Agent (gemini_vision)`
- **Configured Model**: `gemini-2.5-flash`
- **GCP Project**: `ocr-stem`
- **Real Google Cloud API Invoked**: `YES`
- **Mock / Fallback Accepted as Pass**: **NO** (Strict Rule: Mocked responses never qualify as PASS)
- **Final Smoke Test Status**: **`PASS`**

---

## 2. Environment & Credential Validation

| Verification Parameter | Configured Value | Validation Result |
|---|---|:---:|
| **GCP Project ID** | `ocr-stem` | ✅ Passed |
| **Configured Gemini Model** | `gemini-2.5-flash` | ✅ Passed |
| **Gemini API Key** | `AQ.Ab8...mhzA` | ✅ Present (Masked) |
| **GCP Service Account Credentials** | `Loaded` | ✅ Valid |

> [!NOTE]
> All credentials and secrets are strictly masked. No private keys, bearer tokens, or plaintext API keys are ever printed in logs or reports.

---

## 3. Real API Execution & Observability

| Metric / Field | Value |
|---|---|
| **API Endpoint** | `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent` |
| **Request Latency** | **41375 ms** |
| **Real LLM Inference** | `SUCCEEDED` |
| **Extracted Line Items** | **38 items** |
| **Overall Extraction Confidence** | **0.95** |
| **Schema Validation** | `VALID` |

### Extracted Document Metadata
```json
{
  "documentNumber": "POS-437699",
  "date": "2026-07-27",
  "supplierName": "Restaurant POS Till",
  "currency": "EUR",
  "netAmount": 0,
  "taxAmount": 0,
  "totalAmount": 0
}
```

### Sample Extracted Line Items
```json
[
  {
    "lineNumber": 1,
    "rawText": "101 Menü 1 11",
    "description": "Menü 1",
    "quantity": 11,
    "unitPrice": 0,
    "totalPrice": 0,
    "confidence": 0.95
  },
  {
    "lineNumber": 2,
    "rawText": "102 Menü 2 13",
    "description": "Menü 2",
    "quantity": 13,
    "unitPrice": 0,
    "totalPrice": 0,
    "confidence": 0.95
  },
  {
    "lineNumber": 3,
    "rawText": "103 Menü 3 11",
    "description": "Menü 3",
    "quantity": 11,
    "unitPrice": 0,
    "totalPrice": 0,
    "confidence": 0.95
  }
]
```




---

## 4. Billing & GCP Usage Verification Guide

To verify real Google Cloud usage incurred by this smoke test:

1. **Google Cloud Console Monitoring**:
   - Open: [https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/metrics](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/metrics?project=ocr-stem)
   - Check the **Traffic**, **Errors by response code**, and **Median latency** charts for `gemini-2.5-flash`.
2. **Google AI Studio Usage**:
   - Open: [https://aistudio.google.com/app/plan_information](https://aistudio.google.com/app/plan_information)
   - View token consumption and RPM / RPD rate quotas.
3. *Note*: Cloud billing dashboard rollups may experience a 15–60 minute reporting propagation delay. Real-time API execution is verified directly through Google Cloud HTTP response status codes.

---

## 5. CI / CD & Safety Separation

- **Normal CI Unit Tests (`npm test`)**:
  - Fully offline and deterministic with in-memory mock adapters.
  - Zero external cloud dependencies; zero risk of CI failure from external outages.
- **Real GCP Smoke Test (`npm run test:gcp`)**:
  - Explicitly executed on demand.
  - Direct real-time invocation of Google Cloud endpoints.
  - May incur standard Google Cloud API consumption.

---

## 6. Final Status & Quality Gate

**Smoke Test Verdict**: **`PASS`**
