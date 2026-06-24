---
description: Reset and reseed the local database with sample data.
allowed-tools: Bash, Read
---

Reseed the PropVest dev database:

1. Ensure Postgres is up (`docker compose up -d`).
2. `pnpm db:migrate` then `pnpm db:seed`.

The seed must create: 1 admin, 1 approved agency, 1 pending agency, 1 buyer, and ~10 sample listings spanning Rent-to-Rent HMO, Rent-to-Rent SA, Sell Property, and Lease Option. Use the accounts defined in `CLAUDE.local.md`. Report what was created.