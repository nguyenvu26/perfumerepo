/*
  Warnings:

  - The values [FIXED] on the enum `PromotionDiscountType` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `AppliedPromotion` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `productId` on the `CartItem` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - The primary key for the `PromotionCode` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `amountOff` on the `PromotionCode` table. All the data in the column will be lost.
  - You are about to drop the column `endsAt` on the `PromotionCode` table. All the data in the column will be lost.
  - You are about to drop the column `minOrderValue` on the `PromotionCode` table. All the data in the column will be lost.
  - You are about to drop the column `percentageOff` on the `PromotionCode` table. All the data in the column will be lost.
  - You are about to drop the column `startsAt` on the `PromotionCode` table. All the data in the column will be lost.
  - You are about to drop the `Inventory` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[cartId,variantId]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `variantId` to the `CartItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variantId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discountValue` to the `PromotionCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `PromotionCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `PromotionCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PromotionCode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PromotionDiscountType_new" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');
ALTER TABLE "PromotionCode" ALTER COLUMN "discountType" TYPE "PromotionDiscountType_new" USING ("discountType"::text::"PromotionDiscountType_new");
ALTER TYPE "PromotionDiscountType" RENAME TO "PromotionDiscountType_old";
ALTER TYPE "PromotionDiscountType_new" RENAME TO "PromotionDiscountType";
DROP TYPE "public"."PromotionDiscountType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "AppliedPromotion" DROP CONSTRAINT "AppliedPromotion_promotionCodeId_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_productId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";

-- DropIndex
DROP INDEX "CartItem_cartId_productId_key";

-- AlterTable
ALTER TABLE "AppliedPromotion" DROP CONSTRAINT "AppliedPromotion_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "promotionCodeId" SET DATA TYPE TEXT,
ADD CONSTRAINT "AppliedPromotion_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "AppliedPromotion_id_seq";

-- AlterTable
ALTER TABLE "CartItem" DROP COLUMN "productId",
ADD COLUMN     "variantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "productId",
ADD COLUMN     "variantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "currency",
DROP COLUMN "price";

-- AlterTable
ALTER TABLE "PromotionCode" DROP CONSTRAINT "PromotionCode_pkey",
DROP COLUMN "amountOff",
DROP COLUMN "endsAt",
DROP COLUMN "minOrderValue",
DROP COLUMN "percentageOff",
DROP COLUMN "startsAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "discountValue" INTEGER NOT NULL,
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "maxDiscount" INTEGER,
ADD COLUMN     "minOrderAmount" INTEGER,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "PromotionCode_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "PromotionCode_id_seq";

-- DropTable
DROP TABLE "Inventory";

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "price" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_variantId_key" ON "CartItem"("cartId", "variantId");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppliedPromotion" ADD CONSTRAINT "AppliedPromotion_promotionCodeId_fkey" FOREIGN KEY ("promotionCodeId") REFERENCES "PromotionCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
