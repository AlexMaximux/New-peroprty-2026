-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'AGENCY', 'USER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "AgencyVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ListingCategory" AS ENUM ('RENT_TO_RENT', 'LEASE_OPTION', 'SELL_PROPERTY', 'PORTFOLIO', 'COMMERCIAL', 'DEVELOPMENT_OPPORTUNITY', 'REFURB_OPPORTUNITY');

-- CreateEnum
CREATE TYPE "ListingStrategy" AS ENUM ('HMO', 'SA', 'SINGLE_LET', 'HIGH_ROI', 'CASH_PURCHASE', 'COMMERCIAL', 'MIXED_USE', 'HOTEL', 'SHOP', 'FLAT_CONVERSION', 'ADD_BEDROOM', 'EXTENSION', 'LOFT_CONVERSION');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RESERVED', 'SOLD', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('TERRACED', 'FLAT', 'DETACHED', 'SEMI_DETACHED', 'OTHER');

-- CreateEnum
CREATE TYPE "ListingMediaKind" AS ENUM ('PHOTO', 'VIDEO');

-- CreateEnum
CREATE TYPE "FurnishedStatus" AS ENUM ('UNFURNISHED', 'FURNISHED', 'SEMI_FURNISHED');

-- CreateEnum
CREATE TYPE "RefurbQuoteType" AS ENUM ('QUOTED', 'ESTIMATED', 'NOT_QUOTED');

-- CreateEnum
CREATE TYPE "HmoRoomType" AS ENUM ('DOUBLE_EN_SUITE', 'DOUBLE_SHARED', 'SINGLE_EN_SUITE', 'SINGLE_SHARED', 'OTHER');

-- CreateEnum
CREATE TYPE "ReferenceRequirement" AS ENUM ('EASY', 'FULL', 'LTD', 'OTHER');

-- CreateEnum
CREATE TYPE "OwnershipType" AS ENUM ('FREEHOLD', 'LEASEHOLD');

-- CreateEnum
CREATE TYPE "Nation" AS ENUM ('ENGLAND', 'WALES', 'SCOTLAND', 'MANUAL');

-- CreateEnum
CREATE TYPE "RegionGroup" AS ENUM ('NORTH', 'SOUTH');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "display_name" TEXT NOT NULL,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "hashed_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "parent_token_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "company_number" TEXT,
    "address" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "website" TEXT,
    "verification_status" "AgencyVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "reviewed_by_admin_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agency_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_documents" (
    "id" TEXT NOT NULL,
    "agency_profile_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agency_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "agency_profile_id" TEXT NOT NULL,
    "category" "ListingCategory" NOT NULL,
    "strategy" "ListingStrategy" NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "property_type" "PropertyType",
    "property_type_other" TEXT,
    "internal_ref" TEXT,
    "address_line_1" TEXT NOT NULL,
    "address_line_2" TEXT,
    "city" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "building_number" TEXT,
    "region" TEXT,
    "nation" "Nation",
    "region_group" "RegionGroup",
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "floor_area" INTEGER,
    "has_living_room" BOOLEAN,
    "has_garden" BOOLEAN,
    "garden_notes" TEXT,
    "parking" TEXT,
    "furnished_status" "FurnishedStatus",
    "furnishing_quality" TEXT,
    "furnishing_notes" TEXT,
    "is_vacant" BOOLEAN,
    "is_tenanted" BOOLEAN,
    "is_licensed" BOOLEAN,
    "needs_refurb" BOOLEAN,
    "refurb_quote_type" "RefurbQuoteType",
    "refurb_cost_pence" INTEGER,
    "asking_price_pence" INTEGER,
    "market_value_pence" INTEGER,
    "estimated_value_pence" INTEGER,
    "estimated_roi" DECIMAL(65,30),
    "strategy_specific_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_media" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "kind" "ListingMediaKind" NOT NULL,
    "file_key" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hmo_rooms" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "room_type" "HmoRoomType" NOT NULL,
    "monthly_rent_pence" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hmo_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_assets" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "asset_type" TEXT,
    "value_pence" INTEGER,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favourites" (
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favourites_pkey" PRIMARY KEY ("user_id","listing_id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "buyer_user_id" TEXT NOT NULL,
    "agency_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_user_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_hashed_token_key" ON "refresh_tokens"("hashed_token");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_parent_token_id_key" ON "refresh_tokens"("parent_token_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "agency_profiles_user_id_key" ON "agency_profiles"("user_id");

-- CreateIndex
CREATE INDEX "agency_documents_agency_profile_id_idx" ON "agency_documents"("agency_profile_id");

-- CreateIndex
CREATE INDEX "listings_category_idx" ON "listings"("category");

-- CreateIndex
CREATE INDEX "listings_strategy_idx" ON "listings"("strategy");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "listings"("status");

-- CreateIndex
CREATE INDEX "listings_property_type_idx" ON "listings"("property_type");

-- CreateIndex
CREATE INDEX "listings_needs_refurb_idx" ON "listings"("needs_refurb");

-- CreateIndex
CREATE INDEX "listings_postcode_idx" ON "listings"("postcode");

-- CreateIndex
CREATE INDEX "listings_region_idx" ON "listings"("region");

-- CreateIndex
CREATE INDEX "listings_asking_price_pence_idx" ON "listings"("asking_price_pence");

-- CreateIndex
CREATE INDEX "listings_estimated_roi_idx" ON "listings"("estimated_roi");

-- CreateIndex
CREATE INDEX "listings_agency_profile_id_idx" ON "listings"("agency_profile_id");

-- CreateIndex
CREATE INDEX "listing_media_listing_id_idx" ON "listing_media"("listing_id");

-- CreateIndex
CREATE INDEX "hmo_rooms_listing_id_idx" ON "hmo_rooms"("listing_id");

-- CreateIndex
CREATE INDEX "portfolio_assets_listing_id_idx" ON "portfolio_assets"("listing_id");

-- CreateIndex
CREATE INDEX "conversations_buyer_user_id_idx" ON "conversations"("buyer_user_id");

-- CreateIndex
CREATE INDEX "conversations_agency_user_id_idx" ON "conversations"("agency_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_listing_id_buyer_user_id_key" ON "conversations"("listing_id", "buyer_user_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "messages_sender_user_id_idx" ON "messages"("sender_user_id");

-- CreateIndex
CREATE INDEX "admin_audit_logs_admin_user_id_idx" ON "admin_audit_logs"("admin_user_id");

-- CreateIndex
CREATE INDEX "admin_audit_logs_target_type_target_id_idx" ON "admin_audit_logs"("target_type", "target_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_profiles" ADD CONSTRAINT "agency_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_profiles" ADD CONSTRAINT "agency_profiles_reviewed_by_admin_id_fkey" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_documents" ADD CONSTRAINT "agency_documents_agency_profile_id_fkey" FOREIGN KEY ("agency_profile_id") REFERENCES "agency_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_agency_profile_id_fkey" FOREIGN KEY ("agency_profile_id") REFERENCES "agency_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_media" ADD CONSTRAINT "listing_media_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hmo_rooms" ADD CONSTRAINT "hmo_rooms_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_assets" ADD CONSTRAINT "portfolio_assets_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favourites" ADD CONSTRAINT "favourites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favourites" ADD CONSTRAINT "favourites_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_buyer_user_id_fkey" FOREIGN KEY ("buyer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
