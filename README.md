# CloudLMS

CloudLMS is a production-style learning platform built with Next.js 14, Supabase, Stripe, Anthropic Claude, and shadcn/ui. It includes role-based dashboards, AI course generation, assessments, progress tracking, certificates, analytics, payments, discussion forums, and gamification.

## Tech stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS + `tailwindcss-animate`
- shadcn/ui + Radix UI
- Supabase Auth, Database, Storage, Realtime
- Stripe Checkout + webhooks
- Anthropic Claude API
- Recharts

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from your local environment values.

3. Run the app:

```bash
npm run dev
```

4. Verify the production build:

```bash
npm run typecheck
npm run build
```

## Environment variables

Use `.env.production.example` as the production template.

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon public key
- `SUPABASE_SERVICE_ROLE_KEY`: service role key for privileged server operations
- `ANTHROPIC_API_KEY`: Claude API key for AI generation and writing assistance
- `STRIPE_SECRET_KEY`: Stripe secret key for checkout session creation
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key for client checkout flows
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret for `/api/payments/webhook`

## Stripe webhook

The Stripe webhook endpoint is:

```text
/api/payments/webhook
```

For local development with the Stripe CLI, forward events to that path and set `STRIPE_WEBHOOK_SECRET` from the generated signing secret.

## Core product areas

- Authentication with role-based routing
- Admin, instructor, and learner dashboards
- Course builder and AI course generator
- Assessments and quiz delivery
- Enrollment, progress tracking, and certificates
- Notifications, gamification, and discussions
- Revenue reporting, analytics, and learning paths

## Deployment

1. Add the production environment variables from `.env.production.example` to Vercel.
2. Configure Supabase Auth redirect URLs and storage buckets.
3. Configure Stripe checkout domains and register the webhook endpoint.
4. Deploy with Vercel using the provided `vercel.json`.
5. After deploy, validate login, payments, AI generation, notifications, and storage uploads.

## Production notes

- The app uses `next-themes` for persisted dark/light mode.
- Search uses a command-palette UX backed by `/api/search`.
- Remote images are allowed through `next.config.mjs`.
