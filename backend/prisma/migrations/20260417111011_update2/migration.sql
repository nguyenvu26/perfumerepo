-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "isPosDraft" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "scentAnalysis" TEXT;
