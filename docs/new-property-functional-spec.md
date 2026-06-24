# New Property Module – Functional Specification

## Document Purpose
This document defines the functional requirements for the **New Property** data-entry module in a UK property investment platform designed for inter-agency collaboration, sourcing, and investment-focused property listings. The module is intended for sellers, sourcers, agencies, and network partners to submit new property opportunities in a structured and searchable format.[cite:1]

## Product Context
The platform supports investment-led property opportunities in the UK rather than standard residential listings. The form must capture both common property information and strategy-specific investment data so that listings can be evaluated, filtered, shared, and compared across the agency network.[cite:1]

## Core Objective
The New Property module must:

- Allow users to create a new property listing from a single entry point.[cite:1]
- Support multiple investment strategies and deal structures within one modular workflow.[cite:1]
- Collect standard property data once, then reveal strategy-specific fields dynamically.[cite:1]
- Calculate core investment metrics automatically where formulas are defined.[cite:1]
- Store enough structured data for search, matching, underwriting, and internal collaboration.[cite:1]

## User Types
Typical users of this module include:

- Seller
- Sourcer
- Estate agency user
- Investment manager
- Co-sourcing partner
- Admin / internal reviewer[cite:1]

## Functional Design Principles
The form should follow these principles:

- **Modular architecture**: One shared base form plus dynamic sections by listing strategy.[cite:1]
- **Conditional visibility**: Only relevant fields should appear after the user selects listing category and strategy.[cite:1]
- **Structured data first**: Wherever possible, use dropdowns, toggles, numeric inputs, and repeatable groups instead of free text.[cite:1]
- **Calculation-ready model**: Costs, income, and profitability inputs should be stored separately to support automation and reporting.[cite:1]
- **Network-friendly workflow**: Agency details, finder fee details, and co-sourcing options must be included where relevant.[cite:1]

## Form Architecture
The New Property workflow should be implemented as a multi-section or step-based form.

### Step 1 – Listing Category
The user selects the top-level listing category. Supported categories should include:

- Rent to Rent
- Lease Option
- Sell Property
- Portfolio
- Commercial
- Development Opportunity
- Refurb Opportunity[cite:1]

### Step 2 – Investment Strategy
The user selects the investment strategy or deal subtype. Supported strategy values should include:

- HMO
- SA / Serviced Accommodation
- Single Let / Buy to Let
- High ROI Investment
- Cash Purchase
- Commercial
- Mixed Use
- Hotel
- Shop
- Flat Conversion
- Add Bedroom
- Extension
- Loft / Roof Conversion[cite:1]

### Step 3 – Base Property Information
This section is mandatory for all listing types.

#### 3.1 Address Information
Fields:

- Full address
- Postcode
- Property / building number
- Region
- Nation / area (England, Wales, Scotland, or manual entry)
- Area grouping (for example North / South if used by business logic)
- Google Maps lookup / geolocation support[cite:1]

#### 3.2 Property Classification
Fields:

- Property type
  - Terraced
  - Flat
  - Detached
  - Semi-detached
  - Other (requires explanation)
- Listing title (recommended)
- Internal reference ID (optional, admin-generated or user-entered)[cite:1]

#### 3.3 Media
Fields:

- Property photos upload
- Property video upload[cite:1]

#### 3.4 General Property Details
Fields:

- Number of bedrooms
- Number of bathrooms
- Floor area / size
- Living room (Yes / No)
- Garden (Yes / No / Notes)
- Parking (Yes / No / Number of spaces)
- Furnished status[cite:1]

#### 3.5 Furnishing Specification
Fields:

- Unfurnished
- Furnished
- Semi-furnished
- High quality
- Good quality
- Medium quality
- Low quality
- Other (explanation field)[cite:1]

#### 3.6 Property Status and Readiness
Fields:

- Vacant / tenanted
- Licensed / not licensed
- Needs refurbishment (Yes / No)
- Refurbishment quote status
  - Quoted
  - Estimated[cite:1]

## Dynamic Sections by Listing Type
After the user selects category and strategy, the system must display the relevant section set.

## 4. Rent to Rent
Rent to Rent listings should support HMO, SA, and block/property-group scenarios.[cite:1]

### 4.1 Rent to Rent – Common Commercial Terms
Fields:

- Rent term
- Rent payable to landlord
- Deposit
- Contract length (years / months)
- Review period after X months / years
- Reference requirement
  - Easy reference
  - Full reference
  - LTD contract
  - Other
