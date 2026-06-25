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

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('£3,000')).toBeInTheDocument();
    expect(screen.getByText('£2,700')).toBeInTheDocument();
  });

  it('3 rooms × £1,000 + £1,500 rent-to-landlord → Gross £3,000, Profit £1,200', () => {
    render(
      <HmoRoomCalculator
        rooms={ROOMS_3X1000}
        rentToLandlordPence={1500}
      />,
    );

    expect(screen.getByText('£3,000')).toBeInTheDocument();
    expect(screen.getByText('£1,200')).toBeInTheDocument();
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

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('£500')).toBeInTheDocument();
    expect(screen.getByText('£450')).toBeInTheDocument();
  });

  it('3 rooms × £1,000 + £1,500 landlord + £300 bills + £100 cleaning → Profit £900', () => {
    render(
      <HmoRoomCalculator
        rooms={ROOMS_3X1000}
        rentToLandlordPence={1500}
        billsPence={300}
        cleaningPence={100}
      />,
    );

    // Costs: 1500 + 300 + 100 + 300 (mgmt) = 2200 → Profit = 3000 - 2200 = 800
    expect(screen.getByText('£800')).toBeInTheDocument();
  });
});