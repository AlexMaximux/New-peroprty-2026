import { describe, it, expect } from 'vitest';
import {
  calcHmoGrossMonthlyIncome,
  calcHmoMoneyNeededIn,
  calcHmoMonthlyOperatingCosts,
  calcHmoMonthlyProfit,
  calcSaMonthlyIncome,
  calcSaYearlyIncome,
  calcSaBreakEvenOccupancy,
  calcSaProfit,
  calcSaTotalCosts,
  calcMonthlyMortgageCost,
  calcManagementFee,
  calcDeposit,
  calcTotalCostToBuy,
  calcRoi,
  calcHmoYear1AnnualProfit,
  calcBillItemsTotal,
  calcHmoSummary,
  calcSaSummary,
  poundsToPence,
  penceToPounds,
  percentToDecimal,
  decimalToPercent,
} from '../calculations';
import type {
  HmoRoomInput,
  UpfrontCostParams,
  HmoMonthlyOperatingCostParams,
  BuyCostParams,
  SaTotalCostsParams,
  BillItemInput,
} from '../calculations';

// ── calcHmoGrossMonthlyIncome ─────────────────────────────────────────────────

describe('calcHmoGrossMonthlyIncome', () => {
  it('sums multiple room rents', () => {
    const rooms: HmoRoomInput[] = [
      { monthlyRentPence: 50000 },
      { monthlyRentPence: 60000 },
      { monthlyRentPence: 45000 },
    ];
    expect(calcHmoGrossMonthlyIncome(rooms)).toBe(155000);
  });

  it('returns 0 for empty array', () => {
    expect(calcHmoGrossMonthlyIncome([])).toBe(0);
  });

  it('returns single room rent unchanged', () => {
    expect(calcHmoGrossMonthlyIncome([{ monthlyRentPence: 75000 }])).toBe(75000);
  });

  it('rounds fractional sum to whole pence (edge: fractional intermediate)', () => {
    // No fractional intermediate with int inputs, but verify round trip
    const rooms: HmoRoomInput[] = [
      { monthlyRentPence: 33333 },
      { monthlyRentPence: 33333 },
      { monthlyRentPence: 33334 },
    ];
    expect(calcHmoGrossMonthlyIncome(rooms)).toBe(100000);
  });

  it('throws on negative rent', () => {
    expect(() => calcHmoGrossMonthlyIncome([{ monthlyRentPence: -100 }])).toThrow('non-negative');
  });
});

// ── calcHmoMoneyNeededIn ──────────────────────────────────────────────────────

describe('calcHmoMoneyNeededIn', () => {
  it('sums all required and optional fields', () => {
    const params: UpfrontCostParams = {
      depositPence: 25000,
      finderFeePence: 5000,
      legalFeesPence: 3000,
      refurbCostPence: 10000,
      otherCostsPence: 2000,
    };
    expect(calcHmoMoneyNeededIn(params)).toBe(45000);
  });

  it('ignores optional fields when omitted', () => {
    const params: UpfrontCostParams = {
      depositPence: 25000,
      finderFeePence: 5000,
      legalFeesPence: 3000,
    };
    expect(calcHmoMoneyNeededIn(params)).toBe(33000);
  });

  it('includes rentToLandlordPence (1 month advance rent) when present', () => {
    const params: UpfrontCostParams = {
      depositPence: 25000,
      finderFeePence: 5000,
      legalFeesPence: 3000,
      rentToLandlordPence: 15000,
    };
    // 25000 + 5000 + 3000 + 15000 = 48000
    expect(calcHmoMoneyNeededIn(params)).toBe(48000);
  });

  it('returns 0 when all inputs are 0', () => {
    expect(calcHmoMoneyNeededIn({ depositPence: 0, finderFeePence: 0, legalFeesPence: 0 })).toBe(0);
  });

  it('rounds fractional result', () => {
    const params: UpfrontCostParams = {
      depositPence: 33333,
      finderFeePence: 33333,
      legalFeesPence: 33334,
    };
    expect(calcHmoMoneyNeededIn(params)).toBe(100000);
  });

  it('throws on negative deposit', () => {
    expect(() => calcHmoMoneyNeededIn({ depositPence: -1, finderFeePence: 0, legalFeesPence: 0 })).toThrow(
      'non-negative',
    );
  });
});

// ── calcHmoMonthlyOperatingCosts ───────────────────────────────────────────────

