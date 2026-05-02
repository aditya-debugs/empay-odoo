# 🚀 EmPay - Quick Setup Guide

Follow these steps to set up the project on a new machine.

## 1. Prerequisites
Ensure you have the following installed:
- [Node.js (v18+)](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/download/)
- [Git](https://git-scm.com/)

---

## 2. Initial Setup

### Step 1: Install Dependencies
Open two terminals.
- **Frontend:** Go to `/client` and run `npm install`
- **Backend:** Go to `/server` and run `npm install`

### Step 2: Database Setup
1. Open **pgAdmin 4**.
2. Right-click on **Servers** > **PostgreSQL** > **Databases**.
3. Create a new database named `empay`.

### Step 3: Environment Variables
1. In the `/server` folder, create a file named `.env`.
2. Copy the contents from `.env.example` into `.env`.
3. **Important:** Update the `DATABASE_URL` with your local PostgreSQL password:
   `DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/empay?schema=public"`

### Step 4: Sync & Seed Data
In the `/server` folder terminal, run:
```bash
# Create the database tables
npx prisma db push

# Populate the database with Admin, HR, and 15 Employees
node prisma/seed.js
```

---

## 3. Running the Application

### Start Backend
In `/server`:
```bash
npm run dev
```

### Start Frontend
In `/client`:
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

---

## 4. Default Login Credentials
All accounts use the password: **`admin123`**

- **Admin:** `admin@empay.com`
- **HR Officer:** `sarah@empay.com`
- **Payroll Officer:** `david@empay.com`
- **Employee:** `john@empay.com` (Login ID: `EMPL01`)

---

## Troubleshooting
- **Port Error:** If port 5000 is occupied, you can change it in the server `.env`.
- **Prisma Error:** If you change the database schema, remember to run `npx prisma generate`.
- **EPERM Error:** If you see "operation not permitted" during install, try closing your code editor or stopping the running server first.