- Bills included / excluded
  - Utilities
  - Council tax
  - Other recurring bills[cite:1]

### 4.2 Rent to Rent – HMO
#### HMO Property Data
Fields:

- HMO details section
- Licence status
- Tenanted status
- Refurbishment required (Yes / No)
- Refurbishment cost
- Quote type (quoted / estimate)[cite:1]

#### HMO Room Configuration
This must be a repeatable field group because the number of rooms varies per property.[cite:1]

Each room entry should include:

- Room name / number
- Room type
  - Double bed en-suite
  - Double bed shared bathroom
  - Single bed en-suite
  - Single bed shared bathroom
  - Other
- Monthly rent for that room[cite:1]

#### HMO Commercial / Agency Data
Fields:

- Management available (Yes / No)
- Agency details
- Finder fee
- Happy to co-source (Yes / No)
- Additional notes[cite:1]

#### HMO Auto-Generated Outputs
The system should calculate and display:

- Potential gross monthly income based on total room rents
- Money needed in
- Potential profit
- Summary block[cite:1]

### 4.3 Rent to Rent – SA / Serviced Accommodation
#### SA Property Details
Fields:

- Bedrooms
- Bathrooms
- Maximum accommodated guests
- Furnished (Yes / No)
- If furnished, quality/style:
  - Stylish
  - Good quality
  - Medium
  - Upgrade needed
  - Other[cite:1]

#### SA Revenue Inputs
Fields:

- Rent per night
- Occupancy rate (%)
- Optional API-estimated revenue values[cite:1]

#### SA Operating Costs
Fields:

- Rent
- Bills
- Booking fee
- Maintenance (default rule may use 5%)
- Management cost
- Cleaning cost
- Other costs[cite:1]

#### SA External Data Support
Integrations / lookups:

- AirDNA API for occupancy / nightly-rate support
- Validation using postcode and number of beds[cite:1]

#### SA Auto-Generated Outputs
The system should calculate and display:

- Potential monthly income = occupancy × nightly rent × 30
- Potential yearly income = occupancy × nightly rent × 365
- Total money needed in
- Potential total costs
- Potential profit
- Cost breakdown / breakout
- Minimum occupancy required to break even
- Summary block[cite:1]

### 4.4 Rent to Rent – Block of Property
Fields:

- Total number of units in block
- Unit mix:
  - 1 bed
  - 2 bed
  - 3 bed
  - Other unit types if required[cite:1]

## 5. Lease Option
Lease Option should be supported as a separate listing category with strategy-specific subtypes.[cite:1]

### 5.1 Lease Option Base Fields
Fields:

- Address
- Property details
- Price
- Potential income
- Cost to buy
- Summary[cite:1]

### 5.2 Lease Option Subtypes
Supported subtypes:

- BMV
- HMO
- High ROI investment
- Cash[cite:1]

Each subtype should inherit the same base structure but allow subtype-specific labels, assumptions, filters, and reporting tags.[cite:1]

## 6. Sell Property
Sell Property must support direct investment sales, value-add opportunities, and strategy-led resale analysis.[cite:1]

### 6.1 Ownership and Legal Status
Fields:

- Freehold / leasehold
- Lease expiry / finish date
- Current rent[cite:1]

### 6.2 Pricing Fields
Fields:

- Asking price / selling price
- Market value
- Estimated value[cite:1]

### 6.3 Property Commercial Data
Fields:

- Property size
- Existing rent
- Potential rent
- Agency field
- RICS / RACS-type field exactly as required by business users if retained in source structure[cite:1]

### 6.4 Cost to Buy
Fields:

- Deposit to buy
- Default deposit assumption example: 25%
- Stamp duty
- Finder fees
- Legal fees
- Other acquisition costs[cite:1]

### 6.5 Finance Inputs and Calculations
Fields:

- Mortgage interest rate
- Finance notes

Calculated example:

\[
\text{Monthly mortgage cost} = \frac{(\text{total price} \times 0.75) \times \text{interest rate}}{12}
\]

The system should also support:

- Management fee = 10% of rent
- Other ongoing costs[cite:1]

### 6.6 Add-Value Potential
Fields:

- General refurbishment
- Full refurbishment
- Extension
- Roof conversion / loft conversion
- Convertible opportunity
- Convert to HMO
- Separate flats
- Add bedroom
- Other value-add strategy[cite:1]

### 6.7 Sell Property – Development Opportunity
Additional fields:

