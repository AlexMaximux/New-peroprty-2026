/**
 * Financial calculation functions for PropVest.
 *
 * All monetary values in **integer pence**. All money outputs `Math.round()` to whole pence.
 * Percentages as decimals (0.65 = 65%). ROI and break-even as decimals.
 *
 * Formulas quoted from `docs/new-property-functional-spec.md` § denoted in each JSDoc.
 */

// ── Unit conversion helpers (shared — import by form sections) ────────────────
// Rule: forms accept human units (£, 0-100%). Convert at submit boundary only.

/** Convert user-typed pounds to integer pence. null/undefined → 0. */
export function poundsToPence(pounds: number | null | undefined): number {
  if (pounds == null) return 0;
  return Math.round(pounds * 100);
}

/** Convert stored pence to display pounds. null/undefined → 0. */
export function penceToPounds(pence: number | null | undefined): number {
  if (pence == null) return 0;
  return Math.round(pence / 100);
}

/** Convert 0-100 percentage to 0-1 decimal. null/undefined → 0. */
export function percentToDecimal(pct: number | null | undefined): number {
  if (pct == null) return 0;
  return Math.min(1, Math.max(0, pct / 100));
}

/** Convert 0-1 decimal to 0-100 percentage (rounded). null/undefined → 0. */
export function decimalToPercent(decimal: number | null | undefined): number {
  if (decimal == null) return 0;
  return Math.round(decimal * 100);
}

// ── Shared input types ────────────────────────────────────────────────────────

export interface HmoRoomInput {
  monthlyRentPence: number;
}

