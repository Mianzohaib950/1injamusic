# Vercel Deployment

Deploy this folder as the Vercel project root:

```txt
1injamusic-main/1njamaicamusic
```

Use the default commands:

```txt
Install Command: npm install
Build Command: npm run build
Output Directory: .next
```

Pre-deploy local checks:

1. Run `npm run typecheck`.
2. Run `npm run build`.
3. Confirm `.env.local` does not contain placeholder values for production keys.

Required environment variables:

```txt
DATABASE_URL
JWT_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET
```

Environment variable plan (core):

```txt
DATABASE_URL                         Production Postgres connection string. Required for signup, login, account, orders, and products.
JWT_SECRET                           Long random secret for login tokens.
STRIPE_SECRET_KEY                    Stripe secret key from the same Stripe mode you are deploying.
STRIPE_WEBHOOK_SECRET                Stripe webhook signing secret for https://YOUR_DOMAIN/api/payment/webhook.
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY   Stripe publishable key from the same Stripe mode as STRIPE_SECRET_KEY.
SUPABASE_URL                         Supabase project URL (used for Storage uploads from admin panel).
SUPABASE_SERVICE_ROLE_KEY            Supabase service role key (server-side only).
SUPABASE_STORAGE_BUCKET              Bucket name for uploaded admin images (example: media).
NEXT_PUBLIC_API_BASE_URL             Leave unset on Vercel when this same app hosts /api.
PASSWORD_RESET_TOKEN_EXPIRES_IN_MINUTES  Optional. Example: 10.
```

Email environment plan (choose one provider):

Option A: Resend

```txt
RESEND_API_KEY
RESEND_FROM_EMAIL
BOOKING_NOTIFY_EMAILS
```

Option B: SMTP

```txt
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASS
SMTP_FROM_EMAIL
SMTP_FROM_NAME
BOOKING_NOTIFY_EMAILS
```

Important email behavior:

1. If `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` are set, app uses SMTP.
2. If SMTP is not configured, app falls back to Resend.
3. For pure Resend flow on Vercel, keep SMTP variables unset.

Do not use the local `.env.local` fallback auth store on Vercel. Vercel sets `VERCEL=1`, so signup and login require a real Postgres database with schema installed.

Database setup:

1. Create or connect a Postgres database in Vercel.
2. Copy its connection string into `DATABASE_URL` for Production (and Preview if needed).
3. Run [database/init.sql](database/init.sql) once in that database.
4. Open `/api/products` once after deploy. This seeds the default products if the `products` table is empty.
5. Ensure at least one admin exists in `users` table (`role = 'admin'`).

Do not set `NEXT_PUBLIC_API_BASE_URL` on Vercel unless the API is hosted somewhere else. The frontend defaults to `/api`, which now points at the Next route handlers in this same app.

Stripe webhook endpoint:

```txt
https://YOUR_DOMAIN/api/payment/webhook
```

Deploy checklist:

1. Add all required environment variables in Vercel Project Settings -> Environment Variables.
2. Set each variable for the correct environment scope: Production and Preview.
3. Redeploy after adding or changing env vars.
4. Visit `https://YOUR_DOMAIN/api/healthz` and confirm it returns `{ "status": "ok" }`.
5. Visit `https://YOUR_DOMAIN/api/products` once to seed merch products.
6. Test signup/login with a new user.
7. Test admin login and verify redirect to `/admin`.
8. Test booking form and event contact form, then confirm emails are delivered.
9. Test checkout flow and verify Stripe payment intent API works.

Post-deploy troubleshooting:

1. `500` on auth endpoints: check `DATABASE_URL` and database network access.
2. Booking/event emails not sending: verify SMTP or Resend keys and sender email verification.
3. Stripe errors: check key mode mismatch (test/live) and webhook secret value.
4. Images staying as base64 in DB: verify `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET`.
