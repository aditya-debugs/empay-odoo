# Submission Link - https://drive.google.com/drive/folders/1JvceHkaaYfpHuxu8ZhJ8YLepFzfc4-6O?usp=sharing



# EmPay — HRMS + Payroll Management System

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js (Vite) + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | PostgreSQL (Neon DB) |
| ORM | Prisma |
| Auth | JWT |
| PDF | jsPDF |
| Hosting | Vercel (client) + Render (server) |

## Architecture

```
Request → Routes → Controller → Service → Repository → Prisma/DB
                        ↓
                   Domain Layer (rules, calculators, policies)
```

- **`client/src/features/`** — Domain modules shared across roles
- **`client/src/modules/`** — Role-specific dashboards (admin, hr, payroll-officer, employee)
- **`server/src/api/v1/`** — Versioned feature slices (routes → controller → service → validation)
- **`server/src/domain/`** — Business rules, calculators, formulas, policies
- **`server/src/repositories/`** — Data access layer (abstracts Prisma)

## Getting Started

### Client
```bash
cd client
npm install
npm run dev
```

### Server
```bash
cd server
npm install
npm run dev
```

## Adding a New Feature

**Frontend** — Create `client/src/features/<name>/` with `components/`, `pages/`, and `<name>Service.js`

**Backend** — Create `server/src/api/v1/<name>/` with `<name>.routes.js`, `<name>.controller.js`, `<name>.service.js`, `<name>.validation.js`

Mount the router in `server/src/api/v1/index.js` and add frontend routes in the relevant `modules/<role>/routes.jsx`.
