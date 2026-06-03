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

Required environment variables:

```txt
DATABASE_URL
JWT_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

Environment variable plan:

```txt
DATABASE_URL                         Production Postgres connection string. Required for signup, login, account, orders, and products.
JWT_SECRET                           Long random secret for login tokens. Use the same value for Production, Preview, and Development.
STRIPE_SECRET_KEY                    Stripe secret key from the same Stripe mode you are deploying.
STRIPE_WEBHOOK_SECRET                Stripe webhook signing secret for https://YOUR_DOMAIN/api/payment/webhook.
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY   Stripe publishable key from the same Stripe mode as STRIPE_SECRET_KEY.
NEXT_PUBLIC_API_BASE_URL             Leave unset on Vercel when this same app hosts /api.
```

Do not use the local `.env.local` fallback auth store on Vercel. Vercel sets `VERCEL=1`, so signup and login require a real Postgres database with the schema installed.

Database setup:

1. Create or connect a Postgres database in Vercel.
2. Copy its connection string into `DATABASE_URL` for Production, Preview, and Development.
3. Run [database/init.sql](database/init.sql) once in that database.
4. Open `/api/products` once after deploy. This seeds the default products if the `products` table is empty.

Do not set `NEXT_PUBLIC_API_BASE_URL` on Vercel unless the API is hosted somewhere else. The frontend defaults to `/api`, which now points at the Next route handlers in this same app.

Stripe webhook endpoint:

```txt
https://YOUR_DOMAIN/api/payment/webhook
```

Deploy checklist:

1. Add all required environment variables in Vercel Project Settings -> Environment Variables.
2. Redeploy after adding or changing env vars.
3. Visit `https://YOUR_DOMAIN/api/healthz` and confirm it returns `{ "status": "ok" }`.
4. Visit `https://YOUR_DOMAIN/api/products` once to seed merch products.
5. Test signup with a new email.
6. Log out, then log in with that same email and password.
