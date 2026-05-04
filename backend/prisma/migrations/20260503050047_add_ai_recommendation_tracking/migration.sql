-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "aiRecommendationRef" TEXT,
ADD COLUMN     "isAiRecommended" BOOLEAN NOT NULL DEFAULT false;
