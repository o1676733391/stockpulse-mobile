# StockPulse — Authentication & Authorization Architecture
### (Supabase Auth + NestJS Backend + Expo Mobile Client)

> **Version:** 1.0.0  
> **Target Frameworks:** Expo React Native (iOS & Android) + NestJS + Supabase Auth (GoTrue)  
> **Security Standards:** OAuth 2.0 / OIDC, JWT (RFC 7519), Hardware SecureStore, Biometric Challenge-Response  
> **Companion Documents:**  
> - [RLS_POLICY_DESIGN.md](file:///d:/Project%20Local/fnb-mobile/docs/architecture/RLS_POLICY_DESIGN.md)  
> - [NESTJS_MODULE_STRUCTURE.md](file:///d:/Project%20Local/fnb-mobile/docs/architecture/NESTJS_MODULE_STRUCTURE.md)  
> - [BACKEND_ARCHITECTURE.md](file:///d:/Project%20Local/fnb-mobile/docs/architecture/BACKEND_ARCHITECTURE.md)  

---

## 1. High-Level Authentication & Authorization Topology

```mermaid
flowchart TB
    subgraph Client_Tier [Expo Mobile Client]
        UI[Mobile UI Screens]
        SecStore[(Hardware SecureStore / Keychain / Keystore)]
        AxiosAuth[Axios / Fetch Interceptor]
        UI <--> AxiosAuth
        AxiosAuth <--> SecStore
    end

    subgraph Supabase_Auth_Tier [Supabase Auth - GoTrue Service]
        GoTrue[Supabase Auth Engine]
        JWTSigner[JWT Token Issuer & RS256 Signer]
        GoTrue --> JWTSigner
    end

    subgraph NestJS_Backend_Tier [NestJS Application Gateway]
        AuthGuard[1. SupabaseAuthGuard - Passport JWT Strategy]
        RolesGuard[2. RolesGuard & PermissionsGuard]
        TenantGuard[3. TenantIsolationInterceptor]
        Controller[4. Domain Controller & Service]
        
        AuthGuard --> RolesGuard --> TenantGuard --> Controller
    end

    subgraph Database_Tier [Supabase PostgreSQL 16]
        RLS[(PostgreSQL Row-Level Security RLS Engine)]
        AppUserTable[(public.users & user_store_assignments)]
    end

    %% Auth Handshake
    AxiosAuth -->|1. Credentials / Refresh| GoTrue
    GoTrue -->|2. JWT Access Token + Refresh Token| AxiosAuth

    %% API Request with JWT
    AxiosAuth -->|3. API Request: Bearer JWT + X-Store-Id| AuthGuard
    AuthGuard <-->|Verify Signature & User Claims| AppUserTable
    Controller -->|4. Query with SET LOCAL app.current_store_id| RLS
```

---

## 2. Flow 1: Login & Biometric Authentication Flow

StockPulse supports two authentication modes:
1. **Primary Credential Login**: Email and password via Supabase Auth.
2. **Biometric Quick-Unlock**: Hardware-backed public/private key challenge-response.

```mermaid
sequenceDiagram
    autonumber
    participant User as Store Staff
    participant App as Expo Mobile App
    participant SecStore as SecureStore (Keystore/Keychain)
    participant SupaAuth as Supabase Auth (GoTrue)
    participant Nest as NestJS Backend (/api/v1/auth)
    participant DB as Supabase PostgreSQL

    Note over User,DB: Mode A: Primary Password Login
    User->>App: Enter email & password
    App->>SupaAuth: signInWithPassword({ email, password })
    SupaAuth->>SupaAuth: Verify bcrypt hash & account status
    SupaAuth-->>App: Return Supabase Session { access_token (15m), refresh_token (30d) }
    
    App->>Nest: GET /api/v1/auth/me (Bearer access_token)
    Nest->>Nest: Verify JWT signature
    Nest->>DB: Fetch user role, permissions & assigned stores
    DB-->>Nest: User metadata { role: 'manager', stores: ['STR-BER-01'] }
    Nest-->>App: Return User Profile & Permissions
    App->>SecStore: Persist { access_token, refresh_token, active_store_id } in Hardware Keystore
    App-->>User: Navigate to Dashboard

    Note over User,DB: Mode B: Biometric Quick-Unlock (Subsequent App Opens)
    User->>App: Open app / FaceID prompt
    App->>Nest: POST /api/v1/auth/biometrics/challenge { userId }
    Nest-->>App: Return cryptographic nonce { challenge: "nonce_01J8F9..." }
    App->>SecStore: Sign challenge using hardware private key (Secure Enclave)
    SecStore-->>App: Return signature
    App->>Nest: POST /api/v1/auth/biometrics/verify { challenge, signature }
    Nest->>DB: Verify signature against registered biometrics_public_key
    Nest-->>App: Return fresh Supabase Access Session
```

---

## 3. Flow 2: Mobile Session Management & Silent Refresh

```mermaid
sequenceDiagram
    autonumber
    participant App as Expo Mobile App
    participant Interceptor as Axios / Fetch Interceptor
    participant SecStore as SecureStore
    participant SupaAuth as Supabase Auth (GoTrue)
    participant Nest as NestJS Backend

    Note over App,Nest: 1. Normal API Request
    App->>Interceptor: GET /api/v1/inventory
    Interceptor->>SecStore: Read access_token
    Interceptor->>Nest: GET /api/v1/inventory (Authorization: Bearer <access_token>)
    Nest-->>Interceptor: 200 OK (Data returned)

    Note over App,Nest: 2. Access Token Expired (401 Response)
    App->>Interceptor: GET /api/v1/inventory
    Interceptor->>Nest: GET /api/v1/inventory (Authorization: Bearer <expired_token>)
    Nest-->>Interceptor: 401 Unauthorized (JWT Expired)

    Note over Interceptor,SupaAuth: 3. Silent Refresh Token Rotation (RTR)
    Interceptor->>SecStore: Read refresh_token
    Interceptor->>SupaAuth: refreshSession({ refresh_token })
    SupaAuth->>SupaAuth: Verify token & rotate token family
    SupaAuth-->>Interceptor: Return new { access_token, refresh_token }
    Interceptor->>SecStore: Overwrite with new access_token & new refresh_token
    
    Note over Interceptor,Nest: 4. Replay Original Request
    Interceptor->>Nest: GET /api/v1/inventory (Authorization: Bearer <new_access_token>)
    Nest-->>Interceptor: 200 OK (Data returned)
    Interceptor-->>App: Display Inventory Data
```

### Security & Token Lifecycles:
- **Access Token TTL**: **15 minutes** (short-lived to minimize impact of compromised tokens).
- **Refresh Token TTL**: **30 days** (long-lived, protected by Hardware Keystore).
- **Refresh Token Rotation (RTR)**: Each refresh generates a cryptographically new refresh token and invalidates the previous one.
- **Token Reuse Detection**: If an old/revoked refresh token is presented, Supabase Auth immediately revokes the **entire token family**, forcing manual password re-authentication.

---

## 4. Flow 3: Backend JWT Token Validation Flow

The NestJS backend implements a stateless Passport JWT strategy to validate incoming Supabase tokens:

```mermaid
flowchart TD
    Req[Incoming HTTP Request: Authorization Bearer JWT] --> ExtractToken[Extract Bearer Token & X-Store-Id]
    ExtractToken --> CheckSignature{Validate RS256/HS256 Signature}
    CheckSignature -->|Invalid Signature / Secret Mismatch| Ret401[401 Unauthorized: Invalid Token Signature]
    CheckSignature -->|Valid Signature| CheckClaims{Validate Standard Claims}
    
    CheckClaims -->|exp expired| Ret401Exp[401 Unauthorized: Token Expired]
    CheckClaims -->|aud != authenticated| Ret401Aud[401 Unauthorized: Invalid Audience]
    CheckClaims -->|Valid Claims| LoadContext[Fetch User Context from PostgreSQL / Cache]
    
    LoadContext --> AttachContext[Attach IAuthenticatedUser to Request: req.user]
    AttachContext --> NextGuard[Forward to RolesGuard & PermissionsGuard]
```

### Decoded Supabase JWT Payload Structure:
```json
{
  "iss": "https://<supabase-project-id>.supabase.co/auth/v1",
  "sub": "01915dfa-b1c4-7221-9988-51b72e04e0a1",
  "aud": "authenticated",
  "exp": 1773800900,
  "iat": 1773800000,
  "email": "marco.manager@restaurant.de",
  "phone": "+493087654321",
  "app_metadata": {
    "provider": "email",
    "providers": ["email"]
  },
  "user_metadata": {
    "name": "Marco Rossi",
    "role": "manager"
  },
  "role": "authenticated"
}
```

---

## 5. Flow 4: Backend Authorization & Tenant Isolation Flow

```mermaid
flowchart TD
    ReqContext[Request with Authenticated req.user] --> Guard1[1. SupabaseAuthGuard: Verify Identity]
    Guard1 --> Guard2{2. RolesGuard: Check @RequireRoles}
    
    Guard2 -->|Role Not Permitted| DenyRole[403 Forbidden: Insufficient Role]
    Guard2 -->|Role Permitted| Guard3{3. PermissionsGuard: Check @RequirePermissions}
    
    Guard3 -->|Missing Permission| DenyPerm[403 Forbidden: Missing Required Permission]
    Guard3 -->|Has Permission| Interceptor[4. TenantIsolationInterceptor: Verify Store Context]
    
    Interceptor -->|Store ID not in User Assignments & Not Admin| DenyTenant[403 Forbidden: Cross-Tenant Access Violation]
    Interceptor -->|Valid Store Assignment| SetDBContext[5. Database Session Setup]
    
    SetDBContext --> SetSession[Execute: SET LOCAL app.current_store_id = store_id]
    SetSession --> QueryExec[(Execute Query with PostgreSQL RLS Policy Filtering)]
```

### NestJS Authorization Decorators & Usage:

```typescript
@Controller('inventory')
@UseGuards(SupabaseAuthGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(TenantIsolationInterceptor)
export class InventoryController {

  @Get()
  @RequireRoles('admin', 'manager', 'supervisor', 'staff', 'auditor')
  @RequirePermissions('inventory:view')
  async getInventory(
    @CurrentStore() storeId: string,
    @CurrentUser() user: IAuthenticatedUser,
    @Query() query: ItemQueryDto
  ): Promise<PaginatedItemsDto> {
    return this.inventoryService.findAll(storeId, query);
  }

  @Post(':itemId/adjust')
  @RequireRoles('admin', 'manager', 'supervisor')
  @RequirePermissions('inventory:adjust_manual')
  async adjustStock(
    @CurrentStore() storeId: string,
    @CurrentUser() user: IAuthenticatedUser,
    @Param('itemId') itemId: string,
    @Body() dto: StockAdjustmentDto
  ): Promise<ItemResponseDto> {
    return this.inventoryService.adjustManual(storeId, itemId, user.id, dto);
  }
}
```

---

## 6. Summary of Authentication Architecture

| Layer | Technology / Standard | Architectural Role |
|---|---|---|
| **Mobile Storage** | Expo SecureStore (AES-256 / Keychain / Keystore) | Zero plain-text persistence of refresh tokens or biometric keys. |
| **Token Issuer** | Supabase Auth (GoTrue) | Manages credential verification, bcrypt password hashing, and token rotation. |
| **Token Format** | RFC 7519 JSON Web Tokens (RS256 / HS256) | 15-minute access token TTL with cryptographic signature verification. |
| **Backend Validator** | NestJS Passport JWT Strategy (`SupabaseAuthGuard`) | Validates JWT signatures and attaches typed user context to request lifecycle. |
| **Role & Perms Guard**| NestJS `@RequireRoles()` & `@RequirePermissions()` | Enforces granular RBAC before entering domain services. |
| **Tenant Isolation** | NestJS `TenantIsolationInterceptor` + PostgreSQL RLS | Validates `X-Store-Id` header and sets transactional PostgreSQL session variables. |
