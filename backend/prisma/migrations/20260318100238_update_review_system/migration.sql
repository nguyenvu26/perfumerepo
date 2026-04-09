/*
  Warnings:

  - You are about to drop the column `createdAt` on the `ReviewImage` table. All the data in the column will be lost.
  - You are about to drop the column `publicId` on the `ReviewImage` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ReviewReaction` table. All the data in the column will be lost.
  - You are about to drop the column `resolved` on the `ReviewReport` table. All the data in the column will be lost.
  - You are about to drop the column `resolvedAt` on the `ReviewReport` table. All the data in the column will be lost.
  - The primary key for the `ReviewSummary` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[orderItemId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productId]` on the table `ReviewSummary` will be added. If there are existing duplicate values, this will fail.
  - Made the column `orderItemId` on table `Review` required. This step will fail if there are existing NULL values in that column.
  - The required column `id` was added to the `ReviewSummary` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Made the column `summary` on table `ReviewSummary` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_productId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_userId_fkey";

-- DropForeignKey
ALTER TABLE "ReviewReaction" DROP CONSTRAINT "ReviewReaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "ReviewReport" DROP CONSTRAINT "ReviewReport_userId_fkey";

-- DropForeignKey
ALTER TABLE "ReviewSummary" DROP CONSTRAINT "ReviewSummary_productId_fkey";

-- DropIndex
DROP INDEX "Review_flagged_idx";

-- DropIndex
DROP INDEX "Review_isHidden_idx";

-- DropIndex
DROP INDEX "Review_isPinned_idx";

-- DropIndex
DROP INDEX "Review_productId_idx";

-- DropIndex
DROP INDEX "Review_rating_idx";

-- DropIndex
DROP INDEX "Review_userId_idx";

-- DropIndex
DROP INDEX "ReviewImage_reviewId_idx";

-- DropIndex
DROP INDEX "ReviewReaction_reviewId_idx";

-- DropIndex
DROP INDEX "ReviewReport_resolved_idx";

-- DropIndex
DROP INDEX "ReviewReport_reviewId_idx";

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "orderItemId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ReviewImage" DROP COLUMN "createdAt",
DROP COLUMN "publicId";

-- AlterTable
ALTER TABLE "ReviewReaction" DROP COLUMN "createdAt";

-- AlterTable
ALTER TABLE "ReviewReport" DROP COLUMN "resolved",
DROP COLUMN "resolvedAt";

-- AlterTable
ALTER TABLE "ReviewSummary" DROP CONSTRAINT "ReviewSummary_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ALTER COLUMN "summary" SET NOT NULL,
ADD CONSTRAINT "ReviewSummary_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Review_orderItemId_key" ON "Review"("orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewSummary_productId_key" ON "ReviewSummary"("productId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSummary" ADD CONSTRAINT "ReviewSummary_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
