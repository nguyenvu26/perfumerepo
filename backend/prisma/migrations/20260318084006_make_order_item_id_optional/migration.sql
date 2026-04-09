-- DropIndex
DROP INDEX "Review_orderItemId_key";

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "orderItemId" DROP NOT NULL;
