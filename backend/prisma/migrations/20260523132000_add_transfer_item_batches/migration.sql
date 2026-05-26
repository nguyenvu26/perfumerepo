-- CreateTable
CREATE TABLE "TransferOrderItemBatch" (
    "id" TEXT NOT NULL,
    "transferOrderItemId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "TransferOrderItemBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransferOrderItemBatch_transferOrderItemId_idx" ON "TransferOrderItemBatch"("transferOrderItemId");

-- CreateIndex
CREATE INDEX "TransferOrderItemBatch_batchId_idx" ON "TransferOrderItemBatch"("batchId");

-- AddForeignKey
ALTER TABLE "TransferOrderItemBatch" ADD CONSTRAINT "TransferOrderItemBatch_transferOrderItemId_fkey" FOREIGN KEY ("transferOrderItemId") REFERENCES "TransferOrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferOrderItemBatch" ADD CONSTRAINT "TransferOrderItemBatch_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "InventoryBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
