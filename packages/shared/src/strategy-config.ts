/**
 * Strategy-driven form configuration for the multi-step "New Property" listing form.
 *
 * Each category owns its strategies. Each strategy owns its section list.
 * Category-level flows (development, refurb, portfolio) have no strategy —
 * they use `categorySections` directly.
 *
 * Sections are resolved via `getSections(category, strategy?)`.
 * Component mapping happens in the consuming app (web/mobile) via a SECTION_COMPONENTS registry.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SectionDef {
  id: string;
  label: string;
  required?: boolean;
}

export interface StrategyConfig {
  strategy: string;
  label: string;
  sections: string[];
}

export interface CategoryConfig {
  category: string;
  label: string;
  /** Sections for category-level flows (no strategy selected, or category-only) */
  categorySections: string[];
  strategies: StrategyConfig[];
}

// ── Section definitions ───────────────────────────────────────────────────────

export const SECTION_DEFS: Record<string, SectionDef> = {
  'base-info': { id: 'base-info', label: 'Property Information', required: true },
  'rent-terms': { id: 'rent-terms', label: 'Commercial Terms' },
  'hmo-rooms': { id: 'hmo-rooms', label: 'Room Configuration', required: true },
  'hmo-outputs': { id: 'hmo-outputs', label: 'HMO Calculations' },
  'sa-revenue': { id: 'sa-revenue', label: 'Revenue Inputs', required: true },
  'sa-costs': { id: 'sa-costs', label: 'Operating Costs', required: true },
  'sa-outputs': { id: 'sa-outputs', label: 'SA Calculations' },
  'lease-base': { id: 'lease-base', label: 'Lease Option Details', required: true },
  'sell-ownership': { id: 'sell-ownership', label: 'Ownership & Legal' },
  'sell-pricing': { id: 'sell-pricing', label: 'Pricing', required: true },
  'sell-cost-to-buy': { id: 'sell-cost-to-buy', label: 'Cost to Buy', required: true },
  'sell-finance': { id: 'sell-finance', label: 'Finance' },
  'sell-add-value': { id: 'sell-add-value', label: 'Add-Value Potential' },
  'dev-opportunity': { id: 'dev-opportunity', label: 'Development' },
  'refurb-opportunity': { id: 'refurb-opportunity', label: 'Refurbishment' },
  'portfolio-assets': { id: 'portfolio-assets', label: 'Portfolio Assets' },
  'agency-network': { id: 'agency-network', label: 'Agency & Network' },
};

// ── Category configuration ────────────────────────────────────────────────────

