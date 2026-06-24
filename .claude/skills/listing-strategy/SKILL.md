---
name: listing-strategy
description: Use when adding or modifying a listing category, investment strategy, or the dynamic New Property form sections in PropVest. Keeps the modular form, schemas, API, and search in sync across the stack.
---

# Listing Strategy Skill

PropVest’s **New Property** form is one shared base form plus dynamic, strategy-specific sections, driven by a single config object. Adding a strategy means touching every layer consistently — with `packages/shared` as the single source of truth.

## Reference
- Normative spec: `docs/new-property-functional-spec.md`.
- Summary + decisions: `.claude/CLAUDE.md` §8–§9.

## Categories
Rent to Rent · Lease Option · Sell Property · Portfolio · Commercial · Development Opportunity · Refurb Opportunity

## Strategies
HMO · SA (Serviced Accommodation) · Single Let / Buy to Let · High ROI Investment · Cash Purchase · Commercial · Mixed Use · Hotel · Shop · Flat Conversion · Add Bedroom · Extension · Loft / Roof Conversion

## Architecture pattern
- **Base property data** (address + Google Maps geocode, classification, media, general details, furnishing, status/readiness) is collected once for all listings.
- **Strategy-specific data** is a typed JSONB blob validated by a per-strategy Zod schema; promote only filterable fields (postcode, region, price, bedrooms, ROI band, refurb required, status) to indexed Prisma columns.
- **Repeatable groups** (HMO rooms, portfolio assets) are separate tables with FK + order.
- The form renders sections from a **config object keyed by category × strategy** — do not fork bespoke form components per strategy.

## Steps to add/extend a strategy
1. **Shared schema:** add the strategy’s Zod schema + types in `packages/shared`; register it in the strategy config map.
2. **Finance:** add any needed calc functions via the `financial-calculations` skill (with tests).
3. **DB:** extend Prisma only for new indexed/filterable columns; otherwise use JSONB. Generate a migration.
4. **API:** validation, create/update endpoints, and search filters for the new fields.
5. **Web form:** add the dynamic section + inline calculators + summary entry, conditionally rendered by category/strategy.
6. **Search & detail:** add filters (including Exclude Sold / Exclude Reserved) and detail rendering.
7. **Tests:** unit (schema + finance) and API integration (incl. auth/permission). Run the full quality gate.

## V1 minimum (must fully work)
Base info · Rent-to-Rent HMO · Rent-to-Rent SA · Sell Property · Lease Option · agency details · financial calcs · media upload. Scaffold the rest with typed schemas.

## Scope guard
No commission/payment fields drive any flow in V1. Keep the model extensible only.