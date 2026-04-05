-- AlterTable
ALTER TABLE "Favorite" ADD COLUMN     "variantId" TEXT;

-- CreateIndex
CREATE INDEX "Favorite_variantId_idx" ON "Favorite"("variantId");

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
