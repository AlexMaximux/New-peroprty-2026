# PropVest — Private UK Property Investment Marketplace

> Project memory for Claude Code. Read this fully before writing any code.
> Codename **PropVest** is a placeholder — rename freely in one place if desired.
> Local-only settings and secrets live in `./CLAUDE.local.md` (git-ignored).

---

## 1. What we are building

A **private, investor-focused** property marketplace for the UK — conceptually like Rightmove / Zoopla, but **gated and specialised for investment deals** rather than open residential search.

The platform connects **sellers/sourcers/agencies** (who list investment opportunities) with **investor-buyers** (who browse and enquire). Listings emphasise investment metrics: BMV (Below Market Value), ROI, refurbishment potential, block deals, HMO/SA yields, etc.

Products:
- **Web app** (primary).
- **Mobile app** (iOS + Android) sharing as much logic/types as possible with web.

## 2. V1 scope and explicit non-goals

**In scope for V1:**
- Auth + 3 roles: **Admin**, **User/Buyer (investor)**, **Agency**.
- Agency onboarding with **document upload + admin approval** before they can publish listings.
- Listing creation via a **modular, multi-step “New Property” form** (see §8–§9) with dynamic, strategy-specific sections and **inline financial calculations**.
- Public/gated **search & browse** of listings with investment filters.
- **Messaging** between buyers and the listing’s agency/lister.
- Admin panel: approve/reject agencies, moderate listings, manage users.
- **Google Maps**: real integration (address autocomplete, geocoding, map display).
- **AirDNA** and **Property Data**: **MOCKED** behind clean interfaces (no real API calls yet).

**Explicit NON-goals for V1 (do not build):**
- **No commission handling and no payments.** We are *only* connecting buyers and sellers right now. Do **not** add Stripe, billing, invoicing, or commission collection. (Keep the data model open so commission can be added later, but build no payment flow or UI.)
- No multi-currency. GBP only.
- No real AirDNA / Property Data network calls.

## 3. Tech stack (decided — do not substitute without asking)

- **Monorepo:** pnpm workspaces + Turborepo.
- **Web:** Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui. TanStack Query for server state. React Hook Form + Zod for forms.
- **Mobile:** **React Native via Expo** (TypeScript), Expo Router, NativeWind (Tailwind for RN), React Query. Chosen so DTOs, Zod schemas, validation, and the API client are shared with web via `packages/*`.
- **Backend:** **NestJS** (TypeScript) + **PostgreSQL** via **Prisma** ORM.
- **Auth:** JWT access + refresh (httpOnly cookies on web; secure storage on mobile), argon2 password hashing, role-based guards.
- **Validation:** Zod (shared), class-validator/DTOs at Nest controllers if convenient — but keep Zod as the shared source of truth.
- **File/media storage:** S3-compatible (use MinIO locally; AWS S3 in prod). Abstract behind a `StorageService`.
- **Realtime messaging:** WebSocket gateway (Socket.IO) in Nest, with REST fallback for history.
- **UI language:** **English only.** No i18n/RTL needed for V1.

## 4. Monorepo layout

```
propvest/
  apps/
    api/        # NestJS + Prisma (PostgreSQL)
    web/        # Next.js (App Router)
    mobile/     # Expo (React Native)
  packages/
    shared/     # Zod schemas, DTO types, domain enums, financial calc functions
    api-client/ # typed client (fetch wrapper) consumed by web + mobile
    config/     # shared eslint/tsconfig/prettier presets
  .claude/CLAUDE.md
  CLAUDE.local.md
  turbo.json
  pnpm-workspace.yaml
```

**Rule:** All domain enums, Zod schemas, and **financial calculation functions live in `packages/shared`** and are imported by api, web, and mobile. Never duplicate a calculation.

## 5. Commands (wire these up in package.json / turbo)

