# StockPulse — Developer Debugging & Diagnostics Guide

## 1. Diagnostics Overview
This guide provides systematic diagnostic workflows for resolving issues across the **NestJS Backend**, **Supabase PostgreSQL**, **Google Document AI OCR**, and the **Expo / React Native Mobile Frontend**.

---

## 2. Backend & API Diagnostics

### Issue 1: `401 Unauthorized` on API Endpoints
- **Symptoms**: Client receives `{ "statusCode": 401, "message": "Invalid or expired Supabase JWT token" }`.
- **Diagnostic Steps**:
  1. Inspect JWT payload at [jwt.io](https://jwt.io) or via node script.
  2. Verify token has not expired (`exp` claim > `Date.now() / 1000`).
  3. Verify `SUPABASE_JWT_SECRET` in `.env` matches the Supabase project signing key.
  4. Ensure request sends header: `Authorization: Bearer <token>`.

### Issue 2: `403 Forbidden` (Store Tenant or Permission Error)
- **Symptoms**: Client receives `{ "statusCode": 403, "message": "User does not have access to store..." }` or permission deficiency.
- **Diagnostic Steps**:
  1. Check if `X-Store-Id` header is passed in request.
  2. Query `store_users` table in database to confirm user has active assignment to this store UUID.
  3. Inspect `user.permissions` or `user.role` against `@RequirePermissions(...)` / `@Roles(...)` metadata on the controller handler.

### Issue 3: Optimistic Concurrency Conflict (`409 Conflict`)
- **Symptoms**: Update to inventory item fails with `{ "statusCode": 409, "message": "Version conflict" }`.
- **Diagnostic Steps**:
  1. Verify the client sent `version` matching the database record.
  2. Fetch latest item state with `GET /api/v1/inventory/items/:id` and re-apply changes.

---

## 3. OCR & Google Document AI Diagnostics

### Issue: Low Confidence or Unmatched OCR Line Items
- **Diagnostic Steps**:
  1. Check image resolution and lighting. Presigned upload supports PNG, JPEG, WebP, and PDF up to 10MB.
  2. Inspect `confidence` score on returned lines (`< 0.80` automatically flags `needsReview = true`).
  3. Verify article descriptions in database match recipe names or aliases.
  4. Review OCR logs in `audit_logs` with `event_action = 'OCR_UPLOAD'`.

---

## 4. Mobile Frontend Diagnostics (Expo & React Native)

### Diagnostic Steps:
1. **Clear Metro Cache**:
   ```bash
   npx expo start -c
   ```
2. **Safe Area Insets**:
   - Ensure components wrap in `<SafeAreaView>` or consume `useSafeAreaInsets()` from `react-native-safe-area-context`.
3. **Network Connection**:
   - On physical devices or Android emulators, ensure backend API base URL is configured to local network IP (e.g. `http://192.168.1.X:3000/api/v1`) or `http://10.0.2.2:3000/api/v1` instead of `localhost`.

---

## 5. Logging & Trace Correlation
- All requests log with timestamp, correlation ID, tenant context, and path.
- In production, logs flow into Google Cloud Logging.