export interface UpfrontCostParams {
  depositPence: number;
  finderFeePence: number;
  legalFeesPence: number;
  /** One month's rent to landlord — advance rent for rent-to-rent deals */
  rentToLandlordPence?: number;
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
 * Upfront capital required: deposit + one month rent-to-landlord + finder fee + legal fees + refurb + other.
 */
export function calcHmoMoneyNeededIn(params: UpfrontCostParams): number {
  assertNonNegativeParams(
    {
      depositPence: params.depositPence,
      finderFeePence: params.finderFeePence,
      legalFeesPence: params.legalFeesPence,
      refurbCostPence: params.refurbCostPence ?? 0,
      rentToLandlordPence: params.rentToLandlordPence ?? 0,
      otherCostsPence: params.otherCostsPence ?? 0,
    },
    'UpfrontCostParams',
  );
  return Math.round(
    params.depositPence +
      params.finderFeePence +
      params.legalFeesPence +
      (params.rentToLandlordPence ?? 0) +
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

/**
 * Year-1 annual profit = ongoing annual profit − finder fee.
 *
 * Finder fee is a one-off cost deducted from Year 1 only.
 * Use this to derive Year-1 monthly profit for display (divide by 12)
 * so monthly × 12 reconciles exactly to annual with no rounding drift.
 */
export function calcHmoYear1AnnualProfit(
  ongoingAnnualProfitPence: number,
  finderFeePence: number,
): number {
  // ongoingAnnualProfitPence CAN be negative (loss scenario)
  assertNonNegative(finderFeePence, 'finderFeePence');
  return Math.round(ongoingAnnualProfitPence - finderFeePence);
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
  if (annualReturnPence < 0) {
    // Negative return produces negative ROI — valid, display as loss
  } else {
    assertNonNegative(annualReturnPence, 'annualReturnPence');
  }
  if (investmentPence === 0) {
    return annualReturnPence === 0 ? 0 : annualReturnPence > 0 ? Infinity : -Infinity;
  }
  return annualReturnPence / investmentPence;
}

// ── Bill items (shareable helper) ───────────────────────────────────────────

export interface BillItemInput {
  amountPence: number;
}

/**
 * Sum an array of bill-item amounts.
 * Each bill's amount is in pence. Returns total in pence, rounded.
 */
export function calcBillItemsTotal(bills: BillItemInput[]): number {
  return Math.round(bills.reduce((sum, b) => {
    assertNonNegative(b.amountPence, 'bill.amountPence');
    return sum + b.amountPence;
  }, 0));
}

// ── SA total costs (rent term + sa revenue combined) ────────────────────────

export interface SaTotalCostsParams {
  /** Rent to Landlord (from Rent Term section), pence */
  rentToLandlordPence: number;
  /** Bills total from bill items, pence */
  billsTotalPence: number;
  /** Booking fee (from SA Revenue), pence */
  bookingFeePence: number;
  /** Monthly revenue used as base for maintenance %, pence */
  monthlyRevenuePence: number;
  /** Maintenance rate as decimal, default 0.05 */
  maintenanceRate?: number;
  /** Management cost (from Rent Term — management fee or fixed amount), pence */
  managementCostPence: number;
  /** Cleaning cost (from Rent Term), pence */
  cleaningPence: number;
  /** Other costs (from SA Revenue), pence */
  otherCostsPence: number;
}

/**
 * SA total monthly operating costs.
 * Monthly costs = rentToLandlord + bills + bookingFee + maintenance (% of revenue) + management + cleaning + other.
 * All values in pence. Returns rounded to whole pence.
 */
export function calcSaTotalCosts(params: SaTotalCostsParams): number {
  assertNonNegativeParams(
    {
      rentToLandlordPence: params.rentToLandlordPence,
      billsTotalPence: params.billsTotalPence,
      bookingFeePence: params.bookingFeePence,
      monthlyRevenuePence: params.monthlyRevenuePence,
      managementCostPence: params.managementCostPence,
      cleaningPence: params.cleaningPence,
      otherCostsPence: params.otherCostsPence,
    },
    'SaTotalCostsParams',
  );
  const maintenanceRate = params.maintenanceRate ?? 0.05;
  if (maintenanceRate < 0 || maintenanceRate > 1) {
    throw new Error(`maintenanceRate must be in [0, 1], got ${maintenanceRate}`);
  }
  const maintenancePence = Math.round(params.monthlyRevenuePence * maintenanceRate);

  return Math.round(
    params.rentToLandlordPence +
      params.billsTotalPence +
      params.bookingFeePence +
      maintenancePence +
      params.managementCostPence +
      params.cleaningPence +
      params.otherCostsPence,
  );
}

/**
 * SA break-even occupancy = totalMonthlyCosts / (nightlyRate × 30).
 * This is identical to calcSaBreakEvenOccupancy but is kept as a named
 * wrapper for conceptual clarity in the summary engine.
 * Returns decimal (0.65 = 65%). Display layer formats as percentage.
 */
export { calcSaBreakEvenOccupancy as calcSaBreakEvenOccupancyRate };

// ── Full scenario summary builders ──────────────────────────────────────────

export interface HmoSummaryInput {
  rooms: Array<{ monthlyRentPence: number }>;
  rentToLandlordPence: number;
  depositPence: number;
  finderFeePence: number;
  legalFeesPence?: number;
  billsPence: number;
  cleaningPence: number;
  otherUpfrontPence?: number;
  managementEnabled: boolean;
  managementRatePercent: number;
}

export interface HmoSummaryResult {
  grossMonthlyIncomePence: number;
  operatingCostsPence: number;
  ongoingMonthlyProfitPence: number;
  ongoingAnnualProfitPence: number;
  year1AnnualProfitPence: number;
  year1MonthlyProfitPence: number;
  moneyNeededInPence: number;
  year1Roi: number;
  ongoingRoi: number;
  managementFeePence: number;
  finderMonthlyAmortisedPence: number;
}

/**
 * Full HMO summary pipeline.
 *
 * 1. Gross monthly income = sum of room rents.
 * 2. Management fee = managementEnabled ? gross × (rate/100) : 0.
 * 3. Monthly operating costs = rentToLandlord + bills + cleaning + management fee.
 * 4. Ongoing monthly profit = gross − costs.
 * 5. Ongoing annual profit = ongoingMonthly × 12.
 * 6. Year-1 annual profit = ongoing annual − finder fee.
 * 7. Year-1 monthly profit = Year-1 annual ÷ 12 (derived from annual, so
 *    monthly × 12 reconciles exactly to annual — no rounding drift).
 * 8. Money needed in = deposit + 1mo advance rent + finder fee + legal + other.
 * 9. ROIs = annual profits ÷ money-in.
 */
export function calcHmoSummary(input: HmoSummaryInput): HmoSummaryResult {
  const grossMonthlyIncomePence = calcHmoGrossMonthlyIncome(input.rooms);

  const mgmtRate = input.managementEnabled ? input.managementRatePercent / 100 : 0;
  const managementFeePence = calcManagementFee(grossMonthlyIncomePence, mgmtRate);

  const operatingCostsPence = calcHmoMonthlyOperatingCosts({
    rentToLandlordPence: input.rentToLandlordPence,
    billsPence: input.billsPence,
    cleaningPence: input.cleaningPence,
    grossIncomePence: grossMonthlyIncomePence,
    managementFeeRate: mgmtRate,
  });

  const ongoingMonthlyProfitPence = calcHmoMonthlyProfit(grossMonthlyIncomePence, operatingCostsPence);
  const ongoingAnnualProfitPence = Math.round(ongoingMonthlyProfitPence * 12);

  const year1AnnualProfitPence = calcHmoYear1AnnualProfit(ongoingAnnualProfitPence, input.finderFeePence);
  // Derive year-1 monthly from annual to avoid rounding drift
  const year1MonthlyProfitPence = Math.round(year1AnnualProfitPence / 12);

  const moneyNeededInPence = calcHmoMoneyNeededIn({
    depositPence: input.depositPence,
    finderFeePence: input.finderFeePence,
    legalFeesPence: input.legalFeesPence ?? 0,
    rentToLandlordPence: input.rentToLandlordPence,
    otherCostsPence: input.otherUpfrontPence ?? 0,
  });

  const year1Roi = calcRoi(moneyNeededInPence, year1AnnualProfitPence);
  const ongoingRoi = calcRoi(moneyNeededInPence, ongoingAnnualProfitPence);
  const finderMonthlyAmortisedPence = input.finderFeePence > 0
    ? Math.round(input.finderFeePence / 12)
    : 0;

  return {
    grossMonthlyIncomePence,
    operatingCostsPence,
    ongoingMonthlyProfitPence,
    ongoingAnnualProfitPence,
    year1AnnualProfitPence,
    year1MonthlyProfitPence,
    moneyNeededInPence,
    year1Roi,
    ongoingRoi,
    managementFeePence,
    finderMonthlyAmortisedPence,
  };
}

export interface SaSummaryInput {
  nightlyRatePence: number;
  occupancyRate: number;
  rentToLandlordPence: number;
  billsTotalPence: number;
  bookingFeePence: number;
  maintenanceRate?: number;
  managementCostPence: number;
  cleaningPence: number;
  otherCostsPence: number;
  // Money-in fields
  depositPence: number;
  finderFeePence: number;
  legalFeesPence?: number;
  otherUpfrontPence?: number;
}

export interface SaSummaryResult {
  monthlyIncomePence: number;
  yearlyIncomePence: number;
  totalMonthlyCostsPence: number;
  ongoingMonthlyProfitPence: number;
  ongoingAnnualProfitPence: number;
  year1MonthlyProfitPence: number;
  year1AnnualProfitPence: number;
  breakEvenOccupancy: number;
  moneyNeededInPence: number;
  year1Roi: number;
  ongoingRoi: number;
  finderMonthlyAmortisedPence: number;
  maintenancePence: number;
}

/**
 * Full SA summary pipeline.
 *
 * 1. Monthly income = occupancy × nightly rate × 30.
 * 2. Yearly income = occupancy × nightly rate × 365.
 * 3. Ongoing monthly costs = rent + bills + bookingFee + maintenance (% of monthly income)
 *    + management + cleaning + other (NO sourcing/finder fee).
 * 4. Year-1 monthly costs = ongoing costs + sourcingPerMonth (finderFee ÷ 12).
 * 5. Ongoing monthly profit = income − ongoing costs.
 * 6. Year-1 monthly profit = income − Year-1 costs (derived via annual/12).
 * 7. Ongoing annual profit = ongoing monthly × 12.
 * 8. Year-1 annual profit = Year-1 monthly × 12 (no finder fee in ongoing).
 * 9. Break-even occupancy = ongoing costs / (nightly rate × 30).
 * 10. Money needed in = deposit + 1mo advance rent + finder + legal + other.
 * 11. ROIs = annual profits ÷ money-in.
 */
export function calcSaSummary(input: SaSummaryInput): SaSummaryResult {
  const monthlyIncomePence = calcSaMonthlyIncome(input.occupancyRate, input.nightlyRatePence);
  const yearlyIncomePence = calcSaYearlyIncome(input.occupancyRate, input.nightlyRatePence);

  const maintenanceRate = input.maintenanceRate ?? 0.05;
  const maintenancePence = Math.round(monthlyIncomePence * maintenanceRate);

  // Ongoing costs (no finder fee)
  const ongoingMonthlyCostsPence = calcSaTotalCosts({
    rentToLandlordPence: input.rentToLandlordPence,
    billsTotalPence: input.billsTotalPence,
    bookingFeePence: input.bookingFeePence,
    monthlyRevenuePence: monthlyIncomePence,
    maintenanceRate,
    managementCostPence: input.managementCostPence,
    cleaningPence: input.cleaningPence,
    otherCostsPence: input.otherCostsPence,
  });

  // Year-1 costs = ongoing + sourcingPerMonth (finderFee ÷ 12)
  const sourcingPerMonthPence = input.finderFeePence > 0
    ? Math.round(input.finderFeePence / 12)
    : 0;
  const year1MonthlyCostsPence = ongoingMonthlyCostsPence + sourcingPerMonthPence;

  const ongoingMonthlyProfitPence = calcSaProfit(monthlyIncomePence, ongoingMonthlyCostsPence);
  const ongoingAnnualProfitPence = Math.round(ongoingMonthlyProfitPence * 12);

  // Year-1 monthly derived from Year-1 costs to avoid rounding drift
  const year1MonthlyProfitPence = calcSaProfit(monthlyIncomePence, year1MonthlyCostsPence);
  const year1AnnualProfitPence = Math.round(year1MonthlyProfitPence * 12);

  const breakEvenOccupancy = calcSaBreakEvenOccupancy(ongoingMonthlyCostsPence, input.nightlyRatePence);

  const moneyNeededInPence = calcHmoMoneyNeededIn({
    depositPence: input.depositPence,
    finderFeePence: input.finderFeePence,
    legalFeesPence: input.legalFeesPence ?? 0,
    rentToLandlordPence: input.rentToLandlordPence,
    otherCostsPence: input.otherUpfrontPence ?? 0,
  });

  const year1Roi = calcRoi(moneyNeededInPence, year1AnnualProfitPence);
  const ongoingRoi = calcRoi(moneyNeededInPence, ongoingAnnualProfitPence);

  const finderMonthlyAmortisedPence = sourcingPerMonthPence;

  return {
    monthlyIncomePence,
    yearlyIncomePence,
    totalMonthlyCostsPence: ongoingMonthlyCostsPence,
    ongoingMonthlyProfitPence,
    ongoingAnnualProfitPence,
    year1MonthlyProfitPence,
    year1AnnualProfitPence,
    breakEvenOccupancy,
    moneyNeededInPence,
    year1Roi,
    ongoingRoi,
    finderMonthlyAmortisedPence,
    maintenancePence,
  };
}