// ── Wizard path identifiers ────────────────────────────────────────────────

/** All known wizard paths — test asserts every one maps to a non-empty section list. */
export const ALL_WIZARD_PATHS: WizardPath[] = [
  // Rent to Rent
  { category: 'RENT_TO_RENT', strategy: 'HMO' },
  { category: 'RENT_TO_RENT', strategy: 'SA' },
  { category: 'RENT_TO_RENT', strategy: 'BLOCK_OF_PROPERTY' },
  // Sell Property
  { category: 'SELL_PROPERTY', strategy: 'SINGLE_LET' },
  { category: 'SELL_PROPERTY', strategy: 'HMO' },
  { category: 'SELL_PROPERTY', strategy: 'HIGH_ROI' },
  { category: 'SELL_PROPERTY', strategy: 'CASH_PURCHASE' },
  { category: 'SELL_PROPERTY', strategy: 'FLAT_CONVERSION' },
  { category: 'SELL_PROPERTY', strategy: 'ADD_BEDROOM' },
  { category: 'SELL_PROPERTY', strategy: 'EXTENSION' },
  { category: 'SELL_PROPERTY', strategy: 'LOFT_CONVERSION' },
  // Category-level flows (no strategy)
  { category: 'DEVELOPMENT_OPPORTUNITY', strategy: null },
  { category: 'REFURB_OPPORTUNITY', strategy: null },
  { category: 'PORTFOLIO', strategy: null },
  // Commercial strategies
  { category: 'COMMERCIAL', strategy: 'HOTEL' },
  { category: 'COMMERCIAL', strategy: 'SHOP' },
  { category: 'COMMERCIAL', strategy: 'MIXED_USE' },
];

export type WizardPath =
  // Rent to Rent
  | { category: 'RENT_TO_RENT'; strategy: 'HMO' }
  | { category: 'RENT_TO_RENT'; strategy: 'SA' }
  | { category: 'RENT_TO_RENT'; strategy: 'BLOCK_OF_PROPERTY' }
  // Sell Property
  | { category: 'SELL_PROPERTY'; strategy: 'SINGLE_LET' }
  | { category: 'SELL_PROPERTY'; strategy: 'HMO' }
  | { category: 'SELL_PROPERTY'; strategy: 'HIGH_ROI' }
  | { category: 'SELL_PROPERTY'; strategy: 'CASH_PURCHASE' }
  | { category: 'SELL_PROPERTY'; strategy: 'FLAT_CONVERSION' }
  | { category: 'SELL_PROPERTY'; strategy: 'ADD_BEDROOM' }
  | { category: 'SELL_PROPERTY'; strategy: 'EXTENSION' }
  | { category: 'SELL_PROPERTY'; strategy: 'LOFT_CONVERSION' }
  // Category-level flows
  | { category: 'DEVELOPMENT_OPPORTUNITY'; strategy: null }
  | { category: 'REFURB_OPPORTUNITY'; strategy: null }
  | { category: 'PORTFOLIO'; strategy: null }
  // Commercial strategies
  | { category: 'COMMERCIAL'; strategy: 'HOTEL' }
  | { category: 'COMMERCIAL'; strategy: 'SHOP' }
  | { category: 'COMMERCIAL'; strategy: 'MIXED_USE' };

// ── Section IDs ────────────────────────────────────────────────────────────

export type SectionId =
  // R2R sections (existing)
  | 'r2r-address'
  | 'hmo-details'
  | 'rent-term'
  | 'hmo-rooms-income'
  | 'sa-details'
  | 'sa-income'
  | 'block-unit-mix'
  | 'block-per-unit'
  | 'agency-details'
  | 'media'
  | 'hmo-summary'
  | 'sa-summary'
  | 'block-summary'
  // Sell Property sections
  | 'sell-ownership'
  | 'sell-pricing'
  | 'sell-cost-to-buy'
  | 'sell-finance'
  | 'sell-add-value'
  | 'sell-summary'
  // Category-level flows
  | 'dev-opportunity'
  | 'refurb-opportunity'
  | 'portfolio-assets'
  // Commercial stubs
  | 'commercial-hotel'
  | 'commercial-shop'
  | 'commercial-mixed';

// ── Step types ─────────────────────────────────────────────────────────────

export type WizardStep =
  | { kind: 'category-select' }
  | { kind: 'strategy-select' }
  | { kind: 'section'; sectionId: SectionId }
  | { kind: 'summary' };

// ── Wizard state ───────────────────────────────────────────────────────────

export interface WizardState {
  path: WizardPath | null;
  currentStepIndex: number;
  steps: WizardStep[];
  sectionData: Partial<Record<SectionId, unknown>>;
  isSubmitting: boolean;
  error: string | null;
}

// ── Section config: maps each (category, strategy) to section order ─────────

