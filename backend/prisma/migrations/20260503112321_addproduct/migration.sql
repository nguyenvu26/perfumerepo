-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "ingredients" TEXT,
ADD COLUMN     "mainAccords" TEXT[],
ADD COLUMN     "occasions" TEXT[],
ADD COLUMN     "seasons" TEXT[],
ADD COLUMN     "sillage" TEXT,
ADD COLUMN     "styles" TEXT[],
ADD COLUMN     "targetAge" TEXT,
ADD COLUMN     "timeOfDay" TEXT[];