describe('calcHmoMonthlyOperatingCosts', () => {
  it('sums costs including delegated management fee', () => {
    const params: HmoMonthlyOperatingCostParams = {
      rentToLandlordPence: 150000,
      billsPence: 30000,
      cleaningPence: 10000,
      grossIncomePence: 200000,
      managementFeeRate: 0.10, // → calcManagementFee(200000, 0.10) = 20000
    };
    // 150000 + 30000 + 10000 + 20000 + 0 = 210000
    expect(calcHmoMonthlyOperatingCosts(params)).toBe(210000);
  });

  it('uses default management fee rate of 0.10', () => {
    const params: HmoMonthlyOperatingCostParams = {
      rentToLandlordPence: 100000,
      billsPence: 0,
      cleaningPence: 0,
      grossIncomePence: 100000,
    };
    // Default: 100000 × 0.10 = 10000 management fee
    // Total: 100000 + 10000 = 110000
    expect(calcHmoMonthlyOperatingCosts(params)).toBe(110000);
  });

  it('returns 0 when all inputs are 0', () => {
    const params: HmoMonthlyOperatingCostParams = {
      rentToLandlordPence: 0,
      billsPence: 0,
      cleaningPence: 0,
      grossIncomePence: 0,
    };
    expect(calcHmoMonthlyOperatingCosts(params)).toBe(0);
  });

  it('includes other costs when provided', () => {
    const params: HmoMonthlyOperatingCostParams = {
      rentToLandlordPence: 100000,
      billsPence: 20000,
      cleaningPence: 5000,
      grossIncomePence: 150000,
      managementFeeRate: 0.10,
      otherPence: 15000,
    };
    // 100000 + 20000 + 5000 + 15000 + 15000 = 155000
    expect(calcHmoMonthlyOperatingCosts(params)).toBe(155000);
  });

  it('throws on negative rentToLandlord', () => {
    expect(() =>
      calcHmoMonthlyOperatingCosts({
        rentToLandlordPence: -1,
        billsPence: 0,
        cleaningPence: 0,
        grossIncomePence: 0,
      }),
    ).toThrow('non-negative');
  });
});

// ── calcHmoMonthlyProfit ──────────────────────────────────────────────────────

describe('calcHmoMonthlyProfit', () => {
  it('calculates positive profit', () => {
    expect(calcHmoMonthlyProfit(300000, 210000)).toBe(90000);
  });

  it('returns 0 when income equals costs', () => {
    expect(calcHmoMonthlyProfit(100000, 100000)).toBe(0);
  });

  it('can return negative (loss)', () => {
    expect(calcHmoMonthlyProfit(50000, 100000)).toBe(-50000);
  });

  it('rounds fractional result', () => {
    expect(calcHmoMonthlyProfit(33333, 11111)).toBe(22222);
  });

  it('throws on negative income', () => {
    expect(() => calcHmoMonthlyProfit(-1, 0)).toThrow('non-negative');
  });
});

// ── calcSaMonthlyIncome ───────────────────────────────────────────────────────

describe('calcSaMonthlyIncome', () => {
  it('occupancy × nightlyRate × 30', () => {
    // 0.65 × 10000 × 30 = 195000
    expect(calcSaMonthlyIncome(0.65, 10000)).toBe(195000);
  });

  it('returns 0 at 0% occupancy', () => {
    expect(calcSaMonthlyIncome(0, 10000)).toBe(0);
  });

  it('returns 0 at £0 rate', () => {
    expect(calcSaMonthlyIncome(0.65, 0)).toBe(0);
  });

  it('rounds fractional intermediate (edge)', () => {
    // 0.65 × 97 × 30 = 1891.5 → Math.round = 1892
    expect(calcSaMonthlyIncome(0.65, 97)).toBe(1892);
  });

  it('throws on occupancy > 1', () => {
    expect(() => calcSaMonthlyIncome(1.1, 10000)).toThrow('must be in [0, 1]');
  });

  it('throws on negative nightly rate', () => {
    expect(() => calcSaMonthlyIncome(0.5, -100)).toThrow('non-negative');
  });
});

// ── calcSaYearlyIncome ────────────────────────────────────────────────────────

describe('calcSaYearlyIncome', () => {
  it('occupancy × nightlyRate × 365', () => {
    // 0.65 × 10000 × 365 = 2372500
    expect(calcSaYearlyIncome(0.65, 10000)).toBe(2372500);
  });

  it('returns 0 at 0% occupancy', () => {
    expect(calcSaYearlyIncome(0, 10000)).toBe(0);
  });

  it('rounds fractional intermediate', () => {
    // 0.65 × 97 × 365 = 23013.25 → Math.round = 23013
    expect(calcSaYearlyIncome(0.65, 97)).toBe(23013);
  });

  it('throws on occupancy > 1', () => {
    expect(() => calcSaYearlyIncome(1.1, 10000)).toThrow('must be in [0, 1]');
  });
});

// ── calcSaBreakEvenOccupancy ──────────────────────────────────────────────────

describe('calcSaBreakEvenOccupancy', () => {
  it('totalMonthlyCosts / (nightlyRate × 30)', () => {
    // 200000 / (10000 × 30) = 0.6666...
    const result = calcSaBreakEvenOccupancy(200000, 10000);
    expect(result).toBeCloseTo(0.6667, 3);
  });

  it('returns 0 when costs are 0', () => {
    expect(calcSaBreakEvenOccupancy(0, 10000)).toBe(0);
  });

  it('returns Infinity when nightly rate is 0 and costs > 0', () => {
    expect(calcSaBreakEvenOccupancy(1000, 0)).toBe(Infinity);
  });

  it('returns 0 when both are 0', () => {
    expect(calcSaBreakEvenOccupancy(0, 0)).toBe(0);
  });

  it('not rounded — returns high-precision decimal', () => {
    const result = calcSaBreakEvenOccupancy(100000, 100);
    expect(result).toBe(100000 / (100 * 30));
  });

  it('throws on negative costs', () => {
    expect(() => calcSaBreakEvenOccupancy(-1, 10000)).toThrow('non-negative');
  });
});

// ── calcSaProfit ──────────────────────────────────────────────────────────────

