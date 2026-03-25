# BookStore — Full-Stack Web App with MoMo Payment

A bookstore web app featuring browse, cart, checkout, and QR-based MoMo payment.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query |
| Backend | NestJS + TypeScript, Sequelize ORM, PostgreSQL |
| Auth | JWT (passport-jwt) |
| Payment | MoMo Wallet (QR code via `captureWallet`) |

## Project Structure

```
test-momo/
├── backend/        # NestJS API (port 3000)
│   └── src/
│       ├── auth/
│       ├── users/
│       ├── books/
│       ├── cart/
│       ├── orders/
│       ├── payment/
│       └── constants/
└── frontend/       # React + Vite (port 5173)
    └── src/
        ├── features/auth/
        ├── features/books/
        ├── features/cart/
        ├── features/checkout/
        ├── features/dashboard/
        └── features/payment/
```

## Prerequisites

- Node.js >= 18
- PostgreSQL running locally

## Setup

### 1. Database

Create the database in PostgreSQL:

```sql
CREATE DATABASE bookstore;
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # fill in your DB credentials
npm install
npm run start:dev
```

Books are **auto-seeded** on first startup (12 books).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Environment Variables (backend/.env)

| Variable | Description |
|---|---|
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port (default 5432) |
| `DB_USERNAME` | DB username |
| `DB_PASSWORD` | DB password |
| `DB_NAME` | Database name (`bookstore`) |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`) |
| `MOMO_PARTNER_CODE` | MoMo partner code |
| `MOMO_ACCESS_KEY` | MoMo access key |
| `MOMO_SECRET_KEY` | MoMo secret key |
| `MOMO_ENDPOINT` | MoMo API endpoint (sandbox or production) |
| `MOMO_REDIRECT_URL` | URL MoMo redirects to after payment |
| `MOMO_IPN_URL` | Public URL for MoMo payment notification |

## MoMo Payment Flow

1. User adds books to cart → proceeds to checkout
2. Fills in name & address → places order
3. Backend calls MoMo API → receives `payUrl` + `qrCodeUrl`
4. Frontend displays QR code (generated from `payUrl`)
5. User scans with MoMo app → confirms payment
6. MoMo calls `MOMO_IPN_URL` → backend marks order as paid

### Sandbox Credentials

Use the pre-filled sandbox credentials in `.env.example`. For the IPN callback to work on localhost, expose your backend with [ngrok](https://ngrok.com):

```bash
ngrok http 3000
# then set MOMO_IPN_URL=https://<your-id>.ngrok.io/payment/ipn
```

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register |
| POST | `/auth/login` | — | Login |
| GET | `/books` | JWT | List books (supports `?search=`) |
| GET | `/cart` | JWT | Get cart |
| POST | `/cart` | JWT | Add to cart |
| PATCH | `/cart/:itemId` | JWT | Update quantity |
| DELETE | `/cart/:itemId` | JWT | Remove item |
| POST | `/orders` | JWT | Create order from cart |
| GET | `/orders` | JWT | List my orders |
| GET | `/orders/:id` | JWT | Get order detail |
| POST | `/payment/momo/:orderId` | JWT | Create MoMo QR payment |
| POST | `/payment/ipn` | — | MoMo IPN webhook |
| GET | `/payment/callback` | — | MoMo redirect callback |
