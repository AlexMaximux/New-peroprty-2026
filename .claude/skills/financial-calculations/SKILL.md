---
name: financial-calculations
description: Use when implementing, changing, or testing PropVest investment math — HMO income, SA occupancy/revenue, mortgage, ROI/yield, deposits, costs, break-even. Ensures formulas match the spec and live in packages/shared with tests.
---

# Financial Calculations Skill

All investment math for PropVest lives as **pure functions in `packages/shared/src/finance`** and is imported by api, web, and mobile. Never duplicate a formula in an app. All money is integer **pence**; round only at display.

## Canonical formulas (from spec §9)

- **HMO gross monthly income** = sum of every room `monthlyRentPence`.
- **HMO money needed in / potential profit** = from documented cost inputs (rent to landlord, deposit, refurb, fees).
- **SA potential monthly income** = `occupancyRate × nightlyRatePence × 30`.
- **SA potential yearly income** = `occupancyRate × nightlyRatePence × 365`.
- **SA break-even occupancy** = `totalMonthlyCostsPence / (nightlyRatePence × 30)` (clamp 0–1).
- **SA potential profit** = potential income − total operating costs (rent, bills, booking fee, maintenance default 5%, management, cleaning, other).
- **Monthly mortgage cost** = `(totalPricePence × ltv × annualInterestRate) / 12`, with `ltv` defaulting to **0.75**.
- **Management fee** = `managementRate × rent`, `managementRate` defaulting to **0.10**.
- **Default deposit assumption** = **0.25** (parameterised).
- **Total cost to buy** = deposit + stamp duty + finder fees + legal fees + other acquisition costs.
- **ROI / gross yield** helpers for display and search banding.

## Rules

1. Parameterise assumptions (LTV, management rate, deposit %, maintenance %) with the spec defaults — never hard-code magic numbers inline.
2. Inputs and outputs in pence (integers); occupancy/rates as decimals (0–1). Document units in JSDoc.
3. Every function gets unit tests covering **normal, zero, and edge** cases (zero occupancy, zero rooms, 100% occupancy, zero interest).
4. The web/mobile inline calculators and the summary panel call these functions — they must not re-implement math.
5. If a formula in the spec is ambiguous, ask before guessing; keep the chosen interpretation documented in a JSDoc comment.

## Workflow when adding/altering a formula
1. Write/adjust the pure function in `packages/shared/src/finance` with typed, documented params.
2. Add/extend unit tests; run them.
3. Wire it into the relevant strategy form section and summary.
4. Run `pnpm typecheck && pnpm lint && pnpm test`.