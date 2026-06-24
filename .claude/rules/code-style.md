# Code Style Rules (PropVest)

Applies to all packages. The `code-reviewer` agent enforces these.

## TypeScript
- `strict: true` everywhere. No `any`; use `unknown` + narrowing. No unchecked `as` casts.
- Prefer `type` aliases for data shapes; `interface` for extendable contracts. Be consistent within a file.
- Exhaustive `switch` on enums/unions with a `never` default guard.
- No default exports for modules with multiple exports; prefer named exports.

## Structure & boundaries
- Domain enums, Zod schemas, DTO types, and **financial calc functions live in `packages/shared`** — never duplicated in apps.
- NestJS: thin controllers, business logic in services, data access via Prisma repositories/services. One responsibility per provider.
- Pure functions for domain logic; isolate side effects (I/O, network, DB) at the edges.
- No circular dependencies between packages.

## Validation & data
- Validate every external boundary (HTTP body/query/params, env, form input) with Zod. Parse, don’t assume.
- Money is integer **pence**; never floats for currency. Round only at display time.
- Dates in UTC (ISO-8601) at rest; format at the edge.

## Errors
- No silent `catch {}`. Handle, wrap with context, or rethrow.
- API errors use the standard shape `{ statusCode, message, code, details? }`.
- Fail fast on invalid config at startup (validated env module).

## Naming & formatting
- `camelCase` variables/functions, `PascalCase` types/components/classes, `SCREAMING_SNAKE_CASE` constants.
- Money fields end in `Pence`. Booleans read as predicates (`isVerified`, `hasGarden`).
- Prettier + ESLint must pass with zero warnings before a change is considered done.

## Commits & changes
- Conventional Commits. Small, focused, reviewable changes.
- Every feature ships with tests. `pnpm typecheck && pnpm lint && pnpm test` must be green.

## Scope guard
- Do NOT add commission, payments, billing, or Stripe in V1. Keep the model extensible, build no payment flow.