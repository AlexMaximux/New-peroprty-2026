# PropVault Marketplace Landing Page Design Spec

This document details the design and implementation specifications for the new authenticated Marketplace landing page for the PropVault Investment Platform. It is styled in accordance with the **Emerald Institutional Dark** design system.

## 1. Design System & Colors (globals.css)

We will define the **Emerald Institutional Dark** palette (default) and the **Emerald Institutional Light** palette in the global CSS. These will be mapped to CSS variables for easy theme switching.

### Color Tokens

| Token Name | Dark Value (Default) | Light Value | Usage |
| :--- | :--- | :--- | :--- |
| `--background` | `#10141a` | `#f8fafc` | Main application background |
| `--surface-lowest` | `#0a0e14` | `#ffffff` | Underlays, deep background layers |
| `--surface-low` | `#181c22` | `#f1f5f9` | Cards background, sidebar background |
| `--surface` | `#1c2026` | `#e2e8f0` | Modals, panels |
| `--surface-high` | `#262a31` | `#cbd5e1` | Selected states, interactive surfaces |
| `--surface-highest`| `#31353c` | `#94a3b8` | Borders, secondary highlights |
| `--on-surface` | `#dfe2eb` | `#0f172a` | Primary text |
| `--on-surface-variant`| `#bbcbbb`| `#475569` | Secondary / muted text |
| `--outline` | `#869486` | `#64748b` | Standard borders |
| `--outline-variant` | `#3d4a3e` | `#cbd5e1` | Subtle/decorative borders |
| `--primary` | `#54e98a` | `#006d37` | Mint Emerald (Success states, primary CTAs, main metrics) |
| `--primary-container`| `#2ecc71`| `#2ecc71`| Secondary success container |
| `--secondary` | `#92ccff` | `#004b73` | Atmospheric Blue (Interactive highlights, active nav) |
| `--secondary-container`| `#3398db`| `#3398db`| Active navigation background |
| `--tertiary` | `#f7c919` | `#d7ae00` | Muted Amber (High-priority badges, e.g., "Discount") |
| `--error` | `#ffb4ab` | `#ba1a1a` | Error states |
| `--border` | `rgba(255, 255, 255, 0.08)` | `rgba(0, 0, 0, 0.08)` | Low-contrast outlines |

---

## 2. Shell Layout & Navigation

### Navigation Sidebar (`AppSidebar`)
* **Background:** Deep Navy/Black (`var(--background)` / `#10141a`).
* **Border:** 1px solid `var(--border)` on the right edge.
* **Active State:** The active menu item (*Marketplace*) uses the Atmospheric Blue background (`var(--secondary-container)` / `#3398db`) with white text.
* **Role-Based Filtering:** Keeps the existing `navItemsForRole` logic.
* **Theme Toggle:** Fully functional Light Mode / Dark Mode switch in the bottom-left corner using `next-themes`.

### Header / Topbar Removal
* For the `/browse` route, the default `AppTopbar` is hidden. The page content goes all the way to the top of the viewport.

---

## 3. Marketplace Page (`browse/page.tsx`)

The Marketplace page consists of a two-row filter bar followed by a 3-column grid of property cards.

### Filter Bar

#### Row 1: Category Chips & Primary Controls
* **Left:** `FILTERS:` title with a slider/filter icon.
* **Middle:** Horizontal scrollable category chips: `BMV`, `High ROI`, `HMO`, `Block`, `Refurb`, `Commercial`, `Land`, `SA`, `Portfolio`, `Light Refurb`, `Heavy Refurb`. Active chips use a semi-transparent emerald background (`rgba(84, 233, 138, 0.15)`) and emerald text (`#54e98a`).
* **Right:** 
  * A **Show Map** toggle switch (using Radix UI `Switch`).
  * A **SORT** dropdown (using Radix UI `Select`) with these options:
    * `High ROI` (sorts by `grossYield` descending)
    * `Low ROI` (sorts by `grossYield` ascending)
    * `Price: Low to High` (sorts by `askingPricePence` ascending)
    * `Price: High to Low` (sorts by `askingPricePence` descending)
    * `Newest Property` (sorts by date/ID descending)

#### Row 2: Density Results & Detailed Filters
* **Left:** **`X properties found`** (where `X` is highlighted in Mint Emerald `#54e98a`).
* **Right (horizontal row):**
  * **STRATEGY:** Dropdown select (`All Strategies`, `HMO`, `SA`, `Block`, `Refurb`, `Commercial`, `Land`, `Portfolio`).
  * **PRICE:** `Min` and `Max` numeric input fields.
  * **LOCATION:** Text input for `City/Postcode` followed by a distance dropdown (`+5m`, `+10m`, `+20m`).
  * **YIELD:** `Min %` and `Max %` numeric input fields.

---

## 4. Property Card Component (`listing-card.tsx`)

* **Background:** Card surface color (`#111827`).
* **Borders:** 1px solid `rgba(255, 255, 255, 0.08)`.
* **Hover State:** Border opacity increases to `0.2` (no elevation lift).
* **Corner Radius:** 8px (`0.5rem`).

### Card Content Layout
1. **Image Header:**
   * Aspect ratio: `video` (16:9).
   * **Top-Left Badge:** Displays the main strategy: **Rent 2 rent**, **Leased Option**, or **Sell property**.
   * **Top-Right Badge:** High-contrast Mint Emerald badge displaying the readiness status and ROI (e.g., `R2R - HMO READY - 28% ROI` or `LO - LAND READY - 35% ROI`).
   * **Reserved Overlay:** For `RESERVED` listings, a dark `rgba(0,0,0,0.6)` overlay with a centered, rounded coral badge containing the text **RESERVED**.
2. **Details:**
   * **Title:** Bold white text (e.g., `3-Bed Terrace - HMO Opportunity`).
   * **Address:** Muted text with a `MapPin` icon (e.g., `Harehills Lane, Leeds · LS8 4DN`).
3. **Financial Metrics (2x3 Grid):**
   * **Row 1 (Emerald Green Text):**
     * **ROI:** `grossYield` (e.g., `28.0%`).
     * **GROSS YIELD:** Secondary yield metric (e.g., `9.1%`).
     * **NET YIELD:** Net yield (e.g., `7.5%`).
   * **Row 2 (Bold White Text):**
     * **MONTHLY RENT:** e.g., `£1,250`.
     * **SOURCING FEE:** e.g., `£4,000`.
     * **REFURB COST:** e.g., `£42,000`.
4. **Features (2x2 Grid):**
   * Displays 4 key features with icons (e.g., `Planning Permission`, `Fully Furnished`, `Near Transport`, `Management in Place`).
5. **Footer:**
   * **Left:** Agency icon and name (e.g., `PropertySource UK`).
   * **Right:**
     * **VIEW DETAILS** button: Solid Mint Emerald background (`#54e98a`) with dark navy text (`#003919`).
     * **COMPARE** checkbox: A checkbox with the label `COMPARE` next to it.
