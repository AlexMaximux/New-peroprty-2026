---
description: Create and apply a Prisma migration after a schema change.
allowed-tools: Bash, Read, Edit
argument-hint: "<migration_name>"
---

Apply a Prisma migration for PropVest. Delegate to the `prisma-db` agent if a schema redesign is involved.

1. Review the current diff in `apps/api/prisma/schema.prisma`.
2. Run `pnpm --filter api exec prisma migrate dev --name $ARGUMENTS`.
3. Run `pnpm --filter api exec prisma generate`.
4. Confirm money columns are pence, enums are used, and search-filter columns are indexed.
5. Run `pnpm db:seed` to verify the seed still works.

Report the migration file created and any follow-ups.