export const PATH_SECTIONS: Record<string, SectionId[]> = {
  // ── Rent to Rent ──
  RENT_TO_RENT_HMO: [
    'r2r-address',
    'hmo-details',
    'rent-term',
    'hmo-rooms-income',
    'agency-details',
    'media',
    'hmo-summary',
  ],
  RENT_TO_RENT_SA: [
    'r2r-address',
    'sa-details',
    'rent-term',
    'sa-income',
    'agency-details',
    'media',
    'sa-summary',
  ],
  RENT_TO_RENT_BLOCK_OF_PROPERTY: [
    'r2r-address',
    'block-unit-mix',
    'block-per-unit',
    'agency-details',
    'media',
    'block-summary',
  ],

  // ── Sell Property (all strategies share the same sections) ──
  SELL_PROPERTY_SINGLE_LET: [
    'r2r-address',
    'sell-ownership',
    'sell-pricing',
    'sell-cost-to-buy',
    'sell-finance',
    'sell-add-value',
    'agency-details',
    'media',
    'sell-summary',
  ],
  SELL_PROPERTY_HMO: [
    'r2r-address',
    'sell-ownership',
    'sell-pricing',
    'sell-cost-to-buy',
    'sell-finance',
    'sell-add-value',
    'agency-details',
    'media',
    'sell-summary',
  ],
  SELL_PROPERTY_HIGH_ROI: [
    'r2r-address',
    'sell-ownership',
    'sell-pricing',
    'sell-cost-to-buy',
    'sell-finance',
    'sell-add-value',
    'agency-details',
    'media',
    'sell-summary',
  ],
  SELL_PROPERTY_CASH_PURCHASE: [
    'r2r-address',
    'sell-ownership',
    'sell-pricing',
    'sell-cost-to-buy',
    'sell-finance',
    'sell-add-value',
    'agency-details',
    'media',
    'sell-summary',
  ],
  SELL_PROPERTY_FLAT_CONVERSION: [
    'r2r-address',
    'sell-ownership',
    'sell-pricing',
    'sell-cost-to-buy',
    'sell-finance',
    'sell-add-value',
    'agency-details',
    'media',
    'sell-summary',
  ],
  SELL_PROPERTY_ADD_BEDROOM: [
    'r2r-address',
    'sell-ownership',
    'sell-pricing',
    'sell-cost-to-buy',
    'sell-finance',
    'sell-add-value',
    'agency-details',
    'media',
    'sell-summary',
  ],
  SELL_PROPERTY_EXTENSION: [
    'r2r-address',
    'sell-ownership',
    'sell-pricing',
    'sell-cost-to-buy',
    'sell-finance',
    'sell-add-value',
    'agency-details',
    'media',
    'sell-summary',
  ],
  SELL_PROPERTY_LOFT_CONVERSION: [
    'r2r-address',
    'sell-ownership',
    'sell-pricing',
    'sell-cost-to-buy',
    'sell-finance',
    'sell-add-value',
    'agency-details',
    'media',
    'sell-summary',
  ],
  // ── Category-level flows ──
  DEVELOPMENT_OPPORTUNITY_NO_STRATEGY: [
    'r2r-address',
    'dev-opportunity',
    'sell-cost-to-buy',
    'agency-details',
    'media',
  ],
  REFURB_OPPORTUNITY_NO_STRATEGY: [
    'r2r-address',
    'refurb-opportunity',
    'sell-pricing',
    'sell-cost-to-buy',
    'agency-details',
    'media',
  ],
  PORTFOLIO_NO_STRATEGY: [
    'r2r-address',
    'portfolio-assets',
    'agency-details',
    'media',
  ],
  // ── Commercial strategies ──
  COMMERCIAL_HOTEL: [
    'r2r-address',
    'commercial-hotel',
    'agency-details',
    'media',
  ],
  COMMERCIAL_SHOP: [
    'r2r-address',
    'commercial-shop',
    'agency-details',
    'media',
  ],
  COMMERCIAL_MIXED_USE: [
    'r2r-address',
    'commercial-mixed',
    'agency-details',
    'media',
  ],
};

export function pathKey(path: WizardPath): string {
  return `${path.category}_${path.strategy ?? 'NO_STRATEGY'}`;
}

export function getSectionIds(path: WizardPath): SectionId[] {
  return PATH_SECTIONS[pathKey(path)] ?? [];
}

/** Build step list from path */
export function buildSteps(path: WizardPath | null): WizardStep[] {
  if (!path) return [{ kind: 'category-select' }, { kind: 'strategy-select' }];

  const sections = getSectionIds(path);
  const isCategoryLevel = path.strategy === null;
  const steps: WizardStep[] = [{ kind: 'category-select' }];
  if (!isCategoryLevel) steps.push({ kind: 'strategy-select' });
  for (const s of sections) {
    steps.push({ kind: 'section', sectionId: s });
  }
  return steps;
}

// ── Reducer ────────────────────────────────────────────────────────────────

export type WizardAction =
  | { type: 'SELECT_PATH'; path: WizardPath }
  | { type: 'SET_SECTION_DATA'; sectionId: SectionId; data: unknown }
  | { type: 'GO_TO_STEP'; index: number }
  | { type: 'SET_SUBMITTING'; value: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' };

export function createInitialWizardState(): WizardState {
  return {
    path: null,
    currentStepIndex: 0,
    steps: [{ kind: 'category-select' }],
    sectionData: {},
    isSubmitting: false,
    error: null,
  };
}

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SELECT_PATH': {
      const key = pathKey(action.path);
      const sections = PATH_SECTIONS[key];
      if (!sections && process.env.NODE_ENV === 'development') {
        console.error(`[Wizard] No PATH_SECTIONS entry for key "${key}". Check types.ts PATH_SECTIONS.`);
      }
      return {
        ...state,
        path: action.path,
        steps: buildSteps(action.path),
        currentStepIndex: sections?.length === 0 ? 1 : 2, // skip to first section if none, otherwise to after strategy-select
        sectionData: {},
        error: null,
      };
    }
    case 'SET_SECTION_DATA':
      return {
        ...state,
        sectionData: { ...state.sectionData, [action.sectionId]: action.data },
      };
    case 'GO_TO_STEP':
      return {
        ...state,
        currentStepIndex: Math.max(0, Math.min(action.index, state.steps.length - 1)),
      };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.value };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'RESET':
      return createInitialWizardState();
    default:
      return state;
  }
}