describe('calcSaProfit', () => {
  it('income - costs', () => {
    expect(calcSaProfit(300000, 200000)).toBe(100000);
  });

  it('returns negative for loss', () => {
    expect(calcSaProfit(100000, 300000)).toBe(-200000);
  });

  it('returns 0 when equal', () => {
    expect(calcSaProfit(50000, 50000)).toBe(0);
  });

  it('rounds fractional result', () => {
    expect(calcSaProfit(33333, 11111)).toBe(22222);
  });

  it('throws on negative income', () => {
    expect(() => calcSaProfit(-1, 0)).toThrow('non-negative');
  });
});

// ── calcMonthlyMortgageCost ────────────────────────────────────────────────────

describe('calcMonthlyMortgageCost', () => {
  it('(totalPrice × LTV × rate) / 12 with default LTV', () => {
    // (30000000 × 0.75 × 0.05) / 12 = 93750
    expect(calcMonthlyMortgageCost(30000000, 0.05)).toBe(93750);
  });

  it('accepts custom LTV', () => {
    // (30000000 × 0.80 × 0.05) / 12 = 100000
    expect(calcMonthlyMortgageCost(30000000, 0.05, 0.80)).toBe(100000);
  });

  it('returns 0 when price is 0', () => {
    expect(calcMonthlyMortgageCost(0, 0.05)).toBe(0);
  });

  it('returns 0 at 0% interest', () => {
    expect(calcMonthlyMortgageCost(30000000, 0)).toBe(0);
  });

  it('rounds fractional result (edge)', () => {
    // (300001 × 0.75 × 0.05) / 12 =
    // (225000.75 × 0.05) / 12 =
    // 11250.0375 / 12 = 937.503125 → Math.round = 938
    expect(calcMonthlyMortgageCost(300001, 0.05)).toBe(938);
  });

  it('throws on negative price', () => {
    expect(() => calcMonthlyMortgageCost(-1, 0.05)).toThrow('non-negative');
  });

  it('throws on LTV > 1', () => {
    expect(() => calcMonthlyMortgageCost(100000, 0.05, 1.5)).toThrow('must be in [0, 1]');
  });

  it('throws on negative interest', () => {
    expect(() => calcMonthlyMortgageCost(100000, -0.01)).toThrow('non-negative');
  });
});

// ── calcManagementFee ──────────────────────────────────────────────────────────

describe('calcManagementFee', () => {
  it('rent × 0.10 by default', () => {
    expect(calcManagementFee(200000)).toBe(20000);
  });

  it('accepts custom rate', () => {
    expect(calcManagementFee(200000, 0.08)).toBe(16000);
  });

  it('returns 0 when rent is 0', () => {
    expect(calcManagementFee(0)).toBe(0);
  });

  it('rounds fractional result', () => {
    // 200000 × 0.125 = 25000 (exact)
    expect(calcManagementFee(200000, 0.125)).toBe(25000);
  });

  it('rounds fractional intermediate', () => {
    // 333 × 0.10 = 33.3 → Math.round = 33
    expect(calcManagementFee(333)).toBe(33);
  });

  it('throws on negative rent', () => {
    expect(() => calcManagementFee(-100)).toThrow('non-negative');
  });

  it('throws on rate > 1', () => {
    expect(() => calcManagementFee(100, 1.5)).toThrow('must be in [0, 1]');
  });
});

// ── calcDeposit ────────────────────────────────────────────────────────────────

describe('calcDeposit', () => {
  it('price × 0.25 by default', () => {
    expect(calcDeposit(30000000)).toBe(7500000);
  });

  it('accepts custom deposit rate', () => {
    expect(calcDeposit(30000000, 0.30)).toBe(9000000);
  });

  it('returns 0 when price is 0', () => {
    expect(calcDeposit(0)).toBe(0);
  });

  it('rounds fractional result', () => {
    // 30000000 × 0.075 = 2250000 (exact)
    expect(calcDeposit(30000000, 0.075)).toBe(2250000);
  });

  it('rounds fractional intermediate', () => {
    // 33333 × 0.25 = 8333.25 → Math.round = 8333
    expect(calcDeposit(33333)).toBe(8333);
  });

  it('throws on negative price', () => {
    expect(() => calcDeposit(-1)).toThrow('non-negative');
  });
});

// ── calcTotalCostToBuy ────────────────────────────────────────────────────────

describe('calcTotalCostToBuy', () => {
  it('sums all required fields', () => {
    const params: BuyCostParams = {
      depositPence: 7500000,
      stampDutyPence: 1500000,
      finderFeesPence: 500000,
      legalFeesPence: 300000,
    };
    expect(calcTotalCostToBuy(params)).toBe(9800000);
  });

  it('includes other costs when present', () => {
    const params: BuyCostParams = {
      depositPence: 7500000,
      stampDutyPence: 1500000,
      finderFeesPence: 500000,
      legalFeesPence: 300000,
      otherCostsPence: 100000,
    };
    expect(calcTotalCostToBuy(params)).toBe(9900000);
  });

  it('returns 0 when all inputs are 0', () => {
    expect(calcTotalCostToBuy({ depositPence: 0, stampDutyPence: 0, finderFeesPence: 0, legalFeesPence: 0 })).toBe(0);
  });

  it('rounds fractional sum', () => {
    const params: BuyCostParams = {
      depositPence: 33333,
      stampDutyPence: 33333,
      finderFeesPence: 33334,
      legalFeesPence: 0,
    };
    expect(calcTotalCostToBuy(params)).toBe(100000);
  });

  it('throws on negative deposit', () => {
    expect(() =>
      calcTotalCostToBuy({ depositPence: -1, stampDutyPence: 0, finderFeesPence: 0, legalFeesPence: 0 }),
    ).toThrow('non-negative');
  });
});

