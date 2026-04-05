/*
  Warnings:

  - You are about to drop the column `isBestSeller` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isNew` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `HomeBanner` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HomepageBlock` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HomepageBlockProduct` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BannerType" AS ENUM ('HOMEPAGE', 'JOURNAL');

-- DropForeignKey
ALTER TABLE "HomepageBlockProduct" DROP CONSTRAINT "HomepageBlockProduct_blockKey_fkey";

-- DropForeignKey
ALTER TABLE "HomepageBlockProduct" DROP CONSTRAINT "HomepageBlockProduct_productId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "isBestSeller",
DROP COLUMN "isNew",
ADD COLUMN     "isBestseller" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "HomeBanner";

-- DropTable
DROP TABLE "HomepageBlock";

-- DropTable
DROP TABLE "HomepageBlockProduct";

-- DropEnum
DROP TYPE "BannerPageKey";

-- DropEnum
DROP TYPE "HomepageBlockKey";

-- DropEnum
DROP TYPE "HomepageBlockMode";

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "type" "BannerType" NOT NULL DEFAULT 'HOMEPAGE',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);
