import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== PropVest Demo Seed ===\n');

  // ── Clean existing data ──
  await prisma.adminAuditLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.favourite.deleteMany();
  await prisma.portfolioAsset.deleteMany();
  await prisma.hmoRoom.deleteMany();
  await prisma.listingMedia.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.agencyDocument.deleteMany();
  await prisma.agencyProfile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const PASSWORD = 'Passw0rd!';
  const passwordHash = await argon2.hash(PASSWORD);

  // ══════════════════════════════════════════════════
  //  USERS
  // ══════════════════════════════════════════════════

  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.test',
      passwordHash,
      role: 'ADMIN',
      displayName: 'Admin User',
    },
  });

  const agency1User = await prisma.user.create({
    data: {
      email: 'agency1@demo.test',
      passwordHash,
      role: 'AGENCY',
      displayName: 'Prime Properties London',
    },
  });

  const agency2User = await prisma.user.create({
    data: {
      email: 'agency2@demo.test',
      passwordHash,
      role: 'AGENCY',
      displayName: 'Northern Property Group',
    },
  });

  const pendingAgencyUser = await prisma.user.create({
    data: {
      email: 'pending@demo.test',
      passwordHash,
      role: 'AGENCY',
      displayName: 'New Horizons Property',
    },
  });

  const buyer1 = await prisma.user.create({
    data: {
      email: 'buyer1@demo.test',
      passwordHash,
      role: 'USER',
      displayName: 'Alice Investor',
    },
  });

  const buyer2 = await prisma.user.create({
    data: {
      email: 'buyer2@demo.test',
      passwordHash,
      role: 'USER',
      displayName: 'Bob Buyer',
    },
  });

  const buyer3 = await prisma.user.create({
    data: {
      email: 'buyer3@demo.test',
      passwordHash,
      role: 'USER',
      displayName: 'Charlie Dealmaker',
    },
  });

  void buyer3; // referenced as seed user (no direct interaction data needed)
  console.log('Users created.');

  // ══════════════════════════════════════════════════
  //  AGENCY PROFILES
  // ══════════════════════════════════════════════════

  const agency1 = await prisma.agencyProfile.create({
    data: {
      userId: agency1User.id,
      companyName: 'Prime Properties London Ltd',
      companyNumber: '12345678',
      address: '1 Oxford Street, London, W1D 1AA',
      contactName: 'Sarah Johnson',
      phone: '020 7123 4567',
      website: 'https://primeproperties.example.com',
      verificationStatus: 'APPROVED',
      reviewedByAdminId: admin.id,
      reviewedAt: new Date(),
    },
  });

  const agency2 = await prisma.agencyProfile.create({
    data: {
      userId: agency2User.id,
      companyName: 'Northern Property Group Ltd',
      companyNumber: '87654321',
      address: '100 Deansgate, Manchester, M3 2BQ',
      contactName: 'David Thompson',
      phone: '0161 555 1234',
      website: 'https://northernproperty.example.com',
      verificationStatus: 'APPROVED',
      reviewedByAdminId: admin.id,
      reviewedAt: new Date(),
    },
  });

  // Pending agency with documents
  const pendingAgency = await prisma.agencyProfile.create({
    data: {
      userId: pendingAgencyUser.id,
      companyName: 'New Horizons Property',
      companyNumber: '55667788',
      address: '45 Deansgate, Manchester, M3 2AB',
      contactName: 'James Wilson',
      phone: '0161 234 5678',
      verificationStatus: 'PENDING',
    },
  });

  // Upload docs for pending agency
  await prisma.agencyDocument.createMany({
    data: [
      {
        agencyProfileId: pendingAgency.id,
        type: 'COMPANY_REGISTRATION',
        fileKey: 'demo/pending/company-cert.pdf',
        originalName: 'certificate-of-incorporation.pdf',
      },
      {
        agencyProfileId: pendingAgency.id,
        type: 'ID',
        fileKey: 'demo/pending/james-passport.pdf',
        originalName: 'passport-scan.pdf',
      },
      {
        agencyProfileId: pendingAgency.id,
        type: 'PROOF_OF_ADDRESS',
        fileKey: 'demo/pending/utility-bill.pdf',
        originalName: 'utility-bill-march-2025.pdf',
      },
    ],
  });

  console.log('Agency profiles created.');

  // ══════════════════════════════════════════════════
  //  LISTING HELPERS
  // ══════════════════════════════════════════════════

  // Helper to create a listing
  async function createListing(data: any) {
    return prisma.listing.create({ data });
  }

  // ══════════════════════════════════════════════════
  //  AGENCY 1 — Prime Properties London (South)
  // ══════════════════════════════════════════════════

  // ── L1: HMO Rent-to-Rent (Published) ──
  const l1 = await createListing({
    agencyProfileId: agency1.id,
    category: 'RENT_TO_RENT',
    strategy: 'HMO',
    status: 'PUBLISHED',
    title: '7-Bed HMO in Whitechapel, E1',
    description:
      'Fully licensed 7-bed HMO with existing tenancies in prime East London location. All rooms let to young professionals. Gross monthly rent of £7,000 with strong tenant demand. Close to step 5 Whitechapel station and Brick Lane amenities. Requires minimal management oversight.',
    propertyType: 'TERRACED',
    addressLine1: '22 Brick Lane',
    city: 'London',
    postcode: 'E1 6RU',
    region: 'Greater London',
    nation: 'ENGLAND',
    regionGroup: 'SOUTH',
    latitude: 51.5194,
    longitude: -0.0723,
    bedrooms: 7,
    bathrooms: 3,
    floorArea: 2200,
    hasLivingRoom: true,
    hasGarden: false,
    parking: 'No',
    isLicensed: true,
    isVacant: false,
    isTenanted: true,
    needsRefurb: false,
    askingPricePence: 650_000_00,
    marketValuePence: 700_000_00,
    estimatedRoi: 12.9,
    publishedAt: new Date('2025-01-15'),
    strategySpecificData: {
      rentTerm: 5,
      rentToLandlordPence: 3500_00_00,
      depositPence: 5000_00,
      contractLength: 60,
      reviewPeriod: 12,
      referenceRequirement: 'FULL',
      managementAvailable: true,
      finderFeePence: 5000_00,
      grossMonthlyIncome: 7000_00_00,
      moneyNeededIn: 45000_00_00,
      potentialProfit: 3500_00_00,
      agencyName: 'Prime Properties London',
      notes: 'Tenants on periodic tenancies, all current',
      billsIncluded: false,
    },
  });

  const roomTypes: ('DOUBLE_EN_SUITE' | 'DOUBLE_SHARED' | 'SINGLE_SHARED')[] = [
    'DOUBLE_EN_SUITE', 'DOUBLE_SHARED', 'SINGLE_SHARED',
  ];
  for (let i = 1; i <= 7; i++) {
    await prisma.hmoRoom.create({
      data: {
        listingId: l1.id,
        name: `Room ${i}`,
        roomType: roomTypes[i % 3]!,
        monthlyRentPence: i === 1 ? 1200_00 : 1000_00,
      },
    });
  }

  // ── L2: Serviced Accommodation (Published) ──
  const l2 = await createListing({
    agencyProfileId: agency1.id,
    category: 'RENT_TO_RENT',
    strategy: 'SA',
    status: 'PUBLISHED',
    title: 'Luxury 3-Bed SA in Canary Wharf, E14',
    description:
      'High-end serviced accommodation in prestigious West India Quay. Stunning views of the Thames, minutes from Canary Wharf financial district. Perfect for corporate bookings and business travellers. Fully furnished to 5-star standard with all mod cons.',
    propertyType: 'FLAT',
    addressLine1: '15 West India Quay',
    city: 'London',
    postcode: 'E14 4EQ',
    region: 'Greater London',
    nation: 'ENGLAND',
    regionGroup: 'SOUTH',
    latitude: 51.5067,
    longitude: -0.0165,
    bedrooms: 3,
    bathrooms: 2,
    floorArea: 1200,
    hasLivingRoom: true,
    hasGarden: false,
    parking: 'No',
    furnishedStatus: 'FURNISHED',
    furnishingQuality: 'High',
    isLicensed: true,
    isVacant: true,
    needsRefurb: false,
    askingPricePence: 550_000_00,
    marketValuePence: 580_000_00,
    estimatedRoi: 10.5,
    publishedAt: new Date('2025-02-01'),
    strategySpecificData: {
      maxGuests: 6,
      nightlyRatePence: 250_00,
      occupancyRate: 0.75,
      monthlyRentPence: 2200_00_00,
      billsPence: 400_00_00,
      bookingFeePercent: 15,
      maintenancePercent: 5,
      managementPence: 300_00_00,
      cleaningPence: 200_00_00,
      breakEvenOccupancy: 0.45,
      grossMonthlyIncome: 5625_00_00,
      potentialProfit: 1825_00_00,
    },
  });

  // ── L3: Single Let / Buy to Let — Bristol (Published) ──
  const l3 = await createListing({
    agencyProfileId: agency1.id,
    category: 'SELL_PROPERTY',
    strategy: 'SINGLE_LET',
    status: 'PUBLISHED',
    title: '2-Bed Flat in Bristol City Centre, BS1',
    description:
      'Modern 2-bed apartment in the heart of Bristol. Currently tenanted with reliable tenant paying £1,350pcm. Excellent buy-to-let investment with solid rental demand from the citys growing professional population. Walking distance to Temple Meads.',
    propertyType: 'FLAT',
    addressLine1: '7 Baldwin Street',
    city: 'Bristol',
    postcode: 'BS1 1SE',
    region: 'Bristol',
    nation: 'ENGLAND',
    regionGroup: 'SOUTH',
    latitude: 51.4524,
    longitude: -2.5967,
    bedrooms: 2,
    bathrooms: 1,
    floorArea: 750,
    hasLivingRoom: true,
    hasGarden: false,
    parking: 'No',
    furnishedStatus: 'SEMI_FURNISHED',
    isTenanted: true,
    isVacant: false,
    needsRefurb: false,
    askingPricePence: 260_000_00,
    marketValuePence: 275_000_00,
    estimatedRoi: 6.2,
    publishedAt: new Date('2025-03-10'),
    strategySpecificData: {
      currentRentPence: 1350_00_00,
      leaseExpiry: '2026-09-30',
      ownershipType: 'FREEHOLD',
      depositPence: 65000_00,
      stampDutyPence: 2600_00,
      mortgageInterestRate: 4.5,
    },
  });

  // ── L4: Commercial — Shop (RESERVED) ──
  const l4 = await createListing({
    agencyProfileId: agency1.id,
    category: 'COMMERCIAL',
    strategy: 'SHOP',
    status: 'RESERVED',
    title: 'Retail Unit — High Street, Bristol BS1',
    description:
      'Prime high street retail unit in bustling Broadmead shopping district. Residential flat above provides additional income. Long lease with strong tenant covenant. Reserved awaiting due diligence.',
    propertyType: 'OTHER',
    addressLine1: '32 Broadmead',
    city: 'Bristol',
    postcode: 'BS1 3DS',
    region: 'Bristol',
    nation: 'ENGLAND',
    regionGroup: 'SOUTH',
    latitude: 51.4575,
    longitude: -2.5886,
    floorArea: 1500,
    isVacant: false,
    isTenanted: true,
    needsRefurb: false,
    askingPricePence: 375_000_00,
    estimatedRoi: 8.5,
    publishedAt: new Date('2025-04-15'),
    strategySpecificData: {
      currentRentPence: 2500_00_00,
      existingRentPence: 2500_00_00,
      potentialRentPence: 3000_00_00,
      leaseYearsRemaining: 15,
      businessType: 'RETAIL',
    },
  });

  // ── L5: Lease Option BMV — (Published) ──
  const l5 = await createListing({
    agencyProfileId: agency1.id,
    category: 'LEASE_OPTION',
    strategy: 'HIGH_ROI',
    status: 'PUBLISHED',
    title: 'BMV Lease Option — 3-Bed Semi in Birmingham',
    description:
      'Exceptional below-market-value lease option on 3-bed semi-detached in popular Moseley area. Vendor motivated, significant equity gain on exercise. Requires cosmetic refurbishment which tenant-buyer would manage. Strong capital growth potential in Birmingham property market.',
    propertyType: 'SEMI_DETACHED',
    addressLine1: '78 Moseley Road',
    city: 'Birmingham',
    postcode: 'B12 9AB',
    region: 'West Midlands',
    nation: 'ENGLAND',
    regionGroup: 'NORTH',
    latitude: 52.4548,
    longitude: -1.8831,
    bedrooms: 3,
    bathrooms: 1,
    floorArea: 1000,
    hasLivingRoom: true,
    hasGarden: true,
    gardenNotes: 'South-facing rear garden, approximately 50ft',
    parking: 'Driveway',
    isVacant: true,
    needsRefurb: true,
    refurbCostPence: 25_000_00,
    refurbQuoteType: 'QUOTED',
    askingPricePence: 180_000_00,
    marketValuePence: 250_000_00,
    estimatedRoi: 18.5,
    publishedAt: new Date('2025-05-01'),
    strategySpecificData: {
      optionFeePence: 5000_00,
      purchasePricePence: 180_000_00,
      termMonths: 24,
      monthlyPaymentPence: 800_00_00,
    },
  });

  // ── L6: Development Opportunity (Published) ──
  const l6 = await createListing({
    agencyProfileId: agency1.id,
    category: 'DEVELOPMENT_OPPORTUNITY',
    strategy: 'FLAT_CONVERSION',
    status: 'PUBLISHED',
    title: 'Development Site — 3 Luxury Flats in Leeds LS1',
    description:
      'Full planning permission granted for conversion of Grade II listed building to 3 luxury apartments. Prime Leeds city centre location overlooking Park Square. All major infrastructure in place. Strong pre-sale interest from young professionals relocating to the area.',
    propertyType: 'TERRACED',
    addressLine1: '5a Park Row',
    city: 'Leeds',
    postcode: 'LS1 5HD',
    region: 'West Yorkshire',
    nation: 'ENGLAND',
    regionGroup: 'NORTH',
    latitude: 53.7975,
    longitude: -1.5446,
    bedrooms: 0,
    floorArea: 3000,
    isVacant: true,
    needsRefurb: true,
    refurbCostPence: 350_000_00,
    refurbQuoteType: 'ESTIMATED',
    askingPricePence: 450_000_00,
    marketValuePence: 550_000_00,
    estimatedValuePence: 850_000_00,
    estimatedRoi: 25.0,
    publishedAt: new Date('2025-06-01'),
    strategySpecificData: {
      buildCostPence: 350_000_00,
      estimatedValueAfterPence: 850_000_00,
      hasBuilder: true,
      hasQuote: true,
      legalCostsPence: 15_000_00,
      depositPercent: 25,
      stampDutyPence: 13_500_00,
      finderFeesPence: 10_000_00,
      numberOfUnits: 3,
      unitMix: { oneBed: 1, twoBed: 2 },
    },
  });

  // ── L7: Portfolio (Published) ──
  const l7 = await createListing({
    agencyProfileId: agency1.id,
    category: 'PORTFOLIO',
    strategy: 'MIXED_USE',
    status: 'PUBLISHED',
    title: 'Mixed-Use Portfolio — 5 Units, Sheffield S1',
    description:
      'Well-balanced portfolio of 3 residential flats and 2 commercial units in Sheffield city centre. Monthly income £7,500 with strong tenant histories. All units let with healthy yields. Ideal for investor seeking diversified cash-flow with single management point.',
    propertyType: 'OTHER',
    addressLine1: '12-18 Fargate',
    city: 'Sheffield',
    postcode: 'S1 2HE',
    region: 'South Yorkshire',
    nation: 'ENGLAND',
    regionGroup: 'NORTH',
    latitude: 53.3831,
    longitude: -1.4658,
    floorArea: 5000,
    needsRefurb: false,
    askingPricePence: 850_000_00,
    estimatedRoi: 9.2,
    publishedAt: new Date('2025-07-01'),
    strategySpecificData: {
      numberOfProperties: 5,
      totalMonthlyRentPence: 7500_00_00,
      summary: '3 residential flats (£3,500/mo) + 2 commercial units (£4,000/mo)',
    },
  });

  for (let i = 1; i <= 5; i++) {
    await prisma.portfolioAsset.create({
      data: {
        listingId: l7.id,
        name: i <= 3 ? `Residential Flat ${i}` : `Commercial Unit ${i - 3}`,
        valuePence: i <= 3 ? 150_000_00 : 200_000_00,
        notes: i <= 3 ? '1-bed flat, tenant since 2020' : 'Ground floor retail, 5 years remaining on lease',
        order: i,
      },
    });
  }

  // ══════════════════════════════════════════════════
  //  AGENCY 2 — Northern Property Group (North)
  // ══════════════════════════════════════════════════

  // ── L8: HMO Rent-to-Rent Manchester (Published) ──
  const l8 = await createListing({
    agencyProfileId: agency2.id,
    category: 'RENT_TO_RENT',
    strategy: 'HMO',
    status: 'PUBLISHED',
    title: '6-Bed HMO near Manchester Piccadilly, M1',
    description:
      'Popular 6-bed HMO in student-friendly area near Manchester Metropolitan University. High demand from postgraduate students and young professionals. All rooms let with waiting list. Recently refurbished to high standard with new kitchen and bathrooms.',
    propertyType: 'TERRACED',
    addressLine1: '28 Hulme Street',
    city: 'Manchester',
    postcode: 'M1 5GL',
    region: 'Greater Manchester',
    nation: 'ENGLAND',
    regionGroup: 'NORTH',
    latitude: 53.4725,
    longitude: -2.2432,
    bedrooms: 6,
    bathrooms: 2,
    floorArea: 1900,
    hasLivingRoom: true,
    hasGarden: true,
    gardenNotes: 'Small courtyard garden with bike storage',
    parking: 'On-street permit',
    isLicensed: true,
    isVacant: false,
    isTenanted: true,
    needsRefurb: false,
    askingPricePence: 380_000_00,
    marketValuePence: 420_000_00,
    estimatedRoi: 13.5,
    publishedAt: new Date('2025-03-15'),
    strategySpecificData: {
      rentTerm: 3,
      rentToLandlordPence: 2800_00_00,
      depositPence: 4000_00,
      contractLength: 36,
      reviewPeriod: 12,
      referenceRequirement: 'EASY',
      managementAvailable: true,
      finderFeePence: 3500_00,
      grossMonthlyIncome: 5000_00_00,
      moneyNeededIn: 28000_00_00,
      potentialProfit: 2200_00_00,
      agencyName: 'Northern Property Group',
      notes: 'Students on annual contracts, summer turnover but quick re-let',
      billsIncluded: true,
    },
  });

  for (let i = 1; i <= 6; i++) {
    await prisma.hmoRoom.create({
      data: {
        listingId: l8.id,
        name: i === 1 ? 'Master Bedroom' : `Room ${i}`,
        roomType: 'DOUBLE_SHARED',
        monthlyRentPence: i === 1 ? 950_00 : 850_00,
      },
    });
  }

  // ── L9: Serviced Accommodation Manchester (Published) ──
  const l9 = await createListing({
    agencyProfileId: agency2.id,
    category: 'RENT_TO_RENT',
    strategy: 'SA',
    status: 'PUBLISHED',
    title: 'Premium 2-Bed SA in Spinningfields, M3',
    description:
      'Executive serviced apartment in Manchester premier business district. Ideal for corporate lets. Walk to all major offices, restaurants, and Spinningfields amenities. High occupancy rates with corporate clients paying premium rates.',
    propertyType: 'FLAT',
    addressLine1: '5 Hardman Street',
    city: 'Manchester',
    postcode: 'M3 3HF',
    region: 'Greater Manchester',
    nation: 'ENGLAND',
    regionGroup: 'NORTH',
    latitude: 53.4805,
    longitude: -2.2529,
    bedrooms: 2,
    bathrooms: 2,
    floorArea: 850,
    hasLivingRoom: true,
    hasGarden: false,
    parking: '1 space included',
    furnishedStatus: 'FURNISHED',
    furnishingQuality: 'High',
    isLicensed: true,
    isVacant: true,
    needsRefurb: false,
    askingPricePence: 310_000_00,
    marketValuePence: 335_000_00,
    estimatedRoi: 11.8,
    publishedAt: new Date('2025-04-20'),
    strategySpecificData: {
      maxGuests: 4,
      nightlyRatePence: 195_00,
      occupancyRate: 0.72,
      monthlyRentPence: 1500_00_00,
      billsPence: 300_00_00,
      bookingFeePercent: 15,
      maintenancePercent: 5,
      managementPence: 200_00_00,
      cleaningPence: 180_00_00,
      breakEvenOccupancy: 0.42,
      grossMonthlyIncome: 4212_00_00,
      potentialProfit: 1732_00_00,
    },
  });

  // ── L10: Single Let — SOLD ──
  const l10 = await createListing({
    agencyProfileId: agency2.id,
    category: 'SELL_PROPERTY',
    strategy: 'SINGLE_LET',
    status: 'SOLD',
    title: '1-Bed Apartment in Liverpool L1 (Sold)',
    description:
      'SOLD — City centre studio apartment in Liverpool One district. Previously tenanted. This listing is retained for testing Exclude Sold filters.',
    propertyType: 'FLAT',
    addressLine1: '25 Hanover Street',
    city: 'Liverpool',
    postcode: 'L1 3DN',
    region: 'Merseyside',
    nation: 'ENGLAND',
    regionGroup: 'NORTH',
    latitude: 53.4054,
    longitude: -2.9822,
    bedrooms: 1,
    bathrooms: 1,
    floorArea: 450,
    isTenanted: false,
    isVacant: true,
    needsRefurb: false,
    askingPricePence: 120_000_00,
    marketValuePence: 130_000_00,
    estimatedRoi: 5.5,
    publishedAt: new Date('2025-02-01'),
    strategySpecificData: {},
  });

  // ── L11: Refurb Opportunity (Published) ──
  const l11 = await createListing({
    agencyProfileId: agency2.id,
    category: 'REFURB_OPPORTUNITY',
    strategy: 'CASH_PURCHASE',
    status: 'PUBLISHED',
    title: 'Refurb Project — 4-Bed Victorian in Liverpool L8',
    description:
      'Stunning Victorian terrace on iconic Princes Road requiring full cosmetic and structural refurbishment. Original period features throughout including cornicing, fireplaces, and stained glass windows. Enormous potential to create a flagship family home or convert to luxury HMO. Keenly priced to reflect refurb requirements.',
    propertyType: 'TERRACED',
    addressLine1: '88 Princes Road',
    city: 'Liverpool',
    postcode: 'L8 1TH',
    region: 'Merseyside',
    nation: 'ENGLAND',
    regionGroup: 'NORTH',
    latitude: 53.3957,
    longitude: -2.9632,
    bedrooms: 4,
    bathrooms: 1,
    floorArea: 2000,
    hasLivingRoom: true,
    hasGarden: true,
    gardenNotes: 'Large rear walled garden, approx 60ft',
    parking: 'On-street',
    isVacant: true,
    needsRefurb: true,
    refurbCostPence: 80_000_00,
    refurbQuoteType: 'QUOTED',
    askingPricePence: 150_000_00,
    marketValuePence: 250_000_00,
    estimatedRoi: 22.0,
    publishedAt: new Date('2025-05-15'),
    strategySpecificData: {
      refurbCostPence: 80_000_00,
      totalInvestmentPence: 230_000_00,
      estimatedValueAfterPence: 350_000_00,
      potentialProfitPence: 120_000_00,
      addValueCategory: 'FULL_REFURB',
    },
  });

  // ── L12: Lease Option HMO Nottingham (Published) ──
  const l12 = await createListing({
    agencyProfileId: agency2.id,
    category: 'LEASE_OPTION',
    strategy: 'HMO',
    status: 'PUBLISHED',
    title: 'Lease Option — 6-Bed HMO, Nottingham NG1',
    description:
      'Lease option on profitable 6-bed HMO in Nottingham city centre. Currently fully let with strong room-by-room rents. Ideal for investor wanting hands-off monthly income with option to purchase at predetermined price within 3 years. Landlord willing to accept small deposit.',
    propertyType: 'TERRACED',
    addressLine1: '45 Maid Marian Way',
    city: 'Nottingham',
    postcode: 'NG1 6AB',
    region: 'Nottinghamshire',
    nation: 'ENGLAND',
    regionGroup: 'NORTH',
    latitude: 52.9529,
    longitude: -1.1536,
    bedrooms: 6,
    bathrooms: 2,
    floorArea: 1800,
    hasLivingRoom: true,
    isLicensed: true,
    isVacant: false,
    isTenanted: true,
    needsRefurb: true,
    refurbCostPence: 15_000_00,
    refurbQuoteType: 'QUOTED',
    askingPricePence: 320_000_00,
    marketValuePence: 380_000_00,
    estimatedRoi: 14.2,
    publishedAt: new Date('2025-06-10'),
    strategySpecificData: {
      optionFeePence: 5000_00,
      termMonths: 36,
      monthlyPaymentPence: 500_00_00,
      grossMonthlyIncome: 6000_00_00,
      moneyNeededInPence: 35_000_00,
    },
  });

  // ── L13: DRAFT — Agency 2 (not published) ──
  const l13 = await createListing({
    agencyProfileId: agency2.id,
    category: 'SELL_PROPERTY',
    strategy: 'SINGLE_LET',
    status: 'DRAFT',
    title: '1-Bed Starter Flat, Cardiff (Draft)',
    description: 'Incomplete draft listing awaiting photos and pricing verification.',
    propertyType: 'FLAT',
    addressLine1: '7 Queen Street',
    city: 'Cardiff',
    postcode: 'CF10 2AF',
    region: 'Cardiff',
    nation: 'WALES',
    regionGroup: 'SOUTH',
    latitude: 51.4816,
    longitude: -3.1791,
    bedrooms: 1,
    bathrooms: 1,
    floorArea: 500,
    needsRefurb: false,
  });

  // ── L14: ARCHIVED — Agency 1 ──
  const l14 = await createListing({
    agencyProfileId: agency1.id,
    category: 'LEASE_OPTION',
    strategy: 'CASH_PURCHASE',
    status: 'ARCHIVED',
    title: '2-Bed Cottage, Bath (Archived)',
    description: 'Old listing no longer available. Archived for record keeping.',
    propertyType: 'DETACHED',
    addressLine1: '3 Pulteney Bridge',
    city: 'Bath',
    postcode: 'BA2 4AS',
    region: 'Somerset',
    nation: 'ENGLAND',
    regionGroup: 'SOUTH',
    latitude: 51.3821,
    longitude: -2.3545,
    bedrooms: 2,
    bathrooms: 1,
    floorArea: 800,
    needsRefurb: false,
    askingPricePence: 310_000_00,
    marketValuePence: 325_000_00,
    estimatedRoi: 4.8,
    archivedAt: new Date('2025-08-15'),
  });

  console.log(`Listings created: 14 (${[
    ...new Set([l1, l2, l3, l4, l5, l6, l7, l8, l9, l10, l11, l12, l13, l14].map((l) => l.status)),
  ].join(', ')})`);

  // ══════════════════════════════════════════════════
  //  FAVOURITES — Buyer 1 likes 3 listings
  // ══════════════════════════════════════════════════

  await prisma.favourite.createMany({
    data: [
      { userId: buyer1.id, listingId: l1.id },
      { userId: buyer1.id, listingId: l5.id },
      { userId: buyer1.id, listingId: l8.id },
    ],
  });

  console.log('Favourites created: buyer1 → 3 listings');

  // ══════════════════════════════════════════════════
  //  CONVERSATIONS + MESSAGES
  // ══════════════════════════════════════════════════

  // Conv 1: buyer1 ↔ agency1 about l1 (HMO Whitechapel) — some read, some unread
  const conv1 = await prisma.conversation.create({
    data: {
      listingId: l1.id,
      buyerUserId: buyer1.id,
      agencyUserId: agency1User.id,
    },
  });

  // Buyer sends first message
  await prisma.message.create({
    data: {
      conversationId: conv1.id,
      senderUserId: buyer1.id,
      body: 'Hi, Im interested in the 7-bed HMO in Whitechapel. Is it still available for viewing?',
      createdAt: new Date('2025-06-20T10:00:00Z'),
      readAt: new Date('2025-06-20T11:30:00Z'), // agency read it
    },
  });

  // Agency replies
  await prisma.message.create({
    data: {
      conversationId: conv1.id,
      senderUserId: agency1User.id,
      body: 'Hi Alice, yes the property is still available. We can arrange a viewing this week. How does Thursday at 2pm suit?',
      createdAt: new Date('2025-06-20T11:35:00Z'),
      readAt: new Date('2025-06-20T14:00:00Z'), // buyer read it
    },
  });

  // Buyer confirms
  await prisma.message.create({
    data: {
      conversationId: conv1.id,
      senderUserId: buyer1.id,
      body: "Thursday at 2pm works perfectly. Please send me the full address and any instructions for access. Also, could you share the latest financials including current occupancy and rent roll?",
      createdAt: new Date('2025-06-20T14:05:00Z'),
      readAt: new Date('2025-06-20T16:00:00Z'),
    },
  });

  // Agency sends financials — buyer has NOT read this yet (unread)
  await prisma.message.create({
    data: {
      conversationId: conv1.id,
      senderUserId: agency1User.id,
      body: 'Great, the address is 22 Brick Lane, E1 6RU. Ill meet you outside. Heres the latest rent schedule:\n\nRoom 1 (en-suite): £1,200\nRooms 2-7: £1,000 each\nTotal monthly: £7,000\nAll rooms tenanted. Current occupancy: 100%\n\nLooking forward to Thursday!',
      createdAt: new Date('2025-06-20T16:15:00Z'),
      readAt: null, // unread
    },
  });

  // Conv 2: buyer1 ↔ agency2 about l8 (HMO Manchester) — all read
  const conv2 = await prisma.conversation.create({
    data: {
      listingId: l8.id,
      buyerUserId: buyer1.id,
      agencyUserId: agency2User.id,
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conv2.id,
      senderUserId: buyer1.id,
      body: 'Hi, interested in the Manchester HMO near Piccadilly. Can you tell me more about the tenant profile and whether theres a waiting list?',
      createdAt: new Date('2025-06-22T09:00:00Z'),
      readAt: new Date('2025-06-22T09:30:00Z'),
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conv2.id,
      senderUserId: agency2User.id,
      body: 'Hi Alice. Yes, the property is occupied by postgraduate students and young professionals on annual contracts. We maintain a waiting list of approximately 8-10 inquiries at any time, so voids are typically filled within 2 weeks. All rooms are let for the current academic year with 2 rooms turning over in September. Happy to share more details if you would like to proceed.',
      createdAt: new Date('2025-06-22T09:35:00Z'),
      readAt: new Date('2025-06-22T10:00:00Z'),
    },
  });

  // Conv 3: buyer2 ↔ agency1 about l5 (BMV Birmingham) — all read
  const conv3 = await prisma.conversation.create({
    data: {
      listingId: l5.id,
      buyerUserId: buyer2.id,
      agencyUserId: agency1User.id,
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conv3.id,
      senderUserId: buyer2.id,
      body: "Hi, I'm interested in the BMV lease option in Birmingham. Can you send me the full financial breakdown including the option fee, monthly payments, and exit strategy?",
      createdAt: new Date('2025-06-18T14:00:00Z'),
      readAt: new Date('2025-06-18T15:00:00Z'),
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conv3.id,
      senderUserId: agency1User.id,
      body: "Of course. Heres the summary:\n\n- Option fee: £5,000\n- Purchase price: £180,000 (28% below £250k market value)\n- Term: 24 months\n- Monthly payment: £800\n- Refurb budget: £25,000 (quoted)\n- Estimated value after refurb: £300,000+\n- Potential equity: £95,000+\n\nWould you like to arrange a viewing? The property is vacant so flexible timing.",
      createdAt: new Date('2025-06-18T15:05:00Z'),
      readAt: new Date('2025-06-19T09:00:00Z'),
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conv3.id,
      senderUserId: buyer2.id,
      body: 'That looks very interesting. Yes, Id like to view the property. Would next Tuesday morning work? I can do any time from 10am.',
      createdAt: new Date('2025-06-19T09:15:00Z'),
      readAt: new Date('2025-06-19T10:00:00Z'),
    },
  });

  console.log('Conversations + messages created: 3 conversations, 9 messages');
  console.log('\n=== Demo Seed Complete ===\n');

  // ══════════════════════════════════════════════════
  //  PRINT CREDENTIALS TABLE
  // ══════════════════════════════════════════════════

  const pad = (s: string, n: number) => s.padEnd(n);

  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│                    PROP VEST — DEMO ACCOUNTS                    │');
  console.log('├─────────────────────────────────────────────────────────────────┤');
  console.log(`│                                                       │`);
  console.log(`│  Password: ${PASSWORD}${' '.repeat(30)}│`);
  console.log(`│                                                       │`);
  console.log('├─────────────────────┬───────────────────────────────────────────┤');
  console.log(`│  Role               │  Email                                    │`);
  console.log('├─────────────────────┼───────────────────────────────────────────┤');
  console.log(`│  ${pad('Admin', 19)}│  ${pad('admin@demo.test', 42)}│`);
  console.log(`│  ${pad('Agency (APPROVED)', 19)}│  ${pad('agency1@demo.test', 42)}│`);
  console.log(`│  ${pad('Agency (APPROVED)', 19)}│  ${pad('agency2@demo.test', 42)}│`);
  console.log(`│  ${pad('Agency (PENDING)', 19)}│  ${pad('pending@demo.test', 42)}│`);
  console.log(`│  ${pad('Buyer', 19)}│  ${pad('buyer1@demo.test', 42)}│`);
  console.log(`│  ${pad('Buyer', 19)}│  ${pad('buyer2@demo.test', 42)}│`);
  console.log(`│  ${pad('Buyer', 19)}│  ${pad('buyer3@demo.test', 42)}│`);
  console.log('├─────────────────────┴───────────────────────────────────────────┤');
  console.log('│                                                       │');
  console.log('│  Dashboard: http://localhost:3000                              │');
  console.log('│  Login with any email above + password: Passw0rd!              │');
  console.log('│                                                       │');
  console.log('│  Demo data: 14 listings, 3 favourites, 3 conversations         │');
  console.log(`│  Status mix: PUBLISHED x10, RESERVED x1, SOLD x1, DRAFT x1, ARCHIVED x1          │`);
  console.log('│                                                       │');
  console.log('└─────────────────────────────────────────────────────────────────┘\n');
}

main()
  .catch((e) => {
    console.error('Demo seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });