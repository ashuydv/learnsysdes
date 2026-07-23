# LearnSysDes

A learning + practice app for system design (HLD). Phase 1 MVP: auth, a dashboard,
static learning modules with quizzes, and 5 HLD practice problems with an
interactive tldraw canvas, back-of-envelope estimation, save/reload, and a
reference-solution reveal.

## Tech stack

- **Frontend/backend**: Next.js 16 (App Router, Server Actions), TypeScript, Tailwind CSS
- **Database**: PostgreSQL via Prisma ORM 7 (`@prisma/adapter-pg`)
- **Auth**: Auth.js (NextAuth v5) — email/password (Credentials) + optional Google/GitHub OAuth
- **Diagramming**: [tldraw](https://tldraw.dev) SDK embedded as an interactive whiteboard

## Prerequisites

- Node.js 20.19+
- Docker (for local Postgres) — or point `DATABASE_URL` at any Postgres instance

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example env file and adjust if needed:

   ```bash
   cp .env.example .env
   ```

   The defaults work with the bundled `docker-compose.yml` (Postgres on port `5433`,
   chosen to avoid clashing with a default local Postgres on `5432`). Generate a
   fresh `AUTH_SECRET` with:

   ```bash
   npx auth secret
   ```

3. Start Postgres:

   ```bash
   docker compose up -d
   ```

4. Run migrations and generate the Prisma client:

   ```bash
   npx prisma migrate dev
   ```

5. Seed the database with 10 learning modules and 5 practice problems:

   ```bash
   npx prisma db seed
   ```

6. Start the dev server:

   ```bash
   npm run dev
   ```

   Visit http://localhost:3000, sign up with an email/password, and go.

## Optional: OAuth providers

Email/password works out of the box. To enable Google or GitHub sign-in, create
an OAuth app with each provider and set the corresponding env vars in `.env`:

- **Google**: [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
  → `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
  → Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
- **GitHub**: [github.com/settings/developers](https://github.com/settings/developers)
  → `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`
  → Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

Leave either pair blank to hide that provider's button on the sign-in/sign-up pages.

## Project structure

```
prisma/schema.prisma       Database schema (users, modules, progress, problems, submissions)
prisma/seed.ts             Seeds 10 modules + 5 practice problems
src/app/                   Routes: /, /sign-in, /sign-up, /dashboard, /modules, /problems
src/lib/auth.ts            Auth.js config (Credentials + Google + GitHub)
src/lib/actions.ts         Server actions: quiz submission, progress, diagram/estimation save
src/lib/diagram-builder.ts Headless tldraw snapshot builder (used by the seed script)
src/proxy.ts               Route protection for /dashboard, /modules, /problems
src/components/            UI: quiz form, tldraw canvas, estimation panel, etc.
```

## Subscription tiers (future)

The `User` model already has `subscriptionTier`, `subscriptionStatus`,
`stripeCustomerId`, `stripeSubscriptionId`, and `currentPeriodEnd` fields
(all nullable/defaulted to free-tier values), so paid tiers can be added later
without a schema rewrite.

## Notes

- All content in Phase 1 is static (seeded), no AI generation yet.
- Diagrams are stored as tldraw snapshots (`Json` columns); the reference
  solution diagrams are generated programmatically at seed time.
- This project was scaffolded against pre-release/newer versions of Next.js (16),
  React (19.2), and Prisma (7) — check `node_modules/next/dist/docs` and the
  Prisma skills in `.claude/skills` if you hit an unfamiliar API while extending it.
