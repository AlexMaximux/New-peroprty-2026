---
description: Scaffold a new listing category/strategy end to end across the stack.
allowed-tools: Bash, Read, Edit, Write, Grep, Glob
argument-hint: "<category> / <strategy> (e.g. 'Sell Property / Commercial')"
---

Scaffold a new listing strategy: **$ARGUMENTS**. Follow the existing patterns and the New Property spec (`docs/new-property-functional-spec.md`). Load the `listing-strategy` skill first.

Do all layers, single source of truth in `packages/shared`:
1. Add/extend the Zod schema + TypeScript types for the strategy-specific fields in `packages/shared`.
2. Add any pure financial calc functions it needs in `packages/shared`, WITH unit tests (normal/zero/edge).
3. Extend the Prisma model only if new indexed/filterable columns are required (otherwise use the JSONB strategy data). Generate a migration.
4. Wire the API: validation, create/update endpoints, search filters.
5. Add the dynamic section to the multi-step New Property form (web), driven by the strategy config object, with inline calculators and a summary entry.
6. Add it to search filters and the listing detail view.
7. Add tests (unit + API integration) and run `pnpm typecheck && pnpm lint && pnpm test`.

Show the schema and form-config changes before wiring the UI.