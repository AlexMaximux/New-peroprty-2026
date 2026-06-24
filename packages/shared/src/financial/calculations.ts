/**
 * Financial calculation functions for PropVest.
 *
 * All monetary values in **integer pence**. All money outputs `Math.round()` to whole pence.
 * Percentages as decimals (0.65 = 65%). ROI and break-even as decimals.
 *
 * Formulas quoted from `docs/new-property-functional-spec.md` § denoted in each JSDoc.
 */

// ── Shared input types ────────────────────────────────────────────────────────

export interface HmoRoomInput {
  monthlyRentPence: number;
}

export interface UpfrontCostParams {
  depositPence: number;
  finderFeePence: number;
  legalFeesPence: number;
  refurbCostPence?: number;
  otherCostsPence?: number;
}

export interface HmoMonthlyOperatingCostParams {
  rentToLandlordPence: number;
  billsPence: number;
  cleaningPence: number;
  /** Gross monthly income from rooms — used to compute management fee */
  grossIncomePence: number;
  /** Management fee as decimal of gross income. Default 0.10 */
  managementFeeRate?: number;
  otherPence?: number;
}

export interface BuyCostParams {
  depositPence: number;
  stampDutyPence: number;
  finderFeesPence: number;
  legalFeesPence: number;
  otherCostsPence?: number;
}

// ── Validation guard ──────────────────────────────────────────────────────────

function assertNonNegative(value: number, label: string): void {
  if (value < 0) {
    throw new Error(`${label} must be non-negative, got ${value}`);
  }
}

function assertNonNegativeParams(params: Record<string, number>, prefix: string): void {
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value < 0) {
      throw new Error(`${prefix}.${key} must be non-negative, got ${value}`);
    }
  }
}

// ── HMO functions ─────────────────────────────────────────────────────────────

/**
 * §4.2 HMO Auto-Generated Outputs:
 * "Potential gross monthly income based on total room rents"
 *
 * Returns sum of all room monthly rents, rounded to whole pence.
 */
export function calcHmoGrossMonthlyIncome(rooms: HmoRoomInput[]): number {
  const total = rooms.reduce((sum, r) => {
    assertNonNegative(r.monthlyRentPence, 'room.monthlyRentPence');
    return sum + r.monthlyRentPence;
  }, 0);
  return Math.round(total);
}

/**
 * §4.2 HMO Auto-Generated Outputs — "Money needed in"
 *
 * Upfront capital required: deposit + finder fee + legal fees + refurb + other.
 */
export function calcHmoMoneyNeededIn(params: UpfrontCostParams): number {
  assertNonNegativeParams(
    {
      depositPence: params.depositPence,
      finderFeePence: params.finderFeePence,
      legalFeesPence: params.legalFeesPence,
      refurbCostPence: params.refurbCostPence ?? 0,
      otherCostsPence: params.otherCostsPence ?? 0,
    },
    'UpfrontCostParams',
  );
  return Math.round(
    params.depositPence +
      params.finderFeePence +
      params.legalFeesPence +
      (params.refurbCostPence ?? 0) +
      (params.otherCostsPence ?? 0),
  );
}

/**
 * §4.2 HMO Auto-Generated Outputs — "Potential profit" (monthly)
 *
 * Monthly profit = gross monthly income − monthly operating costs.
 * Delegate management fee computation to calcManagementFee.
 */
export function calcHmoMonthlyOperatingCosts(params: HmoMonthlyOperatingCostParams): number {
  assertNonNegativeParams(
    {
      rentToLandlordPence: params.rentToLandlordPence,
      billsPence: params.billsPence,
      cleaningPence: params.cleaningPence,
      grossIncomePence: params.grossIncomePence,
      otherPence: params.otherPence ?? 0,
    },
    'HmoMonthlyOperatingCostParams',
  );

  const managementFeePence = calcManagementFee(params.grossIncomePence, params.managementFeeRate);

  return Math.round(
    params.rentToLandlordPence +
      params.billsPence +
      params.cleaningPence +
      managementFeePence +
      (params.otherPence ?? 0),
  );
}

/**
 * §4.2 HMO Auto-Generated Outputs — "Potential profit" (monthly)
 *
 * Profit = gross monthly income − monthly operating costs.
 */
export function calcHmoMonthlyProfit(grossIncomePence: number, monthlyOperatingCostsPence: number): number {
  assertNonNegative(grossIncomePence, 'grossIncomePence');
  assertNonNegative(monthlyOperatingCostsPence, 'monthlyOperatingCostsPence');
  return Math.round(grossIncomePence - monthlyOperatingCostsPence);
}

// ── SA / Serviced Accommodation functions ─────────────────────────────────────

/**
 * §4.3 SA Auto-Generated Outputs:
 * "Potential monthly income = occupancy × nightly rent × 30"
 */
export function calcSaMonthlyIncome(occupancyRate: number, nightlyRatePence: number): number {
  if (occupancyRate < 0 || occupancyRate > 1) {
    throw new Error(`occupancyRate must be in [0, 1], got ${occupancyRate}`);
  }
  assertNonNegative(nightlyRatePence, 'nightlyRatePence');
  return Math.round(occupancyRate * nightlyRatePence * 30);
}

