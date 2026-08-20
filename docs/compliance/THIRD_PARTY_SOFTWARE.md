# StockPulse - Third-Party Software & Open-Source Register

**Application**: StockPulse F&B Inventory & POS Reconciliation  
**Target Platforms**: iOS & Android (Mobile App) + NestJS on Google Cloud Run (Backend API)  
**Audit Date**: 2026-08-18  
**Compliance Status**: **VERIFIED & COMPLIANT** (100% Permissive Licenses: MIT, Apache-2.0, ISC)

---

## 1. Frontend Mobile Dependencies (Expo React Native)

| Component | Exact Version | Purpose / Subsystem | Official Source | License | Commercial Use | Redistribution Rights | Notice / Attribution Required |
|---|---|---|---|:---:|:---:|:---:|---|
| **Expo** | `~57.0.12` | Mobile framework & runtime | npm / github.com/expo/expo | **MIT** | Verified | Verified | Preserve copyright & MIT text |
| **React Native** | `0.86.2` | Native mobile rendering engine | npm / github.com/facebook/react-native | **MIT** | Verified | Verified | Preserve Facebook copyright notice |
| **React** | `19.2.3` | UI component architecture | npm / github.com/facebook/react | **MIT** | Verified | Verified | Preserve Facebook copyright notice |
| **React DOM** | `19.2.3` | Web DOM runtime support | npm / github.com/facebook/react | **MIT** | Verified | Verified | Preserve Facebook copyright notice |
| **Expo Router** | `~57.0.12` | File-based navigation & deep-linking | npm / github.com/expo/expo | **MIT** | Verified | Verified | Preserve Expo copyright notice |
| **@expo/ui** | `~57.0.10` | Universal native UI primitives | npm / github.com/expo/expo | **MIT** | Verified | Verified | Preserve Expo copyright notice |
| **react-native-safe-area-context** | `~5.7.0` | Device cutouts & notch insets | npm / github.com/th3rdwave/react-native-safe-area-context | **MIT** | Verified | Verified | Preserve copyright notice |
| **react-native-screens** | `~4.26.0` | Native view controllers / fragments | npm / github.com/software-mansion/react-native-screens | **MIT** | Verified | Verified | Preserve Software Mansion notice |
| **react-native-reanimated** | `4.5.1` | Native UI thread animations | npm / github.com/software-mansion/react-native-reanimated | **MIT** | Verified | Verified | Preserve Software Mansion notice |
| **react-native-gesture-handler** | `~2.32.0` | Native touch & pan recognizers | npm / github.com/software-mansion/react-native-gesture-handler | **MIT** | Verified | Verified | Preserve Software Mansion notice |
| **react-native-svg** | `15.15.4` | Pure vector graphics & chart engine | npm / github.com/software-mansion/react-native-svg | **MIT** | Verified | Verified | Preserve Software Mansion notice |
| **lucide-react-native** | `^1.31.0` | Scalable vector icon pack | npm / github.com/lucide-icons/lucide | **ISC** | Verified | Verified | Preserve Lucide ISC notice |
| **expo-constants** | `~57.0.10` | Device & manifest metadata | npm / github.com/expo/expo | **MIT** | Verified | Verified | Preserve Expo copyright notice |
| **expo-device** | `~57.0.1` | Hardware model information | npm / github.com/expo/expo | **MIT** | Verified | Verified | Preserve Expo copyright notice |
| **expo-font** | `~57.0.1` | Custom font loading pipeline | npm / github.com/expo/expo | **MIT** | Verified | Verified | Preserve Expo copyright notice |
| **expo-glass-effect** | `~57.0.1` | Native blur & vibrancy styling | npm / github.com/expo/expo | **MIT** | Verified | Verified | Preserve Expo copyright notice |
| **expo-image** | `~57.0.2` | High-performance image loader | npm / github.com/expo/expo | **MIT** | Verified | Verified | Preserve Expo copyright notice |
| **expo-linking** | `~57.0.5` | Universal URL & schema linking | npm / github.com/expo/expo | **MIT** | Verified | Verified | Preserve Expo copyright notice |
| **expo-splash-screen** | `~57.0.6` | Native launch splash screen controller | npm / github.com/expo/expo | **MIT** | Verified | Verified | Preserve Expo copyright notice |
| **expo-status-bar** | `~57.0.1` | System status bar controller | npm / github.com/expo/expo | **MIT** | Verified | Verified | Preserve Expo copyright notice |
| **expo-symbols** | `~57.0.2` | Apple SF Symbols support | npm / github.com/expo/expo | **MIT** | Verified | Verified | Preserve Expo copyright notice |
| **expo-system-ui** | `~57.0.2` | Root background styling | npm / github.com/expo/expo | **MIT** | Verified | Verified | Preserve Expo copyright notice |
| **expo-web-browser** | `~57.0.2` | In-app browser modal wrapper | npm / github.com/expo/expo | **MIT** | Verified | Verified | Preserve Expo copyright notice |
| **react-native-web** | `~0.21.0` | React Native web bridge | npm / github.com/necolas/react-native-web | **MIT** | Verified | Verified | Preserve Nicolas Gallagher notice |
| **react-native-worklets** | `0.10.1` | Thread worklet execution | npm / github.com/software-mansion/react-native-reanimated | **MIT** | Verified | Verified | Preserve Software Mansion notice |
| **typescript** (dev) | `~6.0.3` | Type system compiler | npm / github.com/microsoft/TypeScript | **Apache-2.0** | Verified | Verified | Dev dependency (not bundled) |
| **@types/react** (dev) | `~19.2.2` | React type declarations | npm / github.com/DefinitelyTyped/DefinitelyTyped | **MIT** | Verified | Verified | Dev dependency (not bundled) |

