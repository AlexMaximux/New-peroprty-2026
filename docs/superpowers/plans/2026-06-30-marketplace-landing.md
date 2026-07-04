# PropVault Marketplace Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the authenticated shell and the Marketplace page to match the "Emerald Institutional Dark" theme, adding a functional Light Mode toggle, custom filter bar, and redesigned property cards.

**Architecture:** We will use Next.js App Router and Tailwind CSS v4. Theme switching is handled via `next-themes` and CSS variables. The top bar is hidden on the marketplace page to allow the content to go all the way to the top.

**Tech Stack:** React 19, Next.js 15, Tailwind CSS v4, Lucide React, Radix UI (`@radix-ui/react-switch`, `@radix-ui/react-select`), `next-themes`.

---

## Proposed Changes

### Task 1: Theme & Colors Setup

**Files:**
* Modify: [globals.css](file:///Users/nersibayat/Desktop/Programing/claude%20code-sand/apps/web/app/globals.css)

**Interfaces:**
* Produces: CSS variables mapping to the *Emerald Institutional Dark* and *Light* palettes.

- [ ] **Step 1: Update globals.css variables**
  Replace the `:root` and `[data-theme="light"]` selectors in `globals.css` with the new color palette.

  ```css
  :root {
    /* Emerald Institutional Dark (Default) */
    --bg-primary: #10141a;
    --bg-secondary: #0a0e14;
    --bg-card: #111827;
    --bg-card-hover: #181c22;
    --border: rgba(255, 255, 255, 0.08);
    --border-accent: rgba(84, 225, 131, 0.3);

    --text-primary: #dfe2eb;
    --text-muted: #bbcbbb;
    --text-faint: #869486;

    --accent: #54e98a;
    --accent-hover: #4ae183;
    --accent-subtle: rgba(84, 233, 138, 0.15);
    --accent-border: rgba(84, 233, 138, 0.3);

    --secondary-color: #92ccff;
    --secondary-container: #3398db;

    --warning: #f7c919;
    --warning-subtle: rgba(247, 201, 25, 0.12);
    --error: #ffb4ab;
    --error-subtle: rgba(255, 180, 171, 0.12);

    --font-ui: 'Inter', sans-serif;
  }

  [data-theme="light"] {
    /* Emerald Institutional Light */
    --bg-primary: #f8fafc;
    --bg-secondary: #ffffff;
    --bg-card: #ffffff;
    --bg-card-hover: #f1f5f9;
    --border: rgba(0, 0, 0, 0.08);
    --border-accent: rgba(0, 109, 55, 0.3);

    --text-primary: #0f172a;
    --text-muted: #475569;
    --text-faint: #64748b;

    --accent: #006d37;
    --accent-hover: #005027;
    --accent-subtle: rgba(0, 109, 55, 0.12);
    --accent-border: rgba(0, 109, 55, 0.3);

    --secondary-color: #004b73;
    --secondary-container: #3398db;

    --warning: #d7ae00;
    --warning-subtle: rgba(215, 174, 0, 0.12);
    --error: #ba1a1a;
    --error-subtle: rgba(186, 26, 26, 0.12);
  }
  ```

- [ ] **Step 2: Commit theme changes**
  Run:
  ```bash
  git add apps/web/app/globals.css
  git commit -m "style: implement Emerald Institutional Dark & Light color variables"
  ```

---

### Task 2: Layout & Sidebar Customization

**Files:**
* Modify: [layout.tsx](file:///Users/nersibayat/Desktop/Programing/claude%20code-sand/apps/web/app/%28app%29/layout.tsx)
* Modify: [app-sidebar.tsx](file:///Users/nersibayat/Desktop/Programing/claude%20code-sand/apps/web/components/layout/app-sidebar.tsx)

- [ ] **Step 1: Modify layout.tsx to conditionally hide AppTopbar**
  Check the pathname; if it is `/browse`, do not render `AppTopbar`.

  ```typescript
  "use client"

  import { usePathname } from "next/navigation"
  import { AppSidebar } from "@/components/layout/app-sidebar"
  import { AppTopbar } from "@/components/layout/app-topbar"

  export default function AppLayout({ children, user }: { children: React.ReactNode, user: any }) {
    const pathname = usePathname()
    const isBrowse = pathname === "/browse"

    return (
      <div className="flex h-svh overflow-hidden bg-[var(--bg-primary)]">
        <AppSidebar user={user} />
        <div className="flex min-w-0 flex-1 flex-col">
          {!isBrowse && <AppTopbar user={user} />}
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 2: Update app-sidebar.tsx with new styling and active themes**
  * Use the theme switcher from `next-themes`.
  * Style active links with `var(--secondary-container)` background.
  * Adjust colors to use `var(--bg-primary)`.

  ```typescript
  "use client"

  import { useTheme } from "next-themes"
  import { Sun, Moon } from "lucide-react"
  // Add theme toggle logic in the footer
  ```

- [ ] **Step 3: Commit layout changes**
  Run:
  ```bash
  git add apps/web/app/\(app\)/layout.tsx apps/web/components/layout/app-sidebar.tsx
  git commit -m "feat: hide topbar on /browse and implement sidebar theme switcher"
  ```

---

### Task 3: Redesign Property Card Component

**Files:**
* Modify: [listing-card.tsx](file:///Users/nersibayat/Desktop/Programing/claude%20code-sand/apps/web/components/marketplace/listing-card.tsx)

- [ ] **Step 1: Implement the redesigned card layout**
  Update `ListingCard` with:
  * Top-left strategy badge (Rent 2 Rent, Lease Option, Sell Property).
  * Top-right green badge with ROI details (e.g. `R2R - HMO READY - 28% ROI`).
  * Center "RESERVED" overlay if status is `RESERVED`.
  * 2x3 metrics grid (ROI, Gross Yield, Net Yield in Row 1; Monthly Rent, Sourcing Fee, Refurb Cost in Row 2).
  * 2x2 features list.
  * Footer with COMPARE checkbox and VIEW DETAILS button.

- [ ] **Step 2: Commit card changes**
  Run:
  ```bash
  git add apps/web/components/marketplace/listing-card.tsx
  git commit -m "feat: redesign ListingCard to match PropVault specification"
  ```

---

### Task 4: Marketplace View & Filtering

**Files:**
* Modify: [marketplace-view.tsx](file:///Users/nersibayat/Desktop/Programing/claude%20code-sand/apps/web/components/marketplace/marketplace-view.tsx)
* Modify: [page.tsx](file:///Users/nersibayat/Desktop/Programing/claude%20code-sand/apps/web/app/%28app%29/browse/page.tsx)

- [ ] **Step 1: Re-enable and implement MarketplaceView**
  Remove the deprecation comment. Implement:
  * Two-row filter bar.
  * Category chips with horizontal scroll.
  * Show Map Switch (Radix).
  * SORT select dropdown (High ROI, Low ROI, Prices Low to High, Prices High to Low, Newest Property).
  * Strategy, Price, Location, Yield controls.
  * Filter/sort state logic.

- [ ] **Step 2: Update browse/page.tsx**
  Ensure it renders `<MarketplaceView />`.

- [ ] **Step 3: Commit marketplace view changes**
  Run:
  ```bash
  git add apps/web/components/marketplace/marketplace-view.tsx apps/web/app/\(app\)/browse/page.tsx
  git commit -m "feat: implement PropVault Marketplace filter bar and listing grid"
  ```

---

## Verification Plan

### Automated Tests
* Run vitest tests: `pnpm --filter @propvest/web test`
* Run playwright e2e tests: `pnpm --filter @propvest/web test:e2e`

### Manual Verification
* Run the dev server: `pnpm dev`
* Navigate to `http://localhost:3000/browse` in the browser.
* Verify:
  1. No topbar is visible.
  2. The sidebar matches the nocturnal `#10141a` style.
  3. Clicking "Light Mode" toggles the page to a clean white theme.
  4. The filter chips, toggles, and sorting options work.
  5. The cards show the exact 2x3 metrics grid, features, badges, and RESERVED overlays.
