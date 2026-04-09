-- CreateEnum
CREATE TYPE "HomepageBlockKey" AS ENUM ('BESTSELLER', 'FEATURED', 'NEW');

-- CreateEnum
CREATE TYPE "HomepageBlockMode" AS ENUM ('AUTO', 'MANUAL');

-- CreateTable
CREATE TABLE "HomeBanner" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "imageUrl" TEXT NOT NULL,
    "imagePublicId" TEXT,
    "href" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeBanner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageBlock" (
    "key" "HomepageBlockKey" NOT NULL,
    "mode" "HomepageBlockMode" NOT NULL DEFAULT 'AUTO',
    "title" TEXT,
    "subtitle" TEXT,
    "limit" INTEGER NOT NULL DEFAULT 8,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageBlock_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "HomepageBlockProduct" (
    "blockKey" "HomepageBlockKey" NOT NULL,
    "productId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "HomepageBlockProduct_pkey" PRIMARY KEY ("blockKey","productId")
);

-- CreateIndex
CREATE INDEX "HomeBanner_isActive_order_idx" ON "HomeBanner"("isActive", "order");

-- CreateIndex
CREATE INDEX "HomepageBlockProduct_blockKey_order_idx" ON "HomepageBlockProduct"("blockKey", "order");

-- CreateIndex
CREATE INDEX "HomepageBlockProduct_productId_idx" ON "HomepageBlockProduct"("productId");

-- AddForeignKey
ALTER TABLE "HomepageBlockProduct" ADD CONSTRAINT "HomepageBlockProduct_blockKey_fkey" FOREIGN KEY ("blockKey") REFERENCES "HomepageBlock"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomepageBlockProduct" ADD CONSTRAINT "HomepageBlockProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
