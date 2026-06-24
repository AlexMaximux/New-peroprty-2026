# Prompt to give Claude Code

Copy everything below the line into Claude Code (run it from an empty project folder that already contains `.claude/CLAUDE.md`, `CLAUDE.local.md`, and `docs/new-property-functional-spec.md`).

---

You are building **PropVest**, a private UK property investment marketplace. Read `.claude/CLAUDE.md`, `CLAUDE.local.md`, and `docs/new-property-functional-spec.md` in full before writing any code. The spec file is the normative source of truth for property fields; `.claude/CLAUDE.md` is the source of truth for architecture, scope, and conventions. **Do not add any commission or payment functionality** — V1 only connects buyers and sellers.

## Your objective
Build a working, tested V1 monorepo (web + mobile + API) matching `.claude/CLAUDE.md`. Then prove it works by running typecheck, lint, and the full test suite, and fixing everything until green.

## Tech stack (already decided — do not substitute)
- Monorepo: pnpm workspaces + Turborepo.
- Web: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + React Query + React Hook Form + Zod.
- Mobile: Expo (React Native) + TypeScript + Expo Router + NativeWind + React Query, sharing Zod schemas and the API client with web.
- Backend: NestJS + PostgreSQL + Prisma. Auth: argon2 + JWT (access + rotating refresh). Storage: S3-compatible (MinIO locally). Messaging: Socket.IO gateway + REST history.
- English-only UI. Money stored as integer pence. All domain enums, Zod schemas, and financial calc functions live in `packages/shared`.

## Work in phases. After each phase, run typecheck + lint + tests and stop on failures before moving on.

**Phase 0 — Scaffold**
- Create the monorepo (`apps/api`, `apps/web`, `apps/mobile`, `packages/shared`, `packages/api-client`, `packages/config`).
- Shared ESLint/Prettier/tsconfig presets. `turbo.json` with dev/build/typecheck/lint/test pipelines.
- `docker-compose.yml` for Postgres + MinIO. Root scripts: `dev`, `build`, `typecheck`, `lint`, `test`, `test:e2e`, `db:migrate`, `db:seed`, `db:studio`.

**Phase 1 — Data model & auth**
- Prisma schema for all entities in `.claude/CLAUDE.md §7` (User, AgencyProfile, AgencyDocument, Listing + strategy data, ListingMedia, HmoRoom, PortfolioAsset, Favourite, Conversation, Message, AdminAuditLog). Use enums; index search columns; money in pence.
- Migrations + a seed script (admin, approved agency, pending agency, buyer, ~10 sample listings across strategies; accounts as in `CLAUDE.local.md`).
- Auth: register/login/refresh/logout, argon2, JWT, role-based guards, ownership checks. Integration tests including permission-failure cases.

**Phase 2 — Agency onboarding & admin**
- Agency registration + document upload (StorageService over MinIO, signed URLs).
- Admin endpoints + UI to list/approve/reject agencies (with reason) and moderate/unpublish listings. Enforce: only APPROVED agencies can publish.

**Phase 3 — Listings: the New Property form**
- Implement the modular multi-step form from spec §8–§9 and `docs/new-property-functional-spec.md`: Step 1 category, Step 2 strategy, Step 3 base info, then dynamic strategy sections driven by a config object. Repeatable HMO rooms and portfolio assets. Draft save + summary panel before submit.
- V1 minimum strategies fully working: base info, Rent-to-Rent HMO, Rent-to-Rent SA, Sell Property, Lease Option, agency details, media upload. Scaffold the rest with typed Zod schemas.
- Implement all financial calc functions in `packages/shared` exactly per spec §9, each with unit tests (normal/zero/edge). Inline calculators in the form consume these shared functions.

**Phase 4 — Search, browse, favourites**
- Listing search/filter API + web UI: filter by category, strategy, full property-type list, postcode/region, price range, ROI band, refurb required, plus Exclude Sold / Exclude Reserved. Listing detail page with media gallery and Google Map.
- Favourites.

**Phase 5 — Google Maps (REAL) + mocked integrations**
- Real Google Maps: Places Autocomplete + Geocoding (server `GeocodingService`) + map display on web and mobile, keys from env.
- `AirDnaService` and `PropertyDataService` interfaces with deterministic Mock implementations selected by env flags (`AIRDNA_MODE=mock`, `PROPERTY_DATA_MODE=mock`).

**Phase 6 — Messaging**
- Conversation (buyer + listing’s agency) + realtime messages with read receipts (Socket.IO + REST history). Web + mobile UI. Authorization so users only see their own conversations.

**Phase 7 — Mobile app**
- Expo app reusing shared schemas + api-client: auth, browse/search, listing detail, favourites, messaging. (Listing creation may be web-first — ask me before deferring.)

**Phase 8 — Quality gate**
- Playwright e2e for: register, agency approval, create listing, search, send message.
- Ensure `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` all pass. Write a short `README.md` with setup + run instructions.

## Rules
- TypeScript strict, no `any`. Zod-validate every boundary. Authorization on every endpoint.
- Never commit secrets; respect `.gitignore` (include `CLAUDE.local.md`, `.env*`).
- Conventional Commits, small focused changes.
- Do NOT build commission/payments/billing.
- If a requirement is ambiguous or a decision is hard to reverse (schema, auth, money representation), pause and ask me one focused question before continuing.

Start with Phase 0 now. After scaffolding, show me the directory tree and the Prisma schema for review before Phase 2.
