---
description: Run the full quality gate (typecheck + lint + tests) and fix failures.
allowed-tools: Bash, Read, Edit, Grep, Glob
---

Run the PropVest quality gate and make it green:

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm test`

If anything fails, diagnose the root cause and fix it (code or test, whichever is wrong), then re-run until all three pass. Report a short summary of what failed and what you changed. Do not weaken assertions or disable rules just to pass.