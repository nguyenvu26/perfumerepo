/*
  Warnings:

  - You are about to drop the column `campaignId` on the `AppliedPromotion` table. All the data in the column will be lost.
  - You are about to drop the column `promotionCode` on the `AppliedPromotion` table. All the data in the column will be lost.
  - You are about to drop the column `campaignId` on the `PromotionCode` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `PromotionCode` table. All the data in the column will be lost.
  - You are about to drop the column `maxUsage` on the `PromotionCode` table. All the data in the column will be lost.
  - You are about to drop the `LoyaltyProgram` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LoyaltyTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PaymentEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductEmbedding` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PromotionCampaign` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PromotionProduct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PromotionRule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShipmentHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StockMovement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserLoyaltyAccount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserRole` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `promotionCodeId` to the `AppliedPromotion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discountType` to the `PromotionCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endsAt` to the `PromotionCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startsAt` to the `PromotionCode` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRoleEnum" AS ENUM ('CUSTOMER', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "PromotionDiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- DropForeignKey
ALTER TABLE "AppliedPromotion" DROP CONSTRAINT "AppliedPromotion_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "LoyaltyTransaction" DROP CONSTRAINT "LoyaltyTransaction_accountId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentEvent" DROP CONSTRAINT "PaymentEvent_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "ProductEmbedding" DROP CONSTRAINT "ProductEmbedding_productId_fkey";

-- DropForeignKey
ALTER TABLE "PromotionCode" DROP CONSTRAINT "PromotionCode_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "PromotionProduct" DROP CONSTRAINT "PromotionProduct_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "PromotionProduct" DROP CONSTRAINT "PromotionProduct_productId_fkey";

-- DropForeignKey
ALTER TABLE "PromotionRule" DROP CONSTRAINT "PromotionRule_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "ShipmentHistory" DROP CONSTRAINT "ShipmentHistory_shipmentId_fkey";

-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_inventoryId_fkey";

-- DropForeignKey
ALTER TABLE "UserLoyaltyAccount" DROP CONSTRAINT "UserLoyaltyAccount_programId_fkey";

-- DropForeignKey
ALTER TABLE "UserLoyaltyAccount" DROP CONSTRAINT "UserLoyaltyAccount_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserProfile" DROP CONSTRAINT "UserProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_roleId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_userId_fkey";

-- AlterTable
ALTER TABLE "AppliedPromotion" DROP COLUMN "campaignId",
DROP COLUMN "promotionCode",
ADD COLUMN     "promotionCodeId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "PromotionCode" DROP COLUMN "campaignId",
DROP COLUMN "expiresAt",
DROP COLUMN "maxUsage",
ADD COLUMN     "amountOff" INTEGER,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "discountType" "PromotionDiscountType" NOT NULL,
ADD COLUMN     "endsAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "minOrderValue" INTEGER,
ADD COLUMN     "percentageOff" INTEGER,
ADD COLUMN     "startsAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "usageLimit" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "budgetMax" INTEGER,
ADD COLUMN     "budgetMin" INTEGER,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "role" "UserRoleEnum" NOT NULL DEFAULT 'CUSTOMER';

-- DropTable
DROP TABLE "LoyaltyProgram";

-- DropTable
DROP TABLE "LoyaltyTransaction";

-- DropTable
DROP TABLE "PaymentEvent";

-- DropTable
DROP TABLE "ProductEmbedding";

-- DropTable
DROP TABLE "PromotionCampaign";

-- DropTable
DROP TABLE "PromotionProduct";

-- DropTable
DROP TABLE "PromotionRule";

-- DropTable
DROP TABLE "Role";

-- DropTable
DROP TABLE "ShipmentHistory";

-- DropTable
DROP TABLE "StockMovement";

-- DropTable
DROP TABLE "UserLoyaltyAccount";

-- DropTable
DROP TABLE "UserProfile";

-- DropTable
DROP TABLE "UserRole";

-- DropEnum
DROP TYPE "PromotionType";

-- DropEnum
DROP TYPE "StockMovementType";

-- AddForeignKey
ALTER TABLE "AppliedPromotion" ADD CONSTRAINT "AppliedPromotion_promotionCodeId_fkey" FOREIGN KEY ("promotionCodeId") REFERENCES "PromotionCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
