# Deployment Guide

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- S3-compatible storage (AWS S3, Cloudflare R2, or MinIO for local)
- Stripe account (test keys for development)
- Resend account (for transactional emails)
- (Optional) Coinbase Commerce account for crypto payments

## Environment Variables

Copy `.env.example` to `.env` and configure all values:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Random 64-char string for JWT signing |
| `NEXTAUTH_URL` | Yes | App URL (http://localhost:3000 for dev) |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `S3_ENDPOINT` | For uploads | S3/R2 endpoint URL |
| `S3_BUCKET` | For uploads | Bucket name |
| `S3_ACCESS_KEY_ID` | For uploads | S3 access key |
| `S3_SECRET_ACCESS_KEY` | For uploads | S3 secret key |
| `S3_PUBLIC_URL` | For uploads | Public CDN URL for images |
| `RESEND_API_KEY` | For emails | Resend API key |
| `COINBASE_COMMERCE_API_KEY` | For crypto | Coinbase Commerce API key |
| `COINBASE_COMMERCE_WEBHOOK_SECRET` | For crypto | Coinbase webhook secret |

## Local Development Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Start PostgreSQL
```bash
# Option A: Docker
docker compose up db -d

# Option B: Local PostgreSQL
# Make sure PostgreSQL is running and create the database:
# createdb maldives_dream
```

### 3. Push schema & seed
```bash
npx prisma db push   # Creates tables
npm run db:seed       # Seeds sample data
```

### 4. Start dev server
```bash
npm run dev
```

Visit http://localhost:3000 for the customer site.
Admin panel: http://localhost:3000/login

### 5. Stripe webhooks (local)
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook signing secret to STRIPE_WEBHOOK_SECRET in .env
```

### 6. MinIO for local S3 (optional)
```bash
docker compose up minio -d
# Console: http://localhost:9001 (minioadmin/minioadmin)
# Create a bucket named "maldives-dream"
# Set S3_ENDPOINT=http://localhost:9000 in .env
```

## Production Deployment

### Docker Deployment

```bash
# Build and run everything
docker compose up --build -d

# Run database migrations
docker compose exec app npx prisma migrate deploy

# Seed initial data (first time only)
docker compose exec app npm run db:seed
```

### Vercel Deployment

1. Connect your Git repository to Vercel
2. Set all environment variables in Vercel dashboard
3. Add build command: `npx prisma generate && npm run build`
4. Set output directory to `.next`
5. Configure Stripe webhook endpoint to `https://yourdomain.com/api/webhooks/stripe`
6. Configure Coinbase webhook to `https://yourdomain.com/api/webhooks/crypto`

### VPS/Cloud Deployment

```bash
# 1. Clone, install, build
git clone <repo>
cd maldives-dream
npm ci --production=false
npx prisma generate
npm run build

# 2. Start with PM2
npm install -g pm2
pm2 start npm --name "maldives-dream" -- start

# 3. Reverse proxy (Nginx example)
# server {
#   listen 443 ssl;
#   server_name yourdomain.com;
#   location / { proxy_pass http://localhost:3000; }
# }
```

## Database Migrations

For development:
```bash
npx prisma migrate dev --name description_of_change
```

For production:
```bash
npx prisma migrate deploy
```

## Webhook Setup

### Stripe
1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events: `checkout.session.completed`, `checkout.session.expired`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

### Coinbase Commerce
1. Go to Coinbase Commerce Settings > Webhook subscriptions
2. Add URL: `https://yourdomain.com/api/webhooks/crypto`
3. Copy shared secret to `COINBASE_COMMERCE_WEBHOOK_SECRET`

## Monitoring

The app uses structured JSON logging. In production, pipe stdout to your log aggregator:

```bash
# Example with Docker
docker logs -f maldives-dream-app-1 | jq .

# Or use a log driver
docker compose up -d --log-driver=json-file
```

## Backup

```bash
# Database backup
pg_dump maldives_dream > backup_$(date +%Y%m%d).sql

# Restore
psql maldives_dream < backup_20260101.sql
```
