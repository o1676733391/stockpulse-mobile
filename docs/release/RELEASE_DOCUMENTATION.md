# StockPulse - Comprehensive Production Release & Store Submission Guide

**Application Name**: StockPulse  
**Version**: 2.4.1 (Build 2026.03.11-rc1)  
**Bundle ID (iOS)**: `com.stockpulse.fnb`  
**Package Name (Android)**: `com.stockpulse.fnb`  
**Category**: Business / Productivity / Food & Drink  

---

## 1. Release Checklist

### Phase A: Pre-Build Verification
- [x] Static type analysis passes with 0 errors (`npx tsc --noEmit`).
- [x] Production Android bundle export completes cleanly (`npx expo export --platform android`).
- [x] Zero unapproved third-party dependencies or copyleft licenses.
- [x] All mock service contracts adhere to typed TypeScript boundaries (`IInventoryService`, `IOcrService`, `IProcurementService`, `ISettingsService`, `IAuthService`, `IOfflineQueueService`).
- [x] Role-Based Access Control (RBAC) verified across all 5 roles (`admin`, `manager`, `supervisor`, `staff`, `auditor`).
- [x] Safe area insets validated on Dynamic Island, iPhone Notch, and Android display cutouts.
- [x] Offline mutation queue and conflict resolution tested.

### Phase B: Build & Binary Preparation
- [ ] Increment build numbers:
  - iOS `CFBundleVersion`: `24`
  - Android `versionCode`: `24`
- [ ] EAS Build production profile configured in `eas.json` (`eas build --platform all --profile production`).
- [ ] iOS App Store distribution certificate & provisioning profile verified.
- [ ] Android upload keystore and Google Play App Signing key configured.

### Phase C: Smoke & Regression Testing
- [ ] Initial onboarding and restaurant store selection.
- [ ] Physical inventory count flow with discrepancy variance review.
- [ ] Camera slip capture & OCR line item deduction.
- [ ] BBD expiration warning triage & recipe waste suggestions.
- [ ] POQ calculation & purchase order creation.
- [ ] Offline toggle & background queue synchronization.

---

## 2. Store Assets & Creative Checklist

### iOS App Store Assets
| Asset | Dimensions / Format | Requirements |
|---|---|---|
| **App Icon** | `1024 × 1024 px` PNG | Square, no alpha transparency, flat design |
| **6.9" Display (iPhone 16 Pro Max)** | `1320 × 2868 px` PNG/JPEG | Portrait, minimum 3 screenshots (Dashboard, Inventory, Scan) |
| **6.7" Display (iPhone 15 Pro Max / 14 Pro Max)** | `1290 × 2796 px` PNG/JPEG | Portrait, minimum 3 screenshots |
| **6.5" Display (iPhone 11 Pro Max / XS Max)** | `1242 × 2688 px` PNG/JPEG | Portrait, minimum 3 screenshots |
| **13" iPad Display (iPad Pro 6th Gen)** | `2048 × 2732 px` PNG/JPEG | Tablet layout (if universal app configured) |

### Google Play Store Assets
| Asset | Dimensions / Format | Requirements |
|---|---|---|
| **App Icon** | `512 × 512 px` 32-bit PNG | Square, max 1024KB, color space sRGB |
| **Feature Graphic** | `1024 × 500 px` JPEG / 24-bit PNG | Bold branding without store badges/devices |
| **Phone Screenshots** | Minimum `1080 × 1920 px` PNG | 4 to 8 screenshots showcasing core kitchen flows |
| **7" / 10" Tablet Screenshots** | Minimum `1920 × 1200 px` PNG | Demonstrating POS scan and report exports |

---

## 3. App Store Submission Checklist (iOS)

- **App Name**: `StockPulse - F&B Inventory` (max 30 characters)
- **Subtitle**: `Real-Time Kitchen Stock & POS` (max 30 characters)
- **Primary Category**: `Business` | **Secondary Category**: `Food & Drink`
- **Keywords**: `inventory,restaurant,F&B,kitchen,stock count,BOM,OCR,expiration,waste reduction,procurement,food cost` (max 100 characters)
- **Support URL**: `https://stockpulse.app/support`
- **Marketing URL**: `https://stockpulse.app`
- **Privacy Policy URL**: `https://stockpulse.app/privacy`
- **Age Rating**: `4+` (No objectionable content, no gambling, no medical data)
- **App Privacy Details (Nutrition Labels)**:
  - Data Used to Track You: **None**
  - Data Linked to You: Contact Info (Email address for account login)
  - Data Not Linked to You: Usage Data (Diagnostics & Performance)

