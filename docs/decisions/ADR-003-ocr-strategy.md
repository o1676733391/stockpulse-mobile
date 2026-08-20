# ADR-003: Pluggable OCR Provider Abstraction with Google Cloud Document AI

## Status
**Accepted**

## Date
2026-08-20

## Context
StockPulse automates the intake of physical Point-of-Sale (POS) End-of-Day Z-reports and supplier delivery invoices. These documents are often crumpled, skewed, thermal-printed, or low-contrast.

Key requirements:
- High-accuracy extraction of tabular item lines, quantities, unit prices, VAT rates, and totals.
- Vendor abstraction allowing future seamless migration or multi-model fallback to Google Gemini Vision, Azure AI Document Intelligence, or AWS Textract.
- Human-in-the-loop review workflow on mobile with confidence rating indicators.

## Decision
1. **Primary Provider**: Use **Google Cloud Document AI (`EXPENSE_PROCESSOR`)** for specialized receipt parsing with pre-trained bounding boxes and entity confidence ratings.
2. **Provider Abstraction**: Enforce the **Strategy & Factory Pattern** via a clean `IOcrProvider` interface in NestJS (`processDocument(content, mimeType, options)`).
3. **Storage & Privacy**: Direct binary uploads from mobile apps to private Supabase Storage buckets via short-lived signed URLs (15-min TTL). Document AI processes the buffer server-side, preventing client-side credential exposure.
4. **Fuzzy Recipe Matching**: Standardized canonical line items are fuzzy-matched against active store recipes and presented to supervisors with color-coded confidence tiers (Green $\ge 90\%$, Amber $70-89\%$, Red $< 70\%$).

## Alternatives Considered

### Alternative 1: Pure Open-Source Tesseract OCR
- *Pros*: Zero external cloud API cost; fully self-hosted.
- *Cons*: Very poor accuracy on crumpled thermal receipts, multi-column POS tables, and skewed photos; requires extensive manual OpenCV pre-processing.
- *Rejected*: Inadequate for production restaurant operations where accuracy is critical.

### Alternative 2: Direct Unstructured LLM Vision Prompting (e.g. Gemini / GPT-4o only)
- *Pros*: Flexible natural language understanding.
- *Cons*: Inconsistent JSON output structures, hallucination risk on faint numbers, higher latency (3-6s vs $< 1$s), and lack of word-level bounding box coordinates.
- *Rejected*: Document AI is purpose-built for financial expense documents. However, the `IOcrProvider` abstraction allows multimodal LLMs as secondary fallbacks.

## Consequences
- **Positive**: High extraction precision; the application domain does not depend on GCP SDK types; mock providers enable rapid offline unit testing.
- **Negative / Trade-off**: GCP API cost per document processed; handled via subscription scan quotas and metered Stripe billing overages.