// ── calcRoi ────────────────────────────────────────────────────────────────────

describe('calcRoi', () => {
  it('annualReturn / investment as decimal', () => {
    // 2000000 / 30000000 = 0.0666...
    const result = calcRoi(30000000, 2000000);
    expect(result).toBeCloseTo(0.0667, 3);
  });

  it('returns 0 when return is 0', () => {
    expect(calcRoi(30000000, 0)).toBe(0);
  });

  it('handles returns larger than investment', () => {
    expect(calcRoi(10000000, 15000000)).toBe(1.5);
  });

  it('returns Infinity when investment is 0 and return > 0', () => {
    expect(calcRoi(0, 1000)).toBe(Infinity);
  });

  it('returns -Infinity when investment is 0 and return < 0', () => {
    expect(calcRoi(0, -1000)).toBe(-Infinity);
  });

  it('returns 0 when both are 0', () => {
    expect(calcRoi(0, 0)).toBe(0);
  });

  it('not rounded — returns high-precision decimal', () => {
    const result = calcRoi(30000000, 2000000);
    // Expected: 2000000 / 30000000 = 0.0666666...
    expect(result).toBe(2000000 / 30000000);
  });

  it('throws on negative investment', () => {
    expect(() => calcRoi(-1, 1000)).toThrow('non-negative');
  });

  it('returns negative ROI when return is negative', () => {
    expect(calcRoi(1000, -1)).toBe(-0.001);
  });
});

// ── Pounds↔Pence boundary pipeline ─────────────────────────────────────────────
// These tests simulate the full form→calculation pipeline that broke in the
// new-listing form: user enters pounds, form converts to pence, calc functions
// run, display formats back to pounds via formatGBP-like division.
// The bug was: form stored pounds in pence-named fields, calc fns treated as pence.

const poundsToPenceTest = (p: number) => Math.round(p * 100);
const formatGBPSim = (p: number) => (p / 100).toLocaleString('en-GB');

describe('HMO calculator — pounds→pence boundary (form simulation)', () => {
  it('3 rooms × £1,000 each → gross monthly income displays £3,000', () => {
    const roomsInPence = [1000, 1000, 1000].map(poundsToPenceTest);
    const grossPence = calcHmoGrossMonthlyIncome(roomsInPence.map((r) => ({ monthlyRentPence: r })));
    expect(grossPence).toBe(300000); // pence
    expect(grossPence / 100).toBe(3000); // pounds
    expect(formatGBPSim(grossPence)).toBe('3,000');
  });

  it('3 rooms × £1,000 + £1,500 rent-to-landlord → monthly profit displays £1,200', () => {
    const roomsPence = [1000, 1000, 1000].map(poundsToPenceTest);
    const totalRentPence = roomsPence.reduce((s, r) => s + r, 0);
    const opCosts = calcHmoMonthlyOperatingCosts({
      rentToLandlordPence: poundsToPenceTest(1500),
      billsPence: 0,
      cleaningPence: 0,
      grossIncomePence: totalRentPence,
    });
    const profit = calcHmoMonthlyProfit(totalRentPence, opCosts);
    // profit = 300000 - (150000 + 0 + 0 + 30000) = 300000 - 180000 = 120000
    expect(profit).toBe(120000);
    expect(profit / 100).toBe(1200);
    expect(formatGBPSim(profit)).toBe('1,200');
  });

  it('0 rooms → £0 gross, £0 profit', () => {
    const grossPence = calcHmoGrossMonthlyIncome([]);
    expect(grossPence).toBe(0);
  });

  it('1 room × £500, no costs → gross £500, profit £450 (10% mgmt)', () => {
    const roomsPence = [500].map(poundsToPenceTest);
    const grossPence = calcHmoGrossMonthlyIncome(roomsPence.map((r) => ({ monthlyRentPence: r })));
    const totalRentPence = roomsPence.reduce((s, r) => s + r, 0);
    const opCosts = calcHmoMonthlyOperatingCosts({
      rentToLandlordPence: 0,
      billsPence: 0,
      cleaningPence: 0,
      grossIncomePence: totalRentPence,
    });
    const profit = calcHmoMonthlyProfit(totalRentPence, opCosts);
    // profit = 50000 - (0 + 0 + 0 + 5000) = 45000
    expect(grossPence / 100).toBe(500);
    expect(profit).toBe(45000);
    expect(profit / 100).toBe(450);
  });
});

// ── HMO Year-1 annual profit ──────────────────────────────────────────────────