---

## 2. Backend Server Dependencies (NestJS)

| Component | Exact Version | Purpose / Subsystem | Official Source | License | Commercial Use | Redistribution Rights | Notice / Attribution Required |
|---|---|---|---|:---:|:---:|:---:|---|
| **@nestjs/core** | `^10.4.15` | Core application framework | npm / github.com/nestjs/nest | **MIT** | Verified | Verified | Preserve NestJS copyright notice |
| **@nestjs/common** | `^10.4.15` | Common decorators, pipes, guards | npm / github.com/nestjs/nest | **MIT** | Verified | Verified | Preserve NestJS copyright notice |
| **@nestjs/platform-express** | `^10.4.15` | HTTP server adapter | npm / github.com/nestjs/nest | **MIT** | Verified | Verified | Preserve NestJS copyright notice |
| **@nestjs/config** | `^3.3.0` | Typed environment configuration | npm / github.com/nestjs/config | **MIT** | Verified | Verified | Preserve NestJS copyright notice |
| **@nestjs/swagger** | `^8.1.1` | OpenAPI Swagger documentation | npm / github.com/nestjs/swagger | **MIT** | Verified | Verified | Preserve NestJS copyright notice |
| **@supabase/supabase-js** | `^2.48.1` | Supabase PostgreSQL & Auth client | npm / github.com/supabase/supabase-js | **MIT** | Verified | Verified | Preserve Supabase copyright notice |
| **@google-cloud/documentai** | `^8.8.0` | Google Cloud Document AI SDK | npm / github.com/googleapis/nodejs-document-ai | **Apache-2.0** | Verified | Verified | Preserve Google Apache-2.0 notice |
| **class-validator** | `^0.14.1` | DTO validation decorators | npm / github.com/typestack/class-validator | **MIT** | Verified | Verified | Preserve Typestack copyright notice |
| **class-transformer** | `^0.5.1` | DTO transformation engine | npm / github.com/typestack/class-transformer | **MIT** | Verified | Verified | Preserve Typestack copyright notice |
| **reflect-metadata** | `^0.2.2` | Decorator metadata reflection | npm / github.com/rbuckton/reflect-metadata | **Apache-2.0** | Verified | Verified | Preserve Apache-2.0 notice |
| **rxjs** | `^7.8.1` | Reactive streams & interceptors | npm / github.com/ReactiveX/rxjs | **Apache-2.0** | Verified | Verified | Preserve ReactiveX Apache-2.0 notice |

---

## 3. License Compliance Summary

- **Total Direct Third-Party Dependencies**: 38 (27 Frontend + 11 Backend)
- **Permissive Open-Source Breakdown**:
  - **MIT License**: 33 packages (86.8%)
  - **Apache-2.0 License**: 4 packages (10.5%)
  - **ISC License**: 1 package (2.6%)
- **Copyleft / Source-Disclosure Dependencies (GPL/AGPL/LGPL/SSPL)**: **0 (Zero)**
- **Non-Commercial / Source-Available Dependencies (CC-NC / BUSL)**: **0 (Zero)**
- **Proprietary / Unknown License Dependencies**: **0 (Zero)**
