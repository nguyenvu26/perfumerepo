/*
  Warnings:

  - You are about to drop the column `order` on the `Banner` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Banner` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Banner" DROP COLUMN "order",
DROP COLUMN "type";

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- DropEnum
DROP TYPE "BannerType";
