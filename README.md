# BookStore — Full-Stack Web App with MoMo & ZaloPay

A bookstore web app featuring browse, cart, checkout, and QR-based payment via MoMo or ZaloPay.

## Tech Stack

| Layer    | Tech                                                                        |
| -------- | --------------------------------------------------------------------------- |
| Frontend | React + Vite + TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query       |
| Backend  | NestJS + TypeScript, Sequelize ORM, PostgreSQL                              |
| Auth     | JWT (passport-jwt)                                                          |
| Payment  | MoMo Wallet (QR code via `captureWallet`), ZaloPay (QR code via v2 gateway) |

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
cp .env.example .env   # fill in your DB credentials and payment keys
npm install
npm run start:dev
```

Books are **auto-seeded** on first startup (12 books).
On startup, Sequelize automatically syncs the schema (`sync: { alter: true }`) — new columns are added to existing tables without data loss.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Environment Variables (`backend/.env`)

### Database & App

| Variable         | Description                    |
| ---------------- | ------------------------------ |
| `DB_HOST`        | PostgreSQL host                |
| `DB_PORT`        | PostgreSQL port (default 5432) |
| `DB_USERNAME`    | DB username                    |
| `DB_PASSWORD`    | DB password                    |
| `DB_NAME`        | Database name (`bookstore`)    |
| `JWT_SECRET`     | Secret key for JWT signing     |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`)       |
| `PORT`           | Backend port (default 3000)    |
| `FRONTEND_URL`   | Frontend origin for CORS       |

### MoMo Payment

| Variable            | Description                                                   |
| ------------------- | ------------------------------------------------------------- |
| `MOMO_PARTNER_CODE` | MoMo partner code                                             |
| `MOMO_ACCESS_KEY`   | MoMo access key                                               |
| `MOMO_SECRET_KEY`   | MoMo secret key (HMAC-SHA256)                                 |
| `MOMO_ENDPOINT`     | MoMo API endpoint (sandbox or production)                     |
| `MOMO_REDIRECT_URL` | URL MoMo redirects user to after payment                      |
| `MOMO_IPN_URL`      | Public URL for MoMo IPN webhook (requires ngrok on localhost) |

### ZaloPay Payment

| Variable               | Description                                                      |
| ---------------------- | ---------------------------------------------------------------- |
| `ZALOPAY_APP_ID`       | ZaloPay app ID                                                   |
| `ZALOPAY_KEY1`         | ZaloPay key1 — used to sign create-order requests                |
| `ZALOPAY_KEY2`         | ZaloPay key2 — used to validate IPN callbacks                    |
| `ZALOPAY_ENDPOINT`     | ZaloPay create-order endpoint                                    |
| `ZALOPAY_CALLBACK_URL` | Public URL for ZaloPay IPN webhook (requires ngrok on localhost) |
| `ZALOPAY_REDIRECT_URL` | URL ZaloPay redirects user to after payment                      |

---

## Payment Flow

### Checkout

1. User adds books to cart → proceeds to checkout
2. Fills in name & address
3. Selects payment method: **MoMo** or **ZaloPay**
4. Clicks **Place Order & Pay** → order is created → redirected to payment page

### MoMo Payment

1. Backend calls MoMo API with HMAC-SHA256 signature (key: `MOMO_SECRET_KEY`)
2. Returns `payUrl` + `qrCodeUrl`
3. Frontend displays QR code — user scans with MoMo app
4. MoMo POSTs to `MOMO_IPN_URL` → backend validates signature → marks order as **paid**
5. MoMo redirects user to `/payment/callback` → frontend shows success

### ZaloPay Payment

1. Backend calls ZaloPay v2 API with HMAC-SHA256 MAC (key: `ZALOPAY_KEY1`)
2. Returns `order_url` + `qr_code`
3. Frontend displays QR code — user scans with ZaloPay app (or opens URL in browser)
4. ZaloPay POSTs to `ZALOPAY_CALLBACK_URL` → backend validates MAC (key: `ZALOPAY_KEY2`) → marks order as **paid**
5. ZaloPay redirects user to `/payment/zalopay/callback` → frontend shows success