describe('calcHmoYear1AnnualProfit', () => {
  it('ongoing annual − finder fee', () => {
    // £9,000 − £1,000 = £8,000
    expect(calcHmoYear1AnnualProfit(900000, 100000)).toBe(800000);
  });

  it('0 finder fee returns ongoing annual unchanged', () => {
    expect(calcHmoYear1AnnualProfit(500000, 0)).toBe(500000);
  });

  it('finder fee larger than annual profit → negative', () => {
    expect(calcHmoYear1AnnualProfit(50000, 100000)).toBe(-50000);
  });

  it('all zeros', () => {
    expect(calcHmoYear1AnnualProfit(0, 0)).toBe(0);
  });

  it('allows negative ongoing annual (loss scenario)', () => {
    expect(calcHmoYear1AnnualProfit(-1, 0)).toBe(-1);
  });

  it('throws on negative finder fee', () => {
    expect(() => calcHmoYear1AnnualProfit(100, -1)).toThrow('non-negative');
  });
});

// ── HMO full summary scenario (finder amortised, dual ROI) ─────────────────────

describe('HMO full summary scenario (finder amortised, dual ROI)', () => {
  it('gross £2.5k, landlord £1.5k, mgmt 10%, finder £1k, deposit £1.5k → monthly(Y1) £667, Y1 annual £8k, ongoing annual £9k, Y1 ROI 200%, ongoing ROI 225%', () => {
    const toPence = (p: number) => Math.round(p * 100);

    // Inputs in pounds (as user enters in form)
    const depositPounds = 1500;
    const rentToLandlordPounds = 1500;
    const finderPounds = 1000;
    const grossPounds = 2500; // total room rents

    // Convert to pence for calc functions
    const depositPence = toPence(depositPounds);
    const rentToLandlordPence = toPence(rentToLandlordPounds);
    const finderPence = toPence(finderPounds);
    const grossPence = toPence(grossPounds);

    // Monthly operating costs: landlord 150000 + mgmt 25000 = 175000
    const opCosts = calcHmoMonthlyOperatingCosts({
      rentToLandlordPence,
      billsPence: 0,
      cleaningPence: 0,
      grossIncomePence: grossPence,
      managementFeeRate: 0.10,
    });
    expect(opCosts).toBe(175000);

    // Ongoing monthly profit
    const ongoingMonthlyProfit = calcHmoMonthlyProfit(grossPence, opCosts);
    expect(ongoingMonthlyProfit).toBe(75000); // £750

    // Ongoing annual
    const ongoingAnnualProfit = ongoingMonthlyProfit * 12;
    expect(ongoingAnnualProfit).toBe(900000); // £9,000

    // Year-1 annual (finder deducted)
    const year1AnnualProfit = calcHmoYear1AnnualProfit(ongoingAnnualProfit, finderPence);
    expect(year1AnnualProfit).toBe(800000); // £8,000

    // Year-1 monthly (derived from annual to avoid drift)
    const year1MonthlyPence = Math.round(year1AnnualProfit / 12);
    expect(year1MonthlyPence).toBe(66667); // £666.67 → display £667

    // Money needed in: deposit £1,500 + 1mo advance £1,500 + finder £1,000 = £4,000
    const moneyNeededIn = calcHmoMoneyNeededIn({
      depositPence,
      finderFeePence: finderPence,
      legalFeesPence: 0,
      rentToLandlordPence,
    });
    expect(moneyNeededIn / 100).toBe(4000); // £4,000

    // Finder ÷ 12 monthly cost line
    const finderMonthlyPence = Math.round(finderPence / 12);
    expect(finderMonthlyPence).toBe(8333); // £83.33

    // ROIs
    const year1Roi = calcRoi(moneyNeededIn, year1AnnualProfit);
    expect(year1Roi).toBe(2.0); // 200%

    const ongoingRoi = calcRoi(moneyNeededIn, ongoingAnnualProfit);
    expect(ongoingRoi).toBe(2.25); // 225%
  });
});

// ── calcBillItemsTotal ────────────────────────────────────────────────────────

describe('calcBillItemsTotal', () => {
  it('sums multiple bill items in pence', () => {
    const bills: BillItemInput[] = [
      { amountPence: 5000 },
      { amountPence: 3000 },
      { amountPence: 2000 },
    ];
    expect(calcBillItemsTotal(bills)).toBe(10000);
  });

  it('returns 0 for empty array', () => {
    expect(calcBillItemsTotal([])).toBe(0);
  });

  it('rounds fractional total', () => {
    const bills: BillItemInput[] = [
      { amountPence: 3333 },
      { amountPence: 3333 },
      { amountPence: 3334 },
    ];
    expect(calcBillItemsTotal(bills)).toBe(10000);
  });

  it('throws on negative amount', () => {
    expect(() => calcBillItemsTotal([{ amountPence: -100 }])).toThrow('non-negative');
  });
});

// ── calcSaTotalCosts ──────────────────────────────────────────────────────────