- `pnpm dev` — run api + web (and mobile via `pnpm --filter mobile dev`).
- `pnpm build` — build all.
- `pnpm typecheck` — tsc across workspaces.
- `pnpm lint` / `pnpm lint:fix`.
- `pnpm test` — unit/integration. `pnpm test:e2e` — Playwright web e2e.
- `pnpm db:migrate` / `pnpm db:seed` / `pnpm db:studio` — Prisma.
- Provide a `docker-compose.yml` for Postgres + MinIO for local dev.

## 6. Roles & permissions

- **ADMIN**: full access. Approves/rejects agencies, moderates and can unpublish listings, manages users, views everything.
- **AGENCY**: registers, uploads verification documents, awaits approval. Once `APPROVED`, can create/edit/publish listings and message buyers. Cannot publish while `PENDING`/`REJECTED`.
- **USER (BUYER/INVESTOR)**: registers (lightweight), browses/searches listings, saves favourites, sends enquiries/messages to listers. An individual seller is modelled as a USER who can also create listings (configurable), but **agencies require verification**.

Enforce authorization on every endpoint via Nest guards + ownership checks. Buyers can only read their own messages/favourites; agencies can only edit their own listings.

## 7. Core domain model (Prisma) — high level

Model these as proper tables; use a shared base + strategy-specific data.

- **User** `{ id, email(unique), passwordHash, role, displayName, phone?, createdAt, status }`
- **AgencyProfile** `{ id, userId(unique), companyName, companyNumber?, address, contactName, phone, website?, verificationStatus(PENDING|APPROVED|REJECTED), rejectionReason?, reviewedByAdminId?, reviewedAt? }`
- **AgencyDocument** `{ id, agencyProfileId, type, fileKey, originalName, uploadedAt }`
- **Listing** (shared base) — see §8.
- **ListingMedia** `{ id, listingId, kind(PHOTO|VIDEO), fileKey, order }`
- **StrategyData** — strategy-specific fields stored as typed JSONB (`strategySpecificData`) validated by a Zod schema per strategy, plus a few promoted/indexed columns used for filtering (e.g. bedrooms, postcode, region, askingPrice, estimatedRoi, refurbRequired).
- **HmoRoom** `{ id, listingId, name, roomType, monthlyRentPence }` (repeatable group).
- **PortfolioAsset** `{ id, listingId, ... }` (repeatable group).
- **Favourite** `{ userId, listingId }`
- **Conversation** `{ id, listingId, buyerUserId, agencyUserId, createdAt }` (unique per buyer+listing).
- **Message** `{ id, conversationId, senderUserId, body, createdAt, readAt? }`
- **AdminAuditLog** `{ id, adminUserId, action, targetType, targetId, meta, createdAt }`

Store all money as **integer pence** (`*Pence` suffix). Percentages as integers or decimals consistently (document which).

## 8. The “New Property” listing form (from the functional spec)

Implement as a **multi-step / accordion** form with **conditional rendering** by category + strategy. Collect base data once, then reveal strategy-specific sections. Show a **summary panel** before submit and support **draft save**.

### Step 1 — Listing Category
`Rent to Rent | Lease Option | Sell Property | Portfolio | Commercial | Development Opportunity | Refurb Opportunity`

### Step 2 — Investment Strategy
`HMO | SA (Serviced Accommodation) | Single Let / Buy to Let | High ROI Investment | Cash Purchase | Commercial | Mixed Use | Hotel | Shop | Flat Conversion | Add Bedroom | Extension | Loft / Roof Conversion`

### Step 3 — Base Property Information (mandatory, all listings)
- **Address:** full address, postcode, building number, region, nation (England/Wales/Scotland/manual), area grouping (North/South), **Google Maps lookup + geolocation (REAL)**.
- **Classification:** property type (Terraced/Flat/Detached/Semi-detached/Other+explain), listing title, internal reference ID (optional).
- **Media:** photo upload, video upload.
- **General details:** bedrooms, bathrooms, floor area/size, living room (Y/N), garden (Y/N/notes), parking (Y/N/spaces), furnished status.
- **Furnishing spec:** Unfurnished/Furnished/Semi + quality (High/Good/Medium/Low/Other+explain).
- **Status & readiness:** vacant/tenanted, licensed/not, needs refurb (Y/N), refurb quote status (Quoted/Estimated).