/**
 * §4.3 SA Auto-Generated Outputs:
 * "Potential yearly income = occupancy × nightly rent × 365"
 */
export function calcSaYearlyIncome(occupancyRate: number, nightlyRatePence: number): number {
  if (occupancyRate < 0 || occupancyRate > 1) {
    throw new Error(`occupancyRate must be in [0, 1], got ${occupancyRate}`);
  }
  assertNonNegative(nightlyRatePence, 'nightlyRatePence');
  return Math.round(occupancyRate * nightlyRatePence * 365);
}

/**
 * §4.3 SA Auto-Generated Outputs:
 * "Minimum occupancy required to break even"
 *
 * breakEvenOccupancy = totalMonthlyCosts / (nightlyRate × 30)
 * Returns decimal (0.65 = 65%). Use in display: "need 65% occupancy to break even".
 * NOT rounded — consumers format as percentage.
 */
export function calcSaBreakEvenOccupancy(totalMonthlyCostsPence: number, nightlyRatePence: number): number {
  assertNonNegative(totalMonthlyCostsPence, 'totalMonthlyCostsPence');
  assertNonNegative(nightlyRatePence, 'nightlyRatePence');
  if (nightlyRatePence === 0) {
    return totalMonthlyCostsPence === 0 ? 0 : Infinity;
  }
  return totalMonthlyCostsPence / (nightlyRatePence * 30);
}

/**
 * §4.3 SA Auto-Generated Outputs:
 * "Potential profit" = income − total costs
 */
export function calcSaProfit(incomePence: number, totalCostsPence: number): number {
  assertNonNegative(incomePence, 'incomePence');
  assertNonNegative(totalCostsPence, 'totalCostsPence');
  return Math.round(incomePence - totalCostsPence);
}

// ── Common financial helpers ──────────────────────────────────────────────────

/**
 * §6.5 Finance Inputs and Calculations:
 * "Monthly mortgage cost = (total price × 0.75) × interest rate / 12"
 *
 * Per the spec formula: interest-only calculation (no amortization).
 * LTV parameter defaults to 0.75 (75%).
 */
export function calcMonthlyMortgageCost(
  totalPricePence: number,
  annualInterestRate: number,
  ltv: number = 0.75,
): number {
  assertNonNegative(totalPricePence, 'totalPricePence');
  if (annualInterestRate < 0) {
    throw new Error(`annualInterestRate must be non-negative, got ${annualInterestRate}`);
  }
  if (ltv < 0 || ltv > 1) {
    throw new Error(`ltv must be in [0, 1], got ${ltv}`);
  }
  return Math.round((totalPricePence * ltv * annualInterestRate) / 12);
}

/**
 * §6.5 Finance Inputs and Calculations:
 * "Management fee = 10% of rent"
 *
 * Rate parameter defaults to 0.10.
 */
export function calcManagementFee(rentPence: number, rate: number = 0.10): number {
  assertNonNegative(rentPence, 'rentPence');
  if (rate < 0 || rate > 1) {
    throw new Error(`rate must be in [0, 1], got ${rate}`);
  }
  return Math.round(rentPence * rate);
}

/**
 * §6.4 Cost to Buy:
 * "Default deposit assumption example: 25%"
 *
 * Deposit = price × depositRate. Rate defaults to 0.25.
 */
export function calcDeposit(pricePence: number, depositRate: number = 0.25): number {
  assertNonNegative(pricePence, 'pricePence');
  if (depositRate < 0 || depositRate > 1) {
    throw new Error(`depositRate must be in [0, 1], got ${depositRate}`);
  }
  return Math.round(pricePence * depositRate);
}

/**
 * §6.4 Cost to Buy + §9.5 Calculated Fields:
 * "Total cost to buy = deposit + stamp duty + finder fees + legal fees + other"
 *
 * All values in pence. Returns sum rounded to whole pence.
 */
export function calcTotalCostToBuy(params: BuyCostParams): number {
  assertNonNegativeParams(
    {
      depositPence: params.depositPence,
      stampDutyPence: params.stampDutyPence,
      finderFeesPence: params.finderFeesPence,
      legalFeesPence: params.legalFeesPence,
      otherCostsPence: params.otherCostsPence ?? 0,
    },
    'BuyCostParams',
  );
  return Math.round(
    params.depositPence +
      params.stampDutyPence +
      params.finderFeesPence +
      params.legalFeesPence +
      (params.otherCostsPence ?? 0),
  );
}

/**
 * §9.5 Calculated Fields:
 * ROI = annualReturn / investment
 *
 * Returns decimal (0.12 = 12%). Display layer formats as percentage.
 * NOT rounded — callers control display precision.
 */
export function calcRoi(investmentPence: number, annualReturnPence: number): number {
  assertNonNegative(investmentPence, 'investmentPence');
  assertNonNegative(annualReturnPence, 'annualReturnPence');
  if (investmentPence === 0) {
    return annualReturnPence === 0 ? 0 : Infinity;
  }
  return annualReturnPence / investmentPence;
}