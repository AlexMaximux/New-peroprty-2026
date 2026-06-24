---
description: Stage and create a Conventional Commit for the current changes.
allowed-tools: Bash
argument-hint: "[optional message]"
---

Create a clean commit for PropVest:

1. `git status` and `git diff` to review.
2. Confirm no secrets, `.env*`, or `CLAUDE.local.md` are staged.
3. Stage the relevant files and commit using **Conventional Commits** (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`). Use $ARGUMENTS as the message if provided, otherwise write a concise, accurate message describing the change.

Do NOT push. Pushing requires explicit approval.