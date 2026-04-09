/*
  Warnings:

  - The primary key for the `Inventory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `storeId` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `storeId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the `Store` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_storeId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_storeId_fkey";

-- DropIndex
DROP INDEX "Inventory_storeId_productId_key";

-- AlterTable
ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_pkey",
DROP COLUMN "id",
DROP COLUMN "storeId",
ADD CONSTRAINT "Inventory_pkey" PRIMARY KEY ("productId");

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "storeId";

-- DropTable
DROP TABLE "Store";
