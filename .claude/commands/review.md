---
description: Review the current changes with the code-reviewer and security-auditor agents.
allowed-tools: Bash, Read, Grep, Glob
---

Review the current uncommitted changes for PropVest.

1. Show `git diff` (and `git status`) to scope what changed.
2. Invoke the `code-reviewer` agent on the changed files.
3. If the change touches auth, authorization, uploads, or messaging, also invoke the `security-auditor` agent.
4. Summarize findings grouped as Blocker / Should-fix / Nit, and propose concrete fixes.

Reminder: flag any commission/payment code — it is out of scope for V1.