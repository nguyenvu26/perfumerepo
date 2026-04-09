-- CreateEnum
CREATE TYPE "UserPromotionStatus" AS ENUM ('UNUSED', 'USED', 'EXPIRED');

-- AlterTable
ALTER TABLE "AppliedPromotion" ADD COLUMN     "userPromotionId" TEXT;

-- AlterTable
ALTER TABLE "PromotionCode" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pointsCost" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "UserPromotion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "status" "UserPromotionStatus" NOT NULL DEFAULT 'UNUSED',
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "UserPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPromotion_userId_promotionId_key" ON "UserPromotion"("userId", "promotionId");

-- AddForeignKey
ALTER TABLE "UserPromotion" ADD CONSTRAINT "UserPromotion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPromotion" ADD CONSTRAINT "UserPromotion_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "PromotionCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppliedPromotion" ADD CONSTRAINT "AppliedPromotion_userPromotionId_fkey" FOREIGN KEY ("userPromotionId") REFERENCES "UserPromotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
