# Golf Charity Subscription Platform

## Overview

A subscription-based golf platform combining performance tracking, charity fundraising, and a monthly draw-based reward engine. Users subscribe, enter Stableford scores, participate in monthly prize draws, and support their chosen charity.

**Live at:** `https://<domain>/`
**App name:** FairwayImpact

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@golfcharity.com | admin123456 |
| Player | player@golfcharity.com | user123456 |

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **Frontend**: React + Vite (artifacts/golf-platform)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Session-based (express-session)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild

## Structure

```text
├── artifacts/
│   ├── api-server/         # Express API server (port 8080, served at /api)
│   └── golf-platform/      # React + Vite frontend (served at /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
└── pnpm-workspace.yaml
```

## Key Features

- **Subscription system**: Monthly (£10) and yearly (£100) plans
- **Score management**: Rolling 5-score Stableford history (1-45 range)
- **Draw engine**: Monthly draw using scores as ticket numbers; 5/4/3 match prizes
- **Prize pool**: 40% jackpot (rolls over), 35% 4-match, 25% 3-match
- **Charity system**: User selects charity, min 10% contribution from subscription
- **Admin panel**: User management, draw creation/simulation/publish, charity CRUD, winner verification

## Frontend Pages

| Path | Access | Description |
|------|--------|-------------|
| / | Public | Landing page — hero, how it works, charities, pricing |
| /login | Public | Login form |
| /register | Public | Registration + charity/plan selection |
| /dashboard | Authenticated | Score entry, subscription, draws, winnings |
| /charities | Public | Charity directory with search |
| /draws | Public | Draw history and prize pool |
| /admin | Admin only | Full admin panel |

## API Routes

- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user
- `GET/PUT /api/users/profile` — User profile
- `GET/POST /api/scores` — Score management
- `GET/POST /api/subscriptions/current` — Subscription management
- `GET /api/charities` — Charity listing
- `GET/POST /api/draws` — Draw management
- `GET /api/draws/prize-pool` — Current prize pool
- `GET /api/winners/my-winnings` — User winnings
- `GET /api/admin/users` — Admin user management
- `GET /api/admin/analytics` — Platform analytics

## Database Tables

- `users` — User accounts with role, charity selection, contribution %
- `subscriptions` — Plan, status, amounts, prize pool contributions
- `scores` — Stableford scores (max 5 per user, rolling)
- `charities` — Charity directory with featured flag
- `draws` — Monthly draws with status and drawn numbers
- `draw_participants` — Per-draw user participation with scores snapshot
- `winners` — Winner records with verification status

## TypeScript & Composite Projects

Every lib package extends `tsconfig.base.json` (composite: true). Run `pnpm run typecheck` from root.

## Key Commands

- `pnpm --filter @workspace/api-spec run codegen` — Regenerate API client from OpenAPI spec
- `pnpm --filter @workspace/db run push` — Push schema changes to DB
- `pnpm --filter @workspace/api-server run dev` — Run API server
- `pnpm --filter @workspace/golf-platform run dev` — Run frontend