describe('calcSaTotalCosts', () => {
  it('sums all cost components including maintenance % of revenue', () => {
    const params: SaTotalCostsParams = {
      rentToLandlordPence: 150000,
      billsTotalPence: 30000,
      bookingFeePence: 20000,
      monthlyRevenuePence: 195000,
      maintenanceRate: 0.05, // → 9750
      managementCostPence: 25000,
      cleaningPence: 15000,
      otherCostsPence: 10000,
    };
    // 150000 + 30000 + 20000 + 9750 + 25000 + 15000 + 10000 = 259750
    expect(calcSaTotalCosts(params)).toBe(259750);
  });

  it('uses default maintenance rate of 0.05 when omitted', () => {
    const params: SaTotalCostsParams = {
      rentToLandlordPence: 100000,
      billsTotalPence: 0,
      bookingFeePence: 0,
      monthlyRevenuePence: 100000,
      managementCostPence: 0,
      cleaningPence: 0,
      otherCostsPence: 0,
    };
    // 100000 + 0 + 0 + 5000 + 0 + 0 + 0 = 105000
    expect(calcSaTotalCosts(params)).toBe(105000);
  });

  it('returns 0 when all inputs are 0', () => {
    expect(calcSaTotalCosts({
      rentToLandlordPence: 0,
      billsTotalPence: 0,
      bookingFeePence: 0,
      monthlyRevenuePence: 0,
      managementCostPence: 0,
      cleaningPence: 0,
      otherCostsPence: 0,
    })).toBe(0);
  });

  it('rounds maintenance fraction to whole pence', () => {
    const params: SaTotalCostsParams = {
      rentToLandlordPence: 100000,
      billsTotalPence: 0,
      bookingFeePence: 0,
      monthlyRevenuePence: 33333,
      maintenanceRate: 0.05, // → 1666.65 → Math.round = 1667
      managementCostPence: 0,
      cleaningPence: 0,
      otherCostsPence: 0,
    };
    expect(calcSaTotalCosts(params)).toBe(101667);
  });

  it('throws on negative rent', () => {
    expect(() => calcSaTotalCosts({
      rentToLandlordPence: -1,
      billsTotalPence: 0,
      bookingFeePence: 0,
      monthlyRevenuePence: 0,
      managementCostPence: 0,
      cleaningPence: 0,
      otherCostsPence: 0,
    })).toThrow('non-negative');
  });

  it('throws on maintenanceRate > 1', () => {
    expect(() => calcSaTotalCosts({
      rentToLandlordPence: 1000,
      billsTotalPence: 0,
      bookingFeePence: 0,
      monthlyRevenuePence: 1000,
      maintenanceRate: 1.5,
      managementCostPence: 0,
      cleaningPence: 0,
      otherCostsPence: 0,
    })).toThrow('must be in [0, 1]');
  });
});

// ── calcHmoSummary (full pipeline aggregator) ─────────────────────────────────

describe('calcHmoSummary', () => {
  it('computes full HMO summary from form inputs in pence', () => {
    const result = calcHmoSummary({
      rooms: [
        { monthlyRentPence: 50000 },
        { monthlyRentPence: 60000 },
        { monthlyRentPence: 45000 },
      ],
      rentToLandlordPence: 80000,
      depositPence: 15000,
      finderFeePence: 10000,
      legalFeesPence: 5000,
      billsPence: 20000,
      cleaningPence: 10000,
      managementEnabled: true,
      managementRatePercent: 10,
    });

    // Gross: £500 + £600 + £450 = £1,550
    expect(result.grossMonthlyIncomePence).toBe(155000);

    // Op costs: 80000 + 20000 + 10000 + 15500 (mgmt 10%) = 125500
    expect(result.operatingCostsPence).toBe(125500);

    // Ongoing monthly profit: 155000 - 125500 = 29500
    expect(result.ongoingMonthlyProfitPence).toBe(29500);

    // Ongoing annual: 29500 * 12 = 354000
    expect(result.ongoingAnnualProfitPence).toBe(354000);

    // Year-1 annual: 354000 - 10000 = 344000
    expect(result.year1AnnualProfitPence).toBe(344000);

    // Year-1 monthly (derived from annual): 344000 / 12 = 28667
    expect(result.year1MonthlyProfitPence).toBe(28667);

    // Money needed: 15000 + 10000 + 5000 + 80000 = 110000
    expect(result.moneyNeededInPence).toBe(110000);

    // Finder amortised: 10000 / 12 = 833
    expect(result.finderMonthlyAmortisedPence).toBe(833);

    // ROIs
    expect(result.year1Roi).toBeCloseTo(3.1273, 3);
    expect(result.ongoingRoi).toBeCloseTo(3.2182, 3);
  });

  it('handles zero rooms (no income)', () => {
    const result = calcHmoSummary({
      rooms: [],
      rentToLandlordPence: 100000,
      depositPence: 50000,
      finderFeePence: 0,
      billsPence: 0,
      cleaningPence: 0,
      managementEnabled: true,
      managementRatePercent: 10,
    });
    expect(result.grossMonthlyIncomePence).toBe(0);
    expect(result.ongoingMonthlyProfitPence).toBe(-100000);
    expect(result.moneyNeededInPence).toBe(150000);
    expect(result.year1Roi).toBe(-8);
    expect(result.ongoingRoi).toBe(-8);
  });

  it('handles management disabled', () => {
    const result = calcHmoSummary({
      rooms: [{ monthlyRentPence: 100000 }],
      rentToLandlordPence: 50000,
      depositPence: 0,
      finderFeePence: 0,
      billsPence: 10000,
      cleaningPence: 5000,
      managementEnabled: false,
      managementRatePercent: 10,
    });
    expect(result.managementFeePence).toBe(0);
    expect(result.operatingCostsPence).toBe(65000); // 50000 + 10000 + 5000 + 0
    expect(result.ongoingMonthlyProfitPence).toBe(35000);
  });

  it('handles finder fee > annual profit (year-1 loss)', () => {
    const result = calcHmoSummary({
      rooms: [{ monthlyRentPence: 100000 }],
      rentToLandlordPence: 80000,
      depositPence: 0,
      finderFeePence: 500000,
      billsPence: 0,
      cleaningPence: 0,
      managementEnabled: false,
      managementRatePercent: 10,
    });
    // Ongoing monthly profit = 100000 - 80000 = 20000
    // Ongoing annual = 240000
    // Year-1 annual = 240000 - 500000 = -260000
    expect(result.ongoingAnnualProfitPence).toBe(240000);
    expect(result.year1AnnualProfitPence).toBe(-260000);
    expect(result.year1Roi).toBeLessThan(0);
  });
});