### Dynamic sections (reveal by category/strategy)
Implement at least the **V1 minimum** below; scaffold the rest with typed schemas.

**Rent to Rent** (common terms: rent term, rent to landlord, deposit, contract length, review period, reference requirement [Easy/Full/LTD/Other], bills included/excluded).
- **HMO:** licence status, tenanted, refurb (Y/N)+cost+quote type; **repeatable room config** (room name, room type [Double en-suite / Double shared / Single en-suite / Single shared / Other], monthly rent); management available, agency details, finder fee, happy to co-source, notes. **Outputs:** gross monthly income (Σ room rents), money needed in, potential profit, summary.
- **SA / Serviced Accommodation:** bedrooms, bathrooms, max guests, furnished+quality; revenue inputs (rent/night, occupancy %); operating costs (rent, bills, booking fee, maintenance default 5%, management, cleaning, other); **AirDNA support = MOCKED**. **Outputs:** monthly income = occupancy × nightly × 30; yearly = occupancy × nightly × 365; total money in; total costs; profit; cost breakdown; **break-even occupancy**; summary.
- **Block of Property:** total units, unit mix (1/2/3 bed/other).

**Lease Option:** base (address, details, price, potential income, cost to buy, summary) + subtypes `BMV | HMO | High ROI | Cash` (inherit base, subtype-specific tags).

**Sell Property:** ownership/legal (freehold/leasehold, lease expiry, current rent); pricing (asking, market value, estimated value); commercial data (size, existing rent, potential rent, agency, RICS-type field); cost to buy (deposit, default 25%, stamp duty, finder fees, legal fees, other); finance (mortgage interest rate, notes); add-value (refurb/full refurb/extension/loft/convert to HMO/separate flats/add bedroom/other).
- **Development Opportunity:** cost of development, builder in place (Y/N), quote available (Y/N), estimate, legal costs, deposit, stamp duty, finder fees.
- **Refurb Opportunity:** cost to refurbish, potential add-value, summary.
- **Commercial:** Hotel / Shop / Mixed use.

**Portfolio:** title, number of properties, summary, repeatable asset list, notes.

> The full normative spec lives in `docs/new-property-functional-spec.md` (copy the attached file there). Treat it as the source of truth for fields; this section is the summary.

## 9. Financial calculations (shared, pure functions in `packages/shared`)

All currency in **pence**. Write each as a pure, unit-tested function:

- **HMO gross monthly income** = sum of all room `monthlyRentPence`.
- **HMO money needed in / potential profit** = per documented cost inputs.
- **SA potential monthly income** = `occupancyRate × nightlyRatePence × 30`.
- **SA potential yearly income** = `occupancyRate × nightlyRatePence × 365`.
- **SA break-even occupancy** = total monthly costs / (nightlyRatePence × 30).
- **SA profit** = potential income − total costs.
- **Monthly mortgage cost** = `(totalPrice × 0.75 × interestRate) / 12` (75% LTV assumption; make LTV a parameter with 0.75 default).
- **Management fee** = `10% of rent` (parameterise the rate).
- **Default deposit assumption** = 25% (parameterise).
- **Total cost to buy** = deposit + stamp duty + finder fees + legal fees + other.
- **ROI / yield** helpers for filtering and display.

Every formula must have unit tests covering normal, zero, and edge cases. Round only at display time.

## 10. Integrations

- **Google Maps (REAL):** Places Autocomplete + Geocoding + map display. Key from env (`GOOGLE_MAPS_API_KEY`, web public key restricted by referrer). Wrap server-side calls in a `GeocodingService`.
- **AirDNA (MOCK):** `AirDnaService` interface with a `MockAirDnaService` returning deterministic sample occupancy/nightly-rate data keyed by postcode + beds. Swap to real impl later via DI/env flag `AIRDNA_MODE=mock`.
- **Property Data (MOCK):** `PropertyDataService` interface with `MockPropertyDataService` (rent estimates by postcode). Flag `PROPERTY_DATA_MODE=mock`.

