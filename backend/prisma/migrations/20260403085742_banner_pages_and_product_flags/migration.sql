-- CreateEnum
CREATE TYPE "BannerPageKey" AS ENUM ('HOMEPAGE', 'JOURNAL', 'ABOUT_US');

-- DropIndex
DROP INDEX "HomeBanner_isActive_order_idx";

-- AlterTable
ALTER TABLE "HomeBanner" ADD COLUMN     "pageKey" "BannerPageKey" NOT NULL DEFAULT 'HOMEPAGE';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isBestSeller" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isNew" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "HomeBanner_pageKey_isActive_order_idx" ON "HomeBanner"("pageKey", "isActive", "order");