// ── calcSaSummary (full pipeline aggregator) ─────────────────────────────────

describe('calcSaSummary', () => {
  // £100/night, 65% occupancy → £1,950/mo, £23,725/yr
  // Deposit £2,000, finder £1,000, legal £500, 1mo advance rent £1,200
  const result = calcSaSummary({
    nightlyRatePence: 10000,
    occupancyRate: 0.65,
    rentToLandlordPence: 120000,
    billsTotalPence: 30000,
    bookingFeePence: 20000,
    maintenanceRate: 0.05,
    managementCostPence: 25000,
    cleaningPence: 15000,
    otherCostsPence: 10000,
    depositPence: 200000,
    finderFeePence: 100000,
    legalFeesPence: 50000,
    otherUpfrontPence: 0,
  });

  // Monthly income = 0.65 × 10000 × 30 = 195000
  it('computes monthly income', () => {
    expect(result.monthlyIncomePence).toBe(195000);
  });

  // Yearly income = 0.65 × 10000 × 365 = 2372500
  it('computes yearly income', () => {
    expect(result.yearlyIncomePence).toBe(2372500);
  });

  // Total costs = 120000 + 30000 + 20000 + 9750 (5% of 195000) + 25000 + 15000 + 10000 = 229750
  it('computes total monthly costs including 5% maintenance', () => {
    expect(result.totalMonthlyCostsPence).toBe(229750);
  });

  // Ongoing costs = 120000 + 30000 + 20000 + 9750 (5% of 195000) + 25000 + 15000 + 10000 = 229750
  it('computes ongoing monthly profit (no finder fee)', () => {
    // Profit = 195000 - 229750 = -34750 (ongoing)
    expect(result.ongoingMonthlyProfitPence).toBe(-34750);
  });

  // Ongoing annual = -34750 * 12 = -417000
  it('computes ongoing annual profit', () => {
    expect(result.ongoingAnnualProfitPence).toBe(-417000);
  });

  // Year-1 costs = ongoing 229750 + sourcing 8333 = 238083
  // Year-1 monthly profit = 195000 - 238083 = -43083
  // Year-1 annual = -43083 * 12 = -516996
  it('computes Year-1 profit (finder fee amortised)', () => {
    expect(result.year1MonthlyProfitPence).toBe(-43083);
    expect(result.year1AnnualProfitPence).toBe(-516996);
  });

  // Break-even = 229750 / (10000 × 30) = 0.7658...
  it('computes break-even occupancy', () => {
    expect(result.breakEvenOccupancy).toBeCloseTo(0.7658, 3);
  });

  // Money-in = deposit £2,000 + 1mo advance £1,200 + finder £1,000 + legal £500 = £4,700
  it('computes money needed in', () => {
    expect(result.moneyNeededInPence).toBe(470000);
  });

  // Year-1 ROI = -516996 / 470000 = -1.09999...
  // Ongoing ROI = -417000 / 470000 = -0.8872...
  it('computes ROIs correctly', () => {
    expect(result.year1Roi).toBeCloseTo(-1.1, 1);
    expect(result.ongoingRoi).toBeCloseTo(-0.8872, 3);
  });

  it('computes maintenance pence amount explicitly', () => {
    expect(result.maintenancePence).toBe(9750);
  });

  it('handles zero revenue scenario', () => {
    const r = calcSaSummary({
      nightlyRatePence: 0,
      occupancyRate: 0,
      rentToLandlordPence: 0,
      billsTotalPence: 0,
      bookingFeePence: 0,
      managementCostPence: 0,
      cleaningPence: 0,
      otherCostsPence: 0,
      depositPence: 0,
      finderFeePence: 0,
    });
    expect(r.monthlyIncomePence).toBe(0);
    expect(r.totalMonthlyCostsPence).toBe(0);
    expect(r.ongoingMonthlyProfitPence).toBe(0);
    expect(r.ongoingAnnualProfitPence).toBe(0);
    expect(r.year1MonthlyProfitPence).toBe(0);
    expect(r.year1AnnualProfitPence).toBe(0);
    expect(r.breakEvenOccupancy).toBe(0);
    expect(r.moneyNeededInPence).toBe(0);
  });

  it('handles highly profitable scenario with 0 costs (no finder fee)', () => {
    const r = calcSaSummary({
      nightlyRatePence: 20000,
      occupancyRate: 0.80,
      rentToLandlordPence: 0,
      billsTotalPence: 0,
      bookingFeePence: 0,
      managementCostPence: 0,
      cleaningPence: 0,
      otherCostsPence: 0,
      depositPence: 500000,
      finderFeePence: 0,
    });
    // Income = 0.80 × 20000 × 30 = 480000
    // Maintenance = 0.05 × 480000 = 24000
    expect(r.monthlyIncomePence).toBe(480000);
    expect(r.totalMonthlyCostsPence).toBe(24000);
    expect(r.ongoingMonthlyProfitPence).toBe(456000);
    expect(r.year1MonthlyProfitPence).toBe(456000); // No finder fee, same as ongoing
    expect(r.breakEvenOccupancy).toBe(0.04); // 24000 / (20000 × 30)
    expect(r.moneyNeededInPence).toBe(500000);
    expect(r.ongoingRoi).toBeCloseTo(10.944, 2);
    expect(r.year1Roi).toBeCloseTo(10.944, 2); // No finder fee, same as ongoing
  });

  // ── SA dual-year scenario (finder fee amortised) ───────────────────────────────
  it('SA dual-year: £100/night, 75% occupancy, finder £1.2k, deposit £2k, landlord £1.5k → Year-1 profit lower', () => {
    const r = calcSaSummary({
      nightlyRatePence: 10000,
      occupancyRate: 0.75,
      rentToLandlordPence: 150000,
      billsTotalPence: 30000,
      bookingFeePence: 20000,
      maintenanceRate: 0.05,
      managementCostPence: 20000,
      cleaningPence: 10000,
      otherCostsPence: 5000,
      depositPence: 200000,
      finderFeePence: 120000, // £1,200 finder fee
      legalFeesPence: 0,
    });
    // Income = 0.75 × 10000 × 30 = 225000
    expect(r.monthlyIncomePence).toBe(225000);
    // Ongoing costs = 150000 + 30000 + 20000 + 11250 + 20000 + 10000 + 5000 = 246250
    expect(r.totalMonthlyCostsPence).toBe(246250);
    // Ongoing monthly profit = 225000 - 246250 = -21250 (loss)
    expect(r.ongoingMonthlyProfitPence).toBe(-21250);
    expect(r.ongoingAnnualProfitPence).toBe(-255000);
    // Sourcing per month = 120000 / 12 = 10000
    expect(r.finderMonthlyAmortisedPence).toBe(10000);
    // Year-1 costs = 246250 + 10000 = 256250
    // Year-1 monthly = 225000 - 256250 = -31250
    expect(r.year1MonthlyProfitPence).toBe(-31250);
    expect(r.year1AnnualProfitPence).toBe(-375000);
    // Money-in = 200000 + 150000 + 120000 = 470000
    expect(r.moneyNeededInPence).toBe(470000);
    // ROIs
    expect(r.year1Roi).toBeCloseTo(-0.798, 3); // -375000 / 470000
    expect(r.ongoingRoi).toBeCloseTo(-0.5426, 3); // -255000 / 470000
  });
});

