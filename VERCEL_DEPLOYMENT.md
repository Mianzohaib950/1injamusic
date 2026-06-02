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

Do not set `NEXT_PUBLIC_API_BASE_URL` on Vercel unless the API is hosted somewhere else. The frontend defaults to `/api`, which now points at the Next route handlers in this same app.

Stripe webhook endpoint:

```txt
https://YOUR_DOMAIN/api/payment/webhook
```
