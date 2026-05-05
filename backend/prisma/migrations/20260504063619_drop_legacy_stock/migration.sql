/*
  Warnings:

  - You are about to drop the column `stock` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the `StoreStock` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "StoreStock" DROP CONSTRAINT "StoreStock_storeId_fkey";

-- DropForeignKey
ALTER TABLE "StoreStock" DROP CONSTRAINT "StoreStock_variantId_fkey";

-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "stock";

-- DropTable
DROP TABLE "StoreStock";