All three behind interfaces so V1 ships mocks without touching call sites later.

## 11. Key workflows

1. **Agency onboarding:** register → create `AgencyProfile` (PENDING) → upload `AgencyDocument`s → admin reviews → APPROVED/REJECTED (+reason). Only APPROVED agencies can publish. Notify agency of decision (in-app; email optional/stub).
2. **Listing lifecycle:** DRAFT → PUBLISHED (visible in search) → RESERVED / SOLD (filterable; support “Exclude Sold” / “Exclude Reserved” filters) → ARCHIVED. Admin can moderate/unpublish.
3. **Search & browse:** filter by listing category, strategy, property type (the full type list: Below Market Value, Block Of Apartments, Buy-2-Let, Commercial, Commercial/Industrial, Development Opportunity, HMO, Holiday Lets, Hotels, Industrial, International Property, Land, Lease Option, Mix Use, Portfolio Of Properties, Refurbishment Opportunity, Rent-2-Rent, Residential Care Homes, Retail, Serviced Accommodation, Supported Living), postcode/region, price range, ROI band, refurb required, plus Exclude Sold / Exclude Reserved toggles.
4. **Messaging:** buyer opens enquiry on a listing → `Conversation` (buyer + listing’s agency) → realtime `Message`s with read receipts. List conversations per user.

## 12. API conventions

- REST under `/api/v1`. Resource-oriented routes. Plural nouns.
- Standard error shape `{ statusCode, message, code, details? }`.
- Pagination: cursor or `page`/`limit` (document one and be consistent).
- DTO validation via Zod schemas from `packages/shared`.
- Every mutating endpoint guarded by role + ownership checks.

## 13. Database & Prisma conventions

- Use migrations (`prisma migrate`). Never edit the DB by hand.
- Enums for role, statuses, categories, strategies, property types.
- Index columns used in search filters (postcode, region, category, strategy, status, price).
- Seed script creates: 1 admin, 1 approved agency, 1 pending agency, 1 buyer, and ~10 sample listings across strategies.

## 14. Frontend conventions (web)

- App Router, Server Components by default; Client Components only where needed.
- shadcn/ui + Tailwind. Accessible, responsive, clean “investor-grade” UI.
- Forms: React Hook Form + Zod resolver; the multi-step listing form drives sections from a config object keyed by category/strategy.
- Data fetching via the shared `api-client` + TanStack Query.

## 15. Mobile conventions (Expo)

- Expo Router, NativeWind, React Query, shared `api-client` + Zod schemas.
- V1 mobile minimum: auth, browse/search, listing detail, favourites, messaging. Listing creation can be web-first if time-constrained — confirm before deferring.
- Secure token storage (expo-secure-store).

## 16. Testing requirements (Definition of Done)

A feature is done only when:
- `pnpm typecheck`, `pnpm lint`, `pnpm test` all pass.
- Financial calc functions have unit tests (normal/zero/edge).
- API endpoints have integration tests (happy path + auth/permission failure).
- Critical web flows have Playwright e2e: register, agency approval, create listing, search, send message.
- New code does not reduce overall coverage meaningfully.

## 17. Security

- argon2 password hashing; JWT access (short TTL) + rotating refresh; httpOnly secure cookies on web.
- Role + ownership guards on every endpoint. Validate all input with Zod.
- Rate-limit auth + messaging. Sanitize/escape user-generated content. Signed, expiring URLs for media. No secrets in the repo.

## 18. Coding standards

- TypeScript strict everywhere; no `any`. Prettier + ESLint clean.
- Pure functions for domain logic; thin controllers; service layer for business rules.
- Conventional Commits. Keep PRs/changes focused.
- Do not introduce payment/commission code (see §2).

## 19. When unsure

If a requirement is ambiguous or a decision would lock in something hard to reverse (schema, auth model, money representation), pause and ask a focused question before proceeding.

---

## Imported rules

The following rule files are always in effect (auto-imported):

- @.claude/rules/code-style.md
- @.claude/rules/frontend.md
