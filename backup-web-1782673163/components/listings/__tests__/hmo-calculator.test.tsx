import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HmoRoomCalculator } from '../new-listing-form';

const ROOMS_3X1000 = [
  { name: 'Room 1', roomType: 'DOUBLE_EN_SUITE' as const, monthlyRentPence: 1000 },
  { name: 'Room 2', roomType: 'DOUBLE_SHARED' as const, monthlyRentPence: 1000 },
  { name: 'Room 3', roomType: 'SINGLE_SHARED' as const, monthlyRentPence: 1000 },
];

describe('HmoRoomCalculator component', () => {
  it('3 rooms × £1,000, no costs → Gross £3,000, Profit £2,700', () => {
    render(<HmoRoomCalculator rooms={ROOMS_3X1000} />);

    expect(screen.getAllByText('3')).toHaveLength(1);
    // Money values appear in summary header + cost breakdown (×2)
    expect(screen.getAllByText('£3,000')).toHaveLength(2);
    expect(screen.getAllByText('£2,700')).toHaveLength(2);
  });

  it('3 rooms × £1,000 + £1,500 rent-to-landlord → Gross £3,000, Profit £1,200', () => {
    render(
      <HmoRoomCalculator
        rooms={ROOMS_3X1000}
        rentToLandlordPence={1500}
      />,
    );

    expect(screen.getAllByText('£3,000')).toHaveLength(2);
    expect(screen.getAllByText('£1,200')).toHaveLength(2);
  });

  it('empty rooms → null (nothing rendered)', () => {
    const { container } = render(<HmoRoomCalculator rooms={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('1 room × £500 → Gross £500, Profit £450 (10% mgmt)', () => {
    render(
      <HmoRoomCalculator
        rooms={[
          { name: 'Single', roomType: 'DOUBLE_EN_SUITE' as const, monthlyRentPence: 500 },
        ]}
      />,
    );

    expect(screen.getAllByText('1')).toHaveLength(1);
    // £500 appears in summary header + once in breakdown
    expect(screen.getAllByText('£500')).toHaveLength(2);
    expect(screen.getAllByText('£450')).toHaveLength(2);
  });

  it('3 rooms × £1,000 + £1,500 landlord + £300 bills + £100 cleaning → Profit £800', () => {
    render(
      <HmoRoomCalculator
        rooms={ROOMS_3X1000}
        rentToLandlordPence={1500}
        billsPence={300}
        cleaningPence={100}
      />,
    );

    // Costs: 1500 + 300 + 100 + 300 (mgmt) = 2200 → Profit = 3000 - 2200 = 800
    expect(screen.getAllByText('£800')).toHaveLength(2);
  });

  // ── Configurable operating costs: management toggle + bills ──

  it('management OFF + 3×£1k + £1.5k landlord → Profit £1,500', () => {
    render(
      <HmoRoomCalculator
        rooms={ROOMS_3X1000}
        rentToLandlordPence={1500}
        managementEnabled={false}
      />,
    );

    // £1,500 (rent) in breakdown + profit (appears twice: summary + breakdown)
    expect(screen.getAllByText('£1,500')).toHaveLength(3);
    // (OFF) is nested inside a single span with other text
    expect(screen.getByText((c) => c.includes('(OFF)'))).toBeInTheDocument();
  });

  it('management ON 10% + 3×£1k + £1.5k landlord → Profit £1,200', () => {
    render(
      <HmoRoomCalculator
        rooms={ROOMS_3X1000}
        rentToLandlordPence={1500}
        managementEnabled={true}
        managementRatePercent={10}
      />,
    );

    // Profit £1,200 appears twice: summary header + breakdown footer
    expect(screen.getAllByText('£1,200')).toHaveLength(2);
    // (10%) is nested inside a single span with other text
    expect(screen.getByText((c) => c.includes('(10%)'))).toBeInTheDocument();
  });

  it('management ON 10% + £200 bills + 3×£1k + £1.5k landlord → Profit £1,000', () => {
    render(
      <HmoRoomCalculator
        rooms={ROOMS_3X1000}
        rentToLandlordPence={1500}
        billsPence={200}
        managementEnabled={true}
        managementRatePercent={10}
      />,
    );

    // Profit £1,000 appears twice: summary header + breakdown footer
    // £200 appears once in breakdown (bills line)
    // £1,500 appears once in breakdown (rent line)
    expect(screen.getAllByText('£1,000')).toHaveLength(2);
    expect(screen.getAllByText('£200')).toHaveLength(1);
    expect(screen.getAllByText('£1,500')).toHaveLength(1);
    // (10%) is nested inside a single span with other text
    expect(screen.getByText((c) => c.includes('(10%)'))).toBeInTheDocument();
  });
});