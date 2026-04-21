-- AlterTable
ALTER TABLE "AiRequestLog" ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "model" TEXT;
