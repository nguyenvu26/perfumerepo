-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "recipientName" TEXT,
ADD COLUMN     "shippingDistrictId" INTEGER,
ADD COLUMN     "shippingFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shippingProvinceId" INTEGER,
ADD COLUMN     "shippingServiceId" INTEGER,
ADD COLUMN     "shippingWardCode" TEXT;

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "ghnOrderCode" TEXT;

-- CreateIndex
CREATE INDEX "Shipment_ghnOrderCode_idx" ON "Shipment"("ghnOrderCode");
