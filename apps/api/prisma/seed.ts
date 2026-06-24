import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PropVest database...');

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

  const passwordHash = await argon2.hash('Passw0rd!');

  // ── Users ──
  const admin = await prisma.user.create({
    data: {
      email: 'admin@propvest.test',
      passwordHash,
      role: 'ADMIN',
      displayName: 'Admin User',
    },
  });
  console.log(`  ✓ Admin: ${admin.email}`);

  const approvedAgencyUser = await prisma.user.create({
    data: {
      email: 'agency@propvest.test',
      passwordHash,
      role: 'AGENCY',
      displayName: 'Approved Agency',
    },
  });
  console.log(`  ✓ Agency (approved): ${approvedAgencyUser.email}`);

  const pendingAgencyUser = await prisma.user.create({
    data: {
      email: 'pending@propvest.test',
      passwordHash,
      role: 'AGENCY',
      displayName: 'Pending Agency',
    },
  });
  console.log(`  ✓ Agency (pending): ${pendingAgencyUser.email}`);

  const buyer = await prisma.user.create({
    data: {
      email: 'buyer@propvest.test',
      passwordHash,
      role: 'USER',
      displayName: 'Test Buyer',
    },
  });
  console.log(`  ✓ Buyer: ${buyer.email}`);

  // ── Agency profiles ──
  const approvedAgency = await prisma.agencyProfile.create({
    data: {
      userId: approvedAgencyUser.id,
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
  console.log(`  ✓ Agency profile (approved): ${approvedAgency.companyName}`);

  await prisma.agencyProfile.create({
    data: {
      userId: pendingAgencyUser.id,
      companyName: 'New Horizons Property',
      address: '45 Deansgate, Manchester, M3 2AB',
      contactName: 'James Wilson',
      phone: '0161 234 5678',
      verificationStatus: 'PENDING',
    },
  });
  console.log('  ✓ Agency profile (pending): New Horizons Property');

  // ── Listings ──

  // Helper to create a listing — accepts all valid Listing fields via any
  async function createListing(data: any) {
    return prisma.listing.create({ data });
  }

  // 1 — HMO Rent-to-Rent
  const listing1 = await createListing({
    agencyProfileId: approvedAgency.id,
    category: 'RENT_TO_RENT',
    strategy: 'HMO',
    status: 'PUBLISHED',
    title: '7-Bed HMO in Whitechapel, E1',
    description: 'Fully licensed 7-bed HMO with existing tenancies. Gross monthly rent £7,000.',
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
    isLicensed: true,
    isVacant: false,
    needsRefurb: false,
    askingPricePence: 650_000_00,
    marketValuePence: 700_000_00,
    estimatedRoi: 12.9,
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
    },
  });
  console.log(`  ✓ Listing: ${listing1.title}`);

  // Add HMO rooms
  for (let i = 1; i <= 7; i++) {
    const roomTypes = ['DOUBLE_EN_SUITE', 'DOUBLE_SHARED', 'SINGLE_SHARED'];
    await prisma.hmoRoom.create({
      data: {
        listingId: listing1.id,
        name: `Room ${i}`,
        roomType: roomTypes[i % 3] as any,
        monthlyRentPence: 1000_00,
      },
    });
  }

  // 2 — Serviced Accommodation
  const listing2 = await createListing({
    agencyProfileId: approvedAgency.id,
    category: 'RENT_TO_RENT',
    strategy: 'SA',
    status: 'PUBLISHED',
    title: 'Luxury 3-Bed SA in Canary Wharf, E14',
    description: 'High-end serviced accommodation in prime Canary Wharf location.',
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
    isLicensed: true,
    isVacant: true,
    needsRefurb: false,
    askingPricePence: 550_000_00,
    marketValuePence: 580_000_00,
    estimatedRoi: 10.5,
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
  console.log(`  ✓ Listing: ${listing2.title}`);

  // 3 — Single Let / Buy to Let
  const listing3 = await createListing({
    agencyProfileId: approvedAgency.id,
    category: 'SELL_PROPERTY',
    strategy: 'SINGLE_LET',
    status: 'PUBLISHED',
    title: '2-Bed Flat in Manchester City Centre',
    description: 'Excellent buy-to-let opportunity in the heart of Manchester. Currently tenanted.',
    propertyType: 'FLAT',
    addressLine1: '42 Deansgate',
    city: 'Manchester',
    postcode: 'M3 2AB',
    region: 'Greater Manchester',
    nation: 'ENGLAND',
    regionGroup: 'NORTH',
    latitude: 53.4808,
    longitude: -2.2486,
    bedrooms: 2,
    bathrooms: 1,
    floorArea: 750,
    hasLivingRoom: true,
    hasGarden: false,
    isTenanted: true,
    isVacant: false,
    needsRefurb: false,
    askingPricePence: 220_000_00,
    marketValuePence: 235_000_00,
    estimatedRoi: 6.8,
    strategySpecificData: {
      currentRentPence: 1250_00_00,
      leaseExpiry: '2027-06-30',
    },
  });
  console.log(`  ✓ Listing: ${listing3.title}`);

  // 4 — Lease Option BMV
  const listing4 = await createListing({
    agencyProfileId: approvedAgency.id,
    category: 'LEASE_OPTION',
    strategy: 'HIGH_ROI',
    status: 'PUBLISHED',
    title: 'BMV Lease Option — 3-Bed Semi in Birmingham',
    description: 'Below market value lease option on a 3-bed semi-detached in Birmingham.',
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
    isVacant: true,
    needsRefurb: true,
    refurbCostPence: 25_000_00,
    askingPricePence: 180_000_00,
    marketValuePence: 250_000_00,
    estimatedRoi: 18.5,
    strategySpecificData: {
      optionFeePence: 5000_00,
      purchasePricePence: 180_000_00,
      termMonths: 24,
      monthlyPaymentPence: 800_00_00,
    },
  });
  console.log(`  ✓ Listing: ${listing4.title}`);

  // 5 — Development Opportunity
  const listing5 = await createListing({
    agencyProfileId: approvedAgency.id,
    category: 'DEVELOPMENT_OPPORTUNITY',
    strategy: 'FLAT_CONVERSION',
    status: 'PUBLISHED',
    title: 'Development Site — 3 Flats in Leeds LS1',
    description: 'Planning permission for conversion to 3 luxury flats in Leeds city centre.',
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
    askingPricePence: 450_000_00,
    estimatedValuePence: 850_000_00,
    estimatedRoi: 25.0,
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
  console.log(`  ✓ Listing: ${listing5.title}`);

  // 6 — Refurb Opportunity
  const listing6 = await createListing({
    agencyProfileId: approvedAgency.id,
    category: 'REFURB_OPPORTUNITY',
    strategy: 'CASH_PURCHASE',
    status: 'PUBLISHED',
    title: 'Refurb Project — 4-Bed Victorian in Liverpool L8',
    description: 'Stunning Victorian terrace requiring full refurbishment. Excellent potential.',
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
    parking: 'On-street',
    isVacant: true,
    needsRefurb: true,
    refurbCostPence: 80_000_00,
    refurbQuoteType: 'QUOTED',
    askingPricePence: 150_000_00,
    marketValuePence: 250_000_00,
    estimatedRoi: 22.0,
    strategySpecificData: {
      refurbCostPence: 80_000_00,
      totalInvestmentPence: 230_000_00,
      estimatedValueAfterPence: 350_000_00,
      potentialProfitPence: 120_000_00,
      addValueCategory: 'FULL_REFURB',
    },
  });
  console.log(`  ✓ Listing: ${listing6.title}`);

  // 7 — Commercial: Shop
  const listing7 = await createListing({
    agencyProfileId: approvedAgency.id,
    category: 'COMMERCIAL',
    strategy: 'SHOP',
    status: 'PUBLISHED',
    title: 'Retail Unit — High Street, Bristol BS1',
    description: 'Prime high street retail unit with residential above. Long lease available.',
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
    strategySpecificData: {
      currentRentPence: 2500_00_00,
      existingRentPence: 2500_00_00,
      potentialRentPence: 3000_00_00,
      leaseYearsRemaining: 15,
      businessType: 'RETAIL',
    },
  });
  console.log(`  ✓ Listing: ${listing7.title}`);

  // 8 — Portfolio
  const listing8 = await createListing({
    agencyProfileId: approvedAgency.id,
    category: 'PORTFOLIO',
    strategy: 'MIXED_USE',
    status: 'PUBLISHED',
    title: 'Mixed-Use Portfolio — 5 Units, Sheffield S1',
    description: 'Portfolio of 3 residential + 2 commercial units in Sheffield city centre.',
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
    strategySpecificData: {
      numberOfProperties: 5,
      totalMonthlyRentPence: 7500_00_00,
      summary: '3 residential flats (£3,500/mo) + 2 commercial units (£4,000/mo)',
    },
  });
  console.log(`  ✓ Listing: ${listing8.title}`);

  // Add portfolio assets
  for (let i = 1; i <= 5; i++) {
    await prisma.portfolioAsset.create({
      data: {
        listingId: listing8.id,
        name: `Unit ${i}`,
        assetType: i <= 3 ? 'RESIDENTIAL' : 'COMMERCIAL',
        valuePence: i <= 3 ? 150_000_00 : 200_000_00,
        order: i,
      },
    });
  }

  // 9 — Lease Option HMO
  const listing9 = await createListing({
    agencyProfileId: approvedAgency.id,
    category: 'LEASE_OPTION',
    strategy: 'HMO',
    status: 'PUBLISHED',
    title: 'Lease Option — 6-Bed HMO, Nottingham NG1',
    description: 'Lease option on established 6-bed HMO in Nottingham city centre.',
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
    needsRefurb: true,
    refurbCostPence: 15_000_00,
    askingPricePence: 320_000_00,
    marketValuePence: 380_000_00,
    estimatedRoi: 14.2,
    strategySpecificData: {
      optionFeePence: 5000_00,
      termMonths: 36,
      monthlyPaymentPence: 500_00_00,
      grossMonthlyIncome: 6000_00_00,
      moneyNeededInPence: 35_000_00,
    },
  });
  console.log(`  ✓ Listing: ${listing9.title}`);

  // 10 — DRAFT listing (not published)
  const listing10 = await createListing({
    agencyProfileId: approvedAgency.id,
    category: 'SELL_PROPERTY',
    strategy: 'SINGLE_LET',
    status: 'DRAFT',
    title: '1-Bed Starter Flat, Cardiff (Draft)',
    description: 'Incomplete listing awaiting photos and pricing.',
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
  console.log(`  ✓ Listing (draft): ${listing10.title}`);

  console.log('\nSeed complete!');
  console.log('---');
  console.log('Test accounts (password: Passw0rd!):');
  console.log('  Admin:   admin@propvest.test');
  console.log('  Agency:  agency@propvest.test');
  console.log('  Pending: pending@propvest.test');
  console.log('  Buyer:   buyer@propvest.test');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });