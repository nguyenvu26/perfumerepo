/*
  Warnings:

  - The `recommendation` column on the `QuizResult` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "QuizResult" DROP CONSTRAINT "QuizResult_userId_fkey";

-- AlterTable
ALTER TABLE "QuizResult" ADD COLUMN     "analysis" TEXT,
ALTER COLUMN "userId" DROP NOT NULL,
DROP COLUMN "recommendation",
ADD COLUMN     "recommendation" JSONB;

-- AddForeignKey
ALTER TABLE "QuizResult" ADD CONSTRAINT "QuizResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
