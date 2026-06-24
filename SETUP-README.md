# PropVest — Claude Code config bundle

This bundle contains the full `.claude/` configuration plus the Claude Code prompt and the functional spec. Drop it into the **root of an empty project folder**, then open Claude Code from that folder.

## Where each file goes

```
<project-root>/
├── .claude/
│   ├── settings.json            # shared project settings (committed)
│   ├── settings.local.json      # machine-local settings (git-ignored)
│   ├── CLAUDE.md                # main project instructions
│   ├── agents/                  # project subagents
│   │   ├── code-reviewer.md
│   │   ├── test-engineer.md
│   │   ├── prisma-db.md
│   │   └── security-auditor.md
│   ├── commands/                # custom slash commands
│   │   ├── check.md         → /check
│   │   ├── e2e.md           → /e2e
│   │   ├── migrate.md       → /migrate
│   │   ├── seed.md          → /seed
│   │   ├── review.md        → /review
│   │   ├── new-strategy.md  → /new-strategy
│   │   └── commit.md        → /commit
│   ├── skills/                  # reusable skills
│   │   ├── financial-calculations/SKILL.md
│   │   └── listing-strategy/SKILL.md
│   └── rules/
│       ├── code-style.md
│       └── frontend.md
├── CLAUDE.local.md              # private memory (git-ignored)
├── .mcp.json                    # project MCP servers (postgres, filesystem, playwright, github)
├── .gitignore
├── docs/
│   └── new-property-functional-spec.md
└── CLAUDE-CODE-PROMPT.md        # paste the part below the line into Claude Code
```

Also copy `.claude/CLAUDE.md` from this bundle... and remember the **global** file:
- Put the separately delivered global file at `~/.claude/CLAUDE.md` (your personal, all-projects preferences).

## First steps
1. Unzip this bundle into your empty project folder.
2. Get a **Google Maps API key** (enable Places + Geocoding + Maps JavaScript) and fill it into the `.env` files described in `CLAUDE.local.md`.
3. Fill `DATABASE_URL` and JWT secrets in `apps/api/.env` (see `CLAUDE.local.md`).
4. Open Claude Code in the folder and paste the prompt from `CLAUDE-CODE-PROMPT.md`.

## Notes on the config
- **Rules** (`code-style.md`, `frontend.md`) are imported by `.claude/CLAUDE.md` via `@.claude/rules/...` so they always load.
- **settings.json** pre-approves safe dev commands (pnpm/prisma/playwright/git read+commit) and blocks reading `.env*`, `rm -rf`, and `git push --force`. Pushing asks for confirmation.
- **.mcp.json** reads secrets from environment variables (`DATABASE_URL`, `GITHUB_PERSONAL_ACCESS_TOKEN`) — never hard-code them.
- **Scope guard everywhere:** no commission/payments in V1; AirDNA + Property Data are mocked; Google Maps is real; English-only UI.
