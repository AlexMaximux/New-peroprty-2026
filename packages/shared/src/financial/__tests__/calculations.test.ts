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
  calcMonthlyMortgageCost,
  calcManagementFee,
  calcDeposit,
  calcTotalCostToBuy,
  calcRoi,
  calcHmoYear1AnnualProfit,
} from '../calculations';
import type { HmoRoomInput, UpfrontCostParams, HmoMonthlyOperatingCostParams, BuyCostParams } from '../calculations';

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

  it('throws on negative return', () => {
    expect(() => calcRoi(1000, -1)).toThrow('non-negative');
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

  it('throws on negative ongoing annual', () => {
    expect(() => calcHmoYear1AnnualProfit(-1, 0)).toThrow('non-negative');
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