// ── Unit conversion helpers (£↔pence, %↔decimal round-trip) ─────────────

describe('poundsToPence / penceToPounds round-trip', () => {
  it('£150 → 15000 pence', () => { expect(poundsToPence(150)).toBe(15000); });
  it('15000 pence → £150', () => { expect(penceToPounds(15000)).toBe(150); });
  it('£0 → 0 pence', () => { expect(poundsToPence(0)).toBe(0); });
  it('0 pence → £0', () => { expect(penceToPounds(0)).toBe(0); });
  it('null → 0', () => { expect(poundsToPence(null)).toBe(0); expect(penceToPounds(null)).toBe(0); });
  it('undefined → 0', () => { expect(poundsToPence(undefined)).toBe(0); expect(penceToPounds(undefined)).toBe(0); });
  it('£150.50 → 15050 pence (handles decimal)', () => { expect(poundsToPence(150.50)).toBe(15050); });
  it('round-trip: £ -> pence -> £', () => {
    const orig = 150;
    const pence = poundsToPence(orig);
    expect(penceToPounds(pence)).toBe(orig);
  });
});

describe('percentToDecimal / decimalToPercent round-trip', () => {
  it('70% → 0.70', () => { expect(percentToDecimal(70)).toBe(0.70); });
  it('0.70 → 70%', () => { expect(decimalToPercent(0.70)).toBe(70); });
  it('5% → 0.05', () => { expect(percentToDecimal(5)).toBe(0.05); });
  it('0.05 → 5%', () => { expect(decimalToPercent(0.05)).toBe(5); });
  it('0% → 0', () => { expect(percentToDecimal(0)).toBe(0); expect(decimalToPercent(0)).toBe(0); });
  it('100% → 1.0', () => { expect(percentToDecimal(100)).toBe(1.0); });
  it('1.0 → 100%', () => { expect(decimalToPercent(1.0)).toBe(100); });
  it('null → 0', () => { expect(percentToDecimal(null)).toBe(0); expect(decimalToPercent(null)).toBe(0); });
  it('undefined → 0', () => { expect(percentToDecimal(undefined)).toBe(0); expect(decimalToPercent(undefined)).toBe(0); });
  it('round-trip: 70% → decimal → 70%', () => {
    const orig = 70;
    const decimal = percentToDecimal(orig);
    expect(decimalToPercent(decimal)).toBe(orig);
  });
  it('clamps > 100% to 1.0', () => { expect(percentToDecimal(150)).toBe(1.0); });
  it('clamps < 0% to 0', () => { expect(percentToDecimal(-10)).toBe(0); });
});
