# StockPulse F&B Backend (SQLite, RLS, JWT, Vertex AI Gemini OCR & Docker)

A lightweight, fully RESTful development backend for the StockPulse F&B mobile application.

## Features
- **SQLite Single-File Multi-tenant Database**: Complete schema & seed data generated from `data-sample/create.sql`.
- **Row-Level Security (RLS) & Multi-Tenant Scoping**: All queries and mutations strictly scoped to the user's `store_id`.
- **JWT Authentication & RBAC Engine**: Supports 5 roles (`admin`, `manager`, `supervisor`, `staff`, `auditor`) and granular module permissions.
- **Google Cloud Vertex AI / Gemini OCR**: Multimodal image extraction of POS shift reports + automated theoretical Bill of Materials (BOM) ingredient deductions.
- **Docker & Docker Compose**: Instant one-command startup with volume persistence.

---

## Quick Start with Docker

### 1. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 2. Start the Backend Container
```bash
docker-compose up --build -d
```
The server will be available at `http://localhost:5000`.

To view logs:
```bash
docker-compose logs -f
```

---

## Local Development (Without Docker)

```bash
# 1. Navigate to server folder
cd server

# 2. Install dependencies
npm install

# 3. Start development server with hot-reload
npm run dev
```

---

## Pre-Seeded Test Credentials

All pre-seeded test accounts use the password: **`StockPulse123!`**

| User Name | Role | Email | Permissions |
|---|---|---|---|
| **Anna Schmidt** | Admin | `anna.admin@restaurant.de` | Full access across all modules |
| **Marco Rossi** | Manager | `marco.manager@restaurant.de` | Inventory, OCR, PO, Expiration, Team view |
| **David Weber** | Supervisor | `david.lead@restaurant.de` | Inventory count/edit, POS OCR, BBD waste |
| **Elena Fischer** | Staff | `elena.cook@restaurant.de` | Basic inventory view, POS scan, GR |
| **Dr. Klaus Becker** | Auditor | `klaus.auditor@becker-consult.de` | Audit view, variance analysis, reports |

---

## RESTful API Endpoints Overview

| Module | Route | Method | Description |
|---|---|---|---|
| **Auth** | `/api/v1/auth/login` | `POST` | Authenticate with email & password |
| **Auth** | `/api/v1/auth/me` | `GET` | Retrieve authenticated user & permissions |
| **Auth** | `/api/v1/auth/switch-role` | `POST` | Dev role switcher |
| **Inventory** | `/api/v1/inventory` | `GET` | List inventory items with active batches |
| **Inventory** | `/api/v1/inventory/:id` | `GET` | Item detail with batch & transaction history |
| **Inventory** | `/api/v1/inventory/adjust` | `POST` | Manual stock count/trim adjustment |
| **OCR & BOM** | `/api/v1/ocr/scan` | `POST` | Multimodal receipt scan (Vertex AI Gemini) |
| **OCR & BOM** | `/api/v1/ocr/confirm` | `POST` | Confirm OCR & deduct theoretical BOM |
| **Stock Count** | `/api/v1/stock-count/schedules` | `GET` | List count schedules |
| **Stock Count** | `/api/v1/stock-count/submit` | `POST` | Submit physical stock reconciliation |
| **Procurement** | `/api/v1/procurement/orders` | `GET` | List active & past purchase orders |
| **Procurement** | `/api/v1/procurement/poq-recommendations` | `GET` | Compute live POQ recommendations |
| **Procurement** | `/api/v1/procurement/goods-receipt` | `POST` | Receive goods & create batches with BBD |
| **Expiration** | `/api/v1/expiration/expiring` | `GET` | Batches expiring within 7 days |
| **Expiration** | `/api/v1/expiration/suggestions` | `GET` | Promotional waste reduction recipes |
| **Expiration** | `/api/v1/expiration/waste-log` | `POST` | Log waste disposal & record loss |
| **Analytics** | `/api/v1/analytics/health` | `GET` | Inventory health score & turnover |
| **Analytics** | `/api/v1/analytics/valuation` | `GET` | Stock valuation & category breakdown |
| **Team** | `/api/v1/team/members` | `GET` | List store staff & roles |
| **Settings** | `/api/v1/settings/store` | `GET/PUT` | Manage store preferences |
| **Notifications**| `/api/v1/notifications` | `GET/PATCH` | User & store notifications |