### Sandbox — IPN Callback (ngrok required)

Payment providers call your backend to confirm payments. On localhost, you need to expose port 3000:

```bash
ngrok http 3000
# Copy the HTTPS URL, e.g. https://abc123.ngrok.io
```

Then update `.env`:

```env
MOMO_IPN_URL=https://abc123.ngrok.io/payment/ipn
ZALOPAY_CALLBACK_URL=https://abc123.ngrok.io/payment/zalopay/callback
```

Restart the backend after changing `.env`.

---

## API Endpoints

| Method | Path                        | Auth | Description                      |
| ------ | --------------------------- | ---- | -------------------------------- |
| POST   | `/auth/register`            | —    | Register                         |
| POST   | `/auth/login`               | —    | Login                            |
| GET    | `/books`                    | JWT  | List books (supports `?search=`) |
| GET    | `/cart`                     | JWT  | Get cart                         |
| POST   | `/cart`                     | JWT  | Add to cart                      |
| PATCH  | `/cart/:itemId`             | JWT  | Update quantity                  |
| DELETE | `/cart/:itemId`             | JWT  | Remove item                      |
| POST   | `/orders`                   | JWT  | Create order from cart           |
| GET    | `/orders`                   | JWT  | List my orders                   |
| GET    | `/orders/:id`               | JWT  | Get order detail                 |
| POST   | `/payment/momo/:orderId`    | JWT  | Create MoMo QR payment           |
| POST   | `/payment/ipn`              | —    | MoMo IPN webhook                 |
| GET    | `/payment/callback`         | —    | MoMo redirect callback           |
| POST   | `/payment/zalopay/callback` | —    | ZaloPay IPN webhook              |
| GET    | `/payment/zalopay/redirect` | —    | ZaloPay redirect callback        |
| POST   | `/payment/zalopay/:orderId` | JWT  | Create ZaloPay QR payment        |

---

## Developer References

### MoMo

| Resource                         | URL                                                                       |
| -------------------------------- | ------------------------------------------------------------------------- |
| Developer Portal                 | https://developers.momo.vn                                                |
| API Introduction                 | https://developers.momo.vn/v3/docs/payment/api/collection/                |
| Create Payment (`captureWallet`) | https://developers.momo.vn/v3/docs/payment/api/collection/pay-with-method |
| IPN / Callback                   | https://developers.momo.vn/v3/docs/payment/api/collection/ipn             |
| Signature Algorithm              | https://developers.momo.vn/v3/docs/payment/api/collection/signature       |
| Test Credentials                 | https://developers.momo.vn/v3/docs/payment/api/test-instructions          |
| Sandbox Portal                   | https://test-payment.momo.vn                                              |

### ZaloPay

| Resource                | URL                                                                            |
| ----------------------- | ------------------------------------------------------------------------------ |
| Developer Docs          | https://docs.zalopay.vn                                                        |
| Gateway Overview        | https://docs.zalopay.vn/docs/gateway/overview                                  |
| Create Order API        | https://docs.zalopay.vn/docs/api/others/createorder                            |
| Signature / MAC         | https://docs.zalopay.vn/docs/developer-tools/security/secure-data-transmission |
| IPN / Callback          | https://docs.zalopay.vn/docs/developer-tools/knowledge-base/callback           |
| Result / Status Codes   | https://docs.zalopay.vn/docs/developer-tools/knowledge-base/status-codes       |
| Sandbox Merchant Portal | https://sbmc.zalopay.vn                                                        |
| SDK (Node.js)           | https://github.com/zalopay-oss/zalopay-nodejs                                  |
| Sample Projects         | https://github.com/zalopay-samples                                             |