---

## 4. Google Play Submission Checklist (Android)

- **App Title**: `StockPulse: F&B Inventory Management` (max 30 characters)
- **Short Description**: `Smart kitchen inventory, POS receipt scanning & food waste reduction.` (max 80 characters)
- **Full Description**: Detailed explanation of real-time inventory counts, automated BOM deductions, BBD tracking, POQ calculation, and multi-store analytics.
- **Target Android Version**: Target API level 35 (Android 15) with minimum API level 24 (Android 7.0).
- **Data Safety Declaration**:
  - Encrypted in transit (HTTPS/TLS 1.3).
  - User account deletion URL provided.
  - No personal data sold to third-party data brokers.
- **Permissions Declaration**:
  - `CAMERA`: Used exclusively for capturing paper POS closing reports for on-device OCR parsing.
  - `INTERNET` & `ACCESS_NETWORK_STATE`: Required for cloud synchronization and offline queue draining.

---

## 5. Privacy Policy Requirements (GDPR & CCPA Compliant)

The published Privacy Policy must clearly specify:
1. **Data Collection Scope**: Store name, business email, employee role assignment, and inventory counts.
2. **Camera Usage Disclosure**: Camera permissions are requested solely for photo capture of physical POS checkout slips and barcodes. Photos are processed and discarded immediately after OCR extraction.
3. **Data Storage & Retention**: Multi-tenant database hosted in secure European data centers (Frankfurt, Germany) with TLS 1.3 transit encryption and AES-256 at-rest encryption.
4. **Data Subject Rights**: Rights to access, rectify, export, and permanently delete account information pursuant to GDPR Articles 15–20.
5. **Contact Representative**: Data Protection Officer email (`privacy@stockpulse.app`).

---

## 6. Terms of Service Requirements

The Terms of Service document must cover:
1. **SaaS Subscription & License Grant**: Non-exclusive, revocable license for active restaurant operating branches.
2. **Kitchen Audit & Estimation Disclaimer**: StockPulse provides algorithmic BOM deductions and automated variance calculations based on user-entered recipe ratios; actual physical kitchen counts remain the responsibility of store management.
3. **Account Security**: Users are responsible for credential confidentiality and role permissions delegated to kitchen staff.
4. **Service Level Agreement (SLA)**: 99.9% availability target with scheduled maintenance windows communicated in advance.

---

## 7. Analytics Inventory

| Event Name | Trigger Context | Parameters Collected | Privacy Impact |
|---|---|---|:---:|
| `app_launch` | Cold / Warm app startup | `app_version`, `os_platform`, `store_id` | Low / Anonymous |
| `stock_count_completed` | User finalizes audit | `items_counted`, `variance_count`, `duration_sec` | Business aggregate |
| `ocr_scan_processed` | POS receipt parsed | `detected_lines_count`, `average_confidence`, `ocr_duration_ms` | Technical diagnostic |
| `bbd_suggestion_applied` | Waste recipe adopted | `ingredient_id`, `discount_rate_percent`, `recovered_value` | Operational KPI |
| `po_submitted` | Purchase order sent | `supplier_id`, `line_items_count`, `total_amount_currency` | Business aggregate |
| `offline_sync_drained` | Reconnect queue drained | `mutation_count`, `conflict_count`, `sync_duration_ms` | Performance metric |

---

## 8. Crash Reporting & Diagnostics Inventory

| Subsystem | Target Provider | Configuration & Symbols |
|---|---|---|
| **JS Exceptions** | Sentry / EAS Observe | Sourcemaps generated and uploaded during release build. |
| **Native Crash Handler** | Apple CrashReporter / Google Play Vitals | dSYM bundle uploaded for iOS; Proguard mapping file uploaded for Android. |
| **Network Breadcrumbs** | In-memory ring buffer (last 20 requests) | Sanitized HTTP status codes & endpoints (headers and auth tokens stripped). |
| **Offline State Logs** | Local mutation audit log | Captures offline queue length, retry counts, and sync failure reasons without PII. |