export const CATEGORY_CONFIG: CategoryConfig[] = [
  // ── Rent to Rent ──
  {
    category: 'RENT_TO_RENT',
    label: 'Rent to Rent',
    categorySections: [],
    strategies: [
      {
        strategy: 'HMO',
        label: 'HMO (House in Multiple Occupation)',
        sections: ['base-info', 'rent-terms', 'hmo-rooms', 'hmo-outputs', 'agency-network'],
      },
      {
        strategy: 'SA',
        label: 'Serviced Accommodation',
        sections: ['base-info', 'rent-terms', 'sa-revenue', 'sa-costs', 'sa-outputs', 'agency-network'],
      },
      {
        strategy: 'SINGLE_LET',
        label: 'Single Let / Buy to Let',
        sections: ['base-info', 'rent-terms', 'agency-network'],
      },
    ],
  },

  // ── Lease Option ──
  {
    category: 'LEASE_OPTION',
    label: 'Lease Option',
    categorySections: [],
    strategies: [
      {
        strategy: 'BMV',
        label: 'Below Market Value',
        sections: ['base-info', 'lease-base', 'agency-network'],
      },
      {
        strategy: 'HMO',
        label: 'HMO',
        sections: ['base-info', 'lease-base', 'agency-network'],
      },
      {
        strategy: 'HIGH_ROI',
        label: 'High ROI Investment',
        sections: ['base-info', 'lease-base', 'agency-network'],
      },
      {
        strategy: 'CASH_PURCHASE',
        label: 'Cash Purchase',
        sections: ['base-info', 'lease-base', 'agency-network'],
      },
    ],
  },

  // ── Sell Property ──
  {
    category: 'SELL_PROPERTY',
    label: 'Sell Property',
    categorySections: [],
    strategies: [
      {
        strategy: 'SINGLE_LET',
        label: 'Single Let / Buy to Let',
        sections: [
          'base-info',
          'sell-ownership',
          'sell-pricing',
          'sell-cost-to-buy',
          'sell-finance',
          'sell-add-value',
          'agency-network',
        ],
      },
      {
        strategy: 'HMO',
        label: 'HMO (sell-to-HMO crossover)',
        sections: [
          'base-info',
          'sell-ownership',
          'sell-pricing',
          'sell-cost-to-buy',
          'sell-finance',
          'sell-add-value',
          'hmo-rooms',
          'hmo-outputs',
          'agency-network',
        ],
      },
      {
        strategy: 'HIGH_ROI',
        label: 'High ROI Investment',
        sections: [
          'base-info',
          'sell-ownership',
          'sell-pricing',
          'sell-cost-to-buy',
          'sell-finance',
          'sell-add-value',
          'agency-network',
        ],
      },
      {
        strategy: 'FLAT_CONVERSION',
        label: 'Flat Conversion',
        sections: ['base-info', 'sell-ownership', 'sell-pricing', 'sell-cost-to-buy', 'sell-finance', 'sell-add-value', 'agency-network'],
      },
      {
        strategy: 'ADD_BEDROOM',
        label: 'Add Bedroom',
        sections: ['base-info', 'sell-ownership', 'sell-pricing', 'sell-cost-to-buy', 'sell-finance', 'sell-add-value', 'agency-network'],
      },
      {
        strategy: 'EXTENSION',
        label: 'Extension',
        sections: ['base-info', 'sell-ownership', 'sell-pricing', 'sell-cost-to-buy', 'sell-finance', 'sell-add-value', 'agency-network'],
      },
      {
        strategy: 'LOFT_CONVERSION',
        label: 'Loft / Roof Conversion',
        sections: ['base-info', 'sell-ownership', 'sell-pricing', 'sell-cost-to-buy', 'sell-finance', 'sell-add-value', 'agency-network'],
      },
    ],
  },

  // ── Development Opportunity (category-level, no strategy) ──
  {
    category: 'DEVELOPMENT_OPPORTUNITY',
    label: 'Development Opportunity',
    categorySections: ['base-info', 'dev-opportunity', 'sell-ownership', 'sell-cost-to-buy', 'agency-network'],
    strategies: [],
  },

  // ── Refurb Opportunity (category-level, no strategy) ──
  {
    category: 'REFURB_OPPORTUNITY',
    label: 'Refurbishment Opportunity',
    categorySections: ['base-info', 'refurb-opportunity', 'sell-pricing', 'sell-cost-to-buy', 'agency-network'],
    strategies: [],
  },

  // ── Portfolio (category-level, no strategy) ──
  {
    category: 'PORTFOLIO',
    label: 'Portfolio of Properties',
    categorySections: ['base-info', 'portfolio-assets', 'agency-network'],
    strategies: [],
  },

  // ── Commercial (V1 scaffold — no strategy or sections wired yet) ──
  {
    category: 'COMMERCIAL',
    label: 'Commercial',
    categorySections: [],
    strategies: [],
  },
];

// ── Lookup helpers ────────────────────────────────────────────────────────────

/**
 * Resolve section IDs for a given (category, strategy) pair.
 *
 * - If strategy is provided and matches a known entry → return strategy's sections.
 * - If strategy is null/undefined → return category's categorySections (category-level flow).
 * - Unknown category → sensible default.
 */
export function getSections(category: string, strategy?: string | null): string[] {
  const cat = CATEGORY_CONFIG.find((c) => c.category === category);
  if (!cat) return ['base-info', 'agency-network'];

  if (strategy) {
    const strat = cat.strategies.find((s) => s.strategy === strategy);
    if (strat) return strat.sections;
  }

  return cat.categorySections;
}

/**
 * Check whether a given category is a category-level flow (no strategy required).
 */
export function isCategoryLevel(category: string): boolean {
  const cat = CATEGORY_CONFIG.find((c) => c.category === category);
  return cat ? cat.strategies.length === 0 : false;
}