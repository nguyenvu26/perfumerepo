/*
  Warnings:

  - The primary key for the `StoreStock` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[storeId,variantId]` on the table `StoreStock` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `StoreStock` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "WarehouseType" AS ENUM ('CENTRAL', 'STORE', 'DEFECTIVE');

-- CreateEnum
CREATE TYPE "POStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StocktakeStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "StoreStock" DROP CONSTRAINT "StoreStock_storeId_fkey";

-- DropForeignKey
ALTER TABLE "StoreStock" DROP CONSTRAINT "StoreStock_variantId_fkey";

-- DropIndex
DROP INDEX "StoreStock_variantId_idx";

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "type" "WarehouseType" NOT NULL DEFAULT 'STORE';

-- AlterTable
ALTER TABLE "StoreStock" DROP CONSTRAINT "StoreStock_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "StoreStock_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "onHand" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "available" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "supplierId" TEXT,
    "supplierName" TEXT,
    "status" "POStatus" NOT NULL DEFAULT 'DRAFT',
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "warehouseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferOrder" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "fromStoreId" TEXT NOT NULL,
    "toStoreId" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "TransferOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferOrderItem" (
    "id" TEXT NOT NULL,
    "transferOrderId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "TransferOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stocktake" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "status" "StocktakeStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Stocktake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StocktakeItem" (
    "id" TEXT NOT NULL,
    "stocktakeId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "systemQty" INTEGER NOT NULL DEFAULT 0,
    "countedQty" INTEGER,
    "variance" INTEGER,
    "reason" TEXT,

    CONSTRAINT "StocktakeItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Inventory_variantId_idx" ON "Inventory"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_warehouseId_variantId_key" ON "Inventory"("warehouseId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_code_key" ON "PurchaseOrder"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TransferOrder_code_key" ON "TransferOrder"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Stocktake_code_key" ON "Stocktake"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StoreStock_storeId_variantId_key" ON "StoreStock"("storeId", "variantId");

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferOrder" ADD CONSTRAINT "TransferOrder_fromStoreId_fkey" FOREIGN KEY ("fromStoreId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferOrder" ADD CONSTRAINT "TransferOrder_toStoreId_fkey" FOREIGN KEY ("toStoreId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferOrderItem" ADD CONSTRAINT "TransferOrderItem_transferOrderId_fkey" FOREIGN KEY ("transferOrderId") REFERENCES "TransferOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferOrderItem" ADD CONSTRAINT "TransferOrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stocktake" ADD CONSTRAINT "Stocktake_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StocktakeItem" ADD CONSTRAINT "StocktakeItem_stocktakeId_fkey" FOREIGN KEY ("stocktakeId") REFERENCES "Stocktake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StocktakeItem" ADD CONSTRAINT "StocktakeItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreStock" ADD CONSTRAINT "StoreStock_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreStock" ADD CONSTRAINT "StoreStock_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