- Cost of development
- Builder in place (Yes / No)
- Quote available (Yes / No)
- Estimate amount
- Legal costs
- Deposit to buy
- Stamp duty
- Finder fees[cite:1]

### 6.8 Sell Property – Refurb Opportunity
Additional fields:

- Cost to refurbish
- Potential add-value
- Summary[cite:1]

### 6.9 Sell Property – Commercial
Commercial type must support:

- Hotel
- Shop
- Mixed use[cite:1]

## 7. Portfolio Listing
Portfolio should be available for users submitting multiple assets together.[cite:1]

Fields:

- Portfolio title / name
- Number of properties
- Portfolio summary
- Asset list or grouped property records
- Additional notes fields if required[cite:1]

## 8. Data Sources and Integrations
The module should support the following external data sources where available:

- Google Maps API for address lookup, coordinates, and location validation
- Property data API for postcode-based rent checking, especially for HMO logic
- AirDNA API for SA occupancy and revenue benchmarking[cite:1]

## 9. Financial Data Model
For development clarity, financial fields should be separated into logical groups instead of mixing them in one flat payload.[cite:1]

### 9.1 Purchase Costs
Examples:

- Deposit
- Stamp duty
- Finder fee
- Legal fees
- Acquisition fees[cite:1]

### 9.2 Operating Costs
Examples:

- Rent to landlord
- Utilities
- Council tax
- Booking fees
- Management fees
- Maintenance
- Cleaning
- Other recurring costs[cite:1]

### 9.3 Income Fields
Examples:

- Room rent
- Monthly rent
- Rent per night
- Occupancy-based income
- Potential income[cite:1]

### 9.4 Value-Add / Development Costs
Examples:

- Refurbishment cost
- Development cost
- Builder quote
- Extension cost
- Conversion cost[cite:1]

### 9.5 Calculated Fields
Examples:

- Potential monthly income
- Potential yearly income
- Potential profit
- Break-even occupancy
- Money needed in
- Monthly mortgage cost
- Management cost
- Total cost to buy
- Total development cost[cite:1]

## 10. Agency and Network Fields
Because the platform is built for inter-agency and sourcing collaboration, the following fields should be supported where relevant:

- Agency details
- Sourcer details
- Finder fee
- Co-source allowed (Yes / No)
- Internal notes
- External-facing notes[cite:1]

## 11. UX / Front-End Requirements
Recommended implementation requirements:

- Multi-step form or clearly separated accordion sections
- Dynamic conditional rendering by category and strategy
- Repeatable groups for HMO rooms and portfolio assets
- Inline calculators for income, cost, and profit outputs
- Summary panel visible before submission
- Support for draft save status if product roadmap allows
- Strong validation for numeric fields, percentages, and required deal inputs[cite:1]

## 12. Back-End / Data Requirements
Recommended technical requirements:

- Shared base property schema
- Strategy-specific child schemas or JSON sections
- Calculation service layer for financial outputs
- API integration layer for Google Maps, property data, and AirDNA
- Asset/media storage for photos and videos
- Searchable structured fields for filtering by strategy, postcode, ROI profile, and status[cite:1]

## 13. Suggested Data Structure
A practical implementation model would contain:

- `listingCategory`
- `investmentStrategy`
- `address`
- `propertyDetails`
- `statusDetails`
- `financialInputs`
- `financialOutputs`
- `agencyDetails`
- `media`
- `strategySpecificData`
- `apiEnrichmentData`
- `summary`[cite:1]

## 14. Minimum Deliverable for V1
For an initial production version, the module should at minimum support:

- Base property information
- Rent to Rent HMO
- Rent to Rent SA
- Sell Property
- Lease Option
- Agency details
- Financial calculations
- API-ready address structure
- Media upload[cite:1]

## 15. Acceptance Criteria
The module should be considered functionally complete when:

- A user can create a listing from one unified “New Property” entry point.[cite:1]
- Shared property data is entered once and reused across listing strategies.[cite:1]
- Dynamic sections appear correctly based on selected category and strategy.[cite:1]
- HMO room-level data can be added in repeatable form groups.[cite:1]
- SA profitability outputs can be calculated from occupancy and nightly rate inputs.[cite:1]
- Sell Property flows can capture acquisition, finance, and add-value data.[cite:1]
- Agency / co-sourcing data can be attached to listings.[cite:1]
- The submitted record is structured enough for filtering, analysis, and internal sharing.[cite:1]
