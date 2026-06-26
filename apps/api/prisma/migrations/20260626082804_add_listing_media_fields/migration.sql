-- AlterTable
ALTER TABLE "listing_media" ADD COLUMN     "is_primary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mime_type" TEXT;
