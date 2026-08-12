# FleetCost — Vehicle Expense & Profitability Management System

A production-ready web application for managing vehicle expenses, revenue, and profitability analysis. Replaces Excel-based expense tracking with a structured, searchable, and reportable system.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Bootstrap 5 + Chart.js |
| Backend | Node.js + Express.js |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Excel | ExcelJS |
| PDF | PDFKit |

---

## Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL (running on port 5432)
- Create a database: `CREATE DATABASE fleetcost_db;`

### Backend Setup

```bash
cd backend
npm install
```

Copy and configure environment:
```bash
cp .env.example .env
# Edit .env with your DB credentials
```

Run migrations and seed:
```bash
npx prisma migrate dev --name init
node prisma/seed.js
```

Start backend:
```bash
node src/server.js
```
Backend runs on: **http://localhost:5000**

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: **http://localhost:5173**

---

## Default Login

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `Admin@1234` |

> ⚠️ Change your password after first login via Settings.

---

## Features

### Expense Management
- **4 Expense Types:** Washing, Fuel, Vehicle Service, Office
- Type-specific sub-categories (e.g. Body Wash, EMI, Fuel, PUC, Insurance)
- Payment Methods: SBI, Cash, UPI, N/A
- Payment Status tracking: Paid / Unpaid
- Full CRUD with soft-delete
- Advanced filtering: date range, vehicle, party, amount range, payment status

### Vehicle Management
- Vehicle categories: 2 Wheeler, 4 Wheeler
- Sub-categories: Hatchback, Sedan, SUV, Compact SUV, Motorcycle, Scooty, MUV
- Active / Inactive status toggle

### Party / Vendor Management
- Types: Fuel Station, Washing Center, Service Center, Supplier, Office Vendor, Other
- Quick inline creation from expense form

### Revenue & Profitability
- Annual revenue entry per vehicle per year
- Profitability Report: Revenue − Vehicle Cost = Profit/Loss
- Profit margin % calculation
- Sortable by: highest profit, lowest margin, highest expense, etc.
- Color-coded rows: green (profitable), red (loss)

### Reports
| Report | Export Formats |
|---|---|
| Monthly Report | Excel, PDF |
| Yearly Report | Excel, PDF |
| Vehicle Expense Report | Excel |
| Vehicle Profitability | Excel, PDF |

### Import
- Bulk import from Excel template
- Row-level validation with error reporting
- Atomic transaction (all-or-nothing)

---

## API Endpoints

```
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/change-password

GET    /api/vehicles
GET    /api/vehicles/active
POST   /api/vehicles
GET    /api/vehicles/:id
PUT    /api/vehicles/:id
PATCH  /api/vehicles/:id/status

GET    /api/parties
GET    /api/parties/active
POST   /api/parties
GET    /api/parties/:id
PUT    /api/parties/:id
PATCH  /api/parties/:id/status

GET    /api/expenses
POST   /api/expenses
GET    /api/expenses/:id
PUT    /api/expenses/:id
DELETE /api/expenses/:id

GET    /api/revenue
POST   /api/revenue
GET    /api/revenue/:id
PUT    /api/revenue/:id
DELETE /api/revenue/:id

GET    /api/dashboard

GET    /api/reports/monthly?month=8&year=2026
GET    /api/reports/yearly?year=2026
GET    /api/reports/vehicle-expense?vehicleId=...&year=2026
GET    /api/reports/profitability?year=2026

GET    /api/export/template
GET    /api/export/expenses
GET    /api/export/monthly?month=8&year=2026
GET    /api/export/yearly?year=2026
GET    /api/export/vehicle-expense?vehicleId=...
GET    /api/export/profitability?year=2026
GET    /api/export/pdf/monthly?month=8&year=2026
GET    /api/export/pdf/yearly?year=2026
GET    /api/export/pdf/profitability?year=2026

POST   /api/import/expenses
```

---

## Environment Variables

```env
DATABASE_URL=postgresql://postgres:123456789@localhost:5432/fleetcost_db
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```
