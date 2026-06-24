---
description: Run Playwright end-to-end tests for the web app.
allowed-tools: Bash, Read, Edit
argument-hint: "[optional test name or file]"
---

Run the web e2e suite: `pnpm test:e2e $ARGUMENTS`.

Critical flows that must pass: register, agency document upload + admin approval, create listing via the multi-step New Property form, search/filter listings, send a message. If a flow is missing, add it. Fix any failures and re-run until green; report results.