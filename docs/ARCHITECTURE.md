# Maldives Dream — Architecture Overview

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│  ┌──────────────────┐  ┌──────────────────────────────────┐    │
│  │  Customer Website │  │         Admin Panel              │    │
│  │  (Next.js SSR +   │  │  (Next.js Client Components)    │    │
│  │   React Client)   │  │  Role-based access (RBAC)       │    │
│  └────────┬─────────┘  └──────────────┬───────────────────┘    │
└───────────┼───────────────────────────┼────────────────────────┘
            │ HTTPS                     │ HTTPS + JWT Cookie
            ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS APP (Node.js)                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   API Routes (Route Handlers)            │   │
│  │  /api/hotels          /api/admin/hotels    (CRUD)       │   │
│  │  /api/availability    /api/admin/room-types (CRUD)      │   │
│  │  /api/reservations    /api/admin/seasons    (CRUD)      │   │
│  │  /api/payments/*      /api/admin/prices     (CRUD)      │   │
│  │  /api/webhooks/*      /api/admin/reservations           │   │
│  │  /api/manage-booking  /api/admin/reports/*               │   │
│  └────────────┬────────────────────────────────────────────┘   │
│               │                                                 │
│  ┌────────────▼────────────────────────────────────────────┐   │
│  │                    Core Services                         │   │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐  │   │
│  │  │ Pricing  │ │Availabil.│ │Reservation│ │ Payment  │  │   │
│  │  │ Engine   │ │ Engine   │ │  Service  │ │ Service  │  │   │
│  │  └──────────┘ └──────────┘ └───────────┘ └──────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐  │   │
│  │  │  Auth    │ │ Storage  │ │  Email    │ │ Reports  │  │   │
│  │  │ (JWT)    │ │  (S3)    │ │ (Resend)  │ │ Service  │  │   │
│  │  └──────────┘ └──────────┘ └───────────┘ └──────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────┬──────────────┬───────────────┬──────────────────────┘
           │              │               │
     ┌─────▼─────┐ ┌─────▼─────┐  ┌──────▼──────┐
     │ PostgreSQL │ │  S3 / R2  │  │   External  │
     │  (Prisma)  │ │  (Images) │  │  Services   │
     │            │ │           │  │ Stripe      │
     │ - Hotels   │ │           │  │ Coinbase    │
     │ - Rooms    │ │           │  │ Resend      │
     │ - Seasons  │ │           │  │             │
     │ - Prices   │ │           │  │  Webhooks   │
     │ - Bookings │ │           │  │  ◄──────    │
     │ - Payments │ │           │  │             │
     │ - Users    │ │           │  │             │
     └───────────┘ └───────────┘  └─────────────┘
```

## 2. Technology Stack

| Layer       | Technology                       |
|-------------|----------------------------------|
| Frontend    | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS |
| Backend     | Next.js API Routes (Route Handlers), TypeScript |
| Database    | PostgreSQL 16 + Prisma ORM 7     |
| Auth        | JWT (jose) + httpOnly cookies, RBAC |
| Validation  | Zod schemas                       |
| Payments    | Stripe Checkout + Coinbase Commerce |
| Storage     | S3-compatible (AWS S3 / Cloudflare R2) |
| Email       | Resend                            |
| Testing     | Vitest                            |
| Container   | Docker + docker-compose           |

## 3. Database Schema

See `prisma/schema.prisma` for the full Prisma schema. Key entities:

- **User** — Admin/staff with roles (SUPER_ADMIN, ADMIN, STAFF)
- **Hotel** — Resort listings with amenities, policies, location
- **RoomType** — Room categories per hotel with inventory counts
- **Season** — Date ranges (peak, green, festive) with overlap validation
- **SeasonalPrice** — Nightly rate per room type per season
- **DailyAllotment** — Per-date room inventory tracking (prevents double-booking)
- **Reservation** — Guest bookings with pricing snapshot
- **Payment** — Stripe/crypto payment records with webhook audit logs
- **Photo** — S3-stored images for hotels and rooms
- **AuditLog** — Who changed what and when
- **Setting** — Key-value app configuration

### Key Design Decisions

1. **Pricing snapshots**: The `pricingBreakdown` JSON field on Reservation stores
   the exact nightly rates at booking time. Later price changes don't affect existing bookings.

2. **Daily allotments**: Instead of deriving availability from reservations (slow, complex),
   we maintain a `daily_allotments` table that's atomically updated within the booking transaction.

3. **Serializable transactions**: Reservation creation uses `isolationLevel: "Serializable"`
   to prevent double-booking under concurrent requests.

## 4. API Design

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/hotels` | List active hotels (paginated, filterable) |
| GET | `/api/hotels/:id` | Hotel detail with rooms and pricing |
| GET | `/api/availability` | Check availability + price breakdown |
| POST | `/api/reservations` | Create pending reservation |
| POST | `/api/payments/stripe/session` | Create Stripe Checkout session |
| POST | `/api/payments/crypto/checkout` | Create crypto payment |
| POST | `/api/webhooks/stripe` | Stripe webhook handler |
| POST | `/api/webhooks/crypto` | Coinbase webhook handler |
| POST | `/api/manage-booking` | Lookup reservation by code + email |

### Admin Endpoints (JWT-protected)

| Method | Path | Description |
|--------|------|-------------|
| POST/GET/DELETE | `/api/admin/auth` | Login, session check, logout |
| GET/POST | `/api/admin/hotels` | List/create hotels |
| GET/PATCH/DELETE | `/api/admin/hotels/:id` | Hotel detail/update/delete |
| GET/POST | `/api/admin/room-types` | List/create room types |
| PATCH/DELETE | `/api/admin/room-types/:id` | Update/delete room type |
| GET/POST | `/api/admin/seasons` | List/create seasons |
| GET/POST | `/api/admin/prices` | List/create seasonal prices |
| POST/DELETE | `/api/admin/photos` | Upload/delete photos |
| GET | `/api/admin/reservations` | List reservations (filterable) |
| GET/PATCH | `/api/admin/reservations/:id` | Detail/status change |
| GET | `/api/admin/reservations/export` | CSV export |
| GET | `/api/admin/reports/revenue` | Revenue report |
| GET | `/api/admin/reports/occupancy` | Occupancy report |

### Example: Availability Check

```
GET /api/availability?hotelId=abc&roomTypeId=xyz&checkIn=2026-03-01&checkOut=2026-03-04&guests=2&qty=1

Response:
{
  "success": true,
  "data": {
    "roomTypeId": "xyz",
    "available": true,
    "availableRooms": 15,
    "pricing": {
      "nightlyRates": [
        { "date": "2026-03-01", "price": 850, "seasonName": "Peak Season 2026" },
        { "date": "2026-03-02", "price": 850, "seasonName": "Peak Season 2026" },
        { "date": "2026-03-03", "price": 850, "seasonName": "Peak Season 2026" }
      ],
      "subtotal": 2550,
      "taxes": 306,
      "fees": 18,
      "discount": 0,
      "total": 2874,
      "currency": "USD",
      "roomQty": 1
    },
    "missingPriceDates": []
  }
}
```

## 5. UI Sitemap

### Customer Website
```
/                        → Homepage (hero, features, CTA)
/hotels                  → Hotel listing (search, filters, pagination)
/hotels/:slug            → Hotel detail (gallery, rooms, booking widget)
/booking?params          → Booking form (guest details, payment method)
/confirmation?code=      → Confirmation page
/manage-booking          → Lookup reservation by code + email
```

### Admin Panel
```
/login                   → Admin login
/dashboard               → Stats overview + recent reservations
/hotels                  → Hotel CRUD
/rooms                   → Room type CRUD
/seasons                 → Season + pricing management
/photos                  → Photo upload/management
/reservations            → Reservation list + status actions + CSV export
/reports                 → Revenue + occupancy reports
/settings                → Platform configuration reference
```

## 6. Security Checklist

- [x] **Auth**: JWT tokens in httpOnly, Secure, SameSite cookies
- [x] **RBAC**: Role hierarchy (STAFF < ADMIN < SUPER_ADMIN) enforced per route
- [x] **Input validation**: Zod schemas on all API inputs
- [x] **SQL injection**: Prevented by Prisma ORM (parameterized queries)
- [x] **XSS**: React auto-escaping + no dangerouslySetInnerHTML
- [x] **PCI compliance**: Stripe hosted checkout — no card data touches our server
- [x] **Webhook verification**: Stripe signature verification + Coinbase HMAC verification
- [x] **Image uploads**: Presigned URLs (no file data on server), MIME type validation, size limits
- [x] **Secrets**: All secrets in env vars, .env in .gitignore
- [x] **Audit trail**: All admin actions logged with before/after snapshots
- [x] **CSRF**: POST requests require JSON Content-Type (no form submission)
- [ ] **Rate limiting**: Add middleware (e.g., upstash/ratelimit) before production
- [ ] **CORS**: Configure allowed origins for production
- [ ] **CSP headers**: Add Content-Security-Policy headers
- [ ] **Helmet/security headers**: Add via Next.js config or middleware

## 7. Deployment Guide

See `docs/DEPLOYMENT.md` for detailed steps.

### Quick Start (Local Development)

```bash
# 1. Clone and install
git clone <repo>
cd maldives-dream
npm install

# 2. Start PostgreSQL (via Docker)
docker compose up db -d

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 4. Setup database
npx prisma db push
npm run db:seed

# 5. Run dev server
npm run dev
# → http://localhost:3000

# Admin: admin@maldivesdream.com / admin123456
```

### Production Deployment

```bash
# 1. Build
npm run build

# 2. Run with Docker
docker compose up --build -d

# 3. Run migrations
docker compose exec app npx prisma migrate deploy
```
