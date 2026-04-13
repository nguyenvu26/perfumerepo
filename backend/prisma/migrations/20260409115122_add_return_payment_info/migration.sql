-- AlterTable
ALTER TABLE "Refund" ADD COLUMN     "receiptImage" TEXT;

-- AlterTable
ALTER TABLE "ReturnRequest" ADD COLUMN     "paymentInfo" JSONB;
