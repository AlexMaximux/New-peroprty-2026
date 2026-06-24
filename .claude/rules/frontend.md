# Frontend Rules (PropVest — Web & Mobile)

Applies to `apps/web` (Next.js) and `apps/mobile` (Expo). The `code-reviewer` agent enforces these.

## Shared
- English-only UI (no i18n/RTL in V1). Clean, modern, “investor-grade” look.
- Data fetching via the shared `packages/api-client` + **TanStack Query**. No ad-hoc `fetch` scattered in components.
- Forms via **React Hook Form + Zod resolver**, using the shared Zod schemas. Show inline validation errors.
- Currency rendered from pence with a single shared `formatGBP()` helper. Never do currency math in components — call the shared calc functions.
- Loading, empty, and error states for every async view. Optimistic updates only with rollback.
- Accessibility: semantic elements, labels tied to inputs, keyboard navigable, sufficient contrast.

## Web (Next.js, App Router)
- Server Components by default; add `"use client"` only when interactivity/state is needed.
- Tailwind CSS + **shadcn/ui** for primitives. No inline style objects for themeable values; use tokens/utilities.
- Keep secrets server-side; only `NEXT_PUBLIC_*` is exposed to the browser (e.g. the referrer-restricted Maps key).
- The multi-step **New Property** form is driven by a single config object keyed by category/strategy — do not hand-fork per-strategy form components.
- Co-locate route UI under `app/`; shared components in a `components/` library.

## Mobile (Expo)
- Expo Router for navigation; NativeWind for styling; React Query for data.
- Reuse shared Zod schemas + api-client; never re-declare DTOs.
- Tokens stored in `expo-secure-store`. Maps via the platform Google Maps SDK with the env key.
- V1 mobile screens: auth, browse/search, listing detail, favourites, messaging.

## Components
- Small, composable, typed props (no `any`). Lift state only as far as needed.
- A component does one thing; extract hooks for reusable logic (`useListingSearch`, `useConversation`).