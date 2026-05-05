import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function slugify(text: string) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

function generateBarcode() {
  // Generate a random 13-digit number (EAN-13 style)
  const random9 = Math.floor(Math.random() * 900000000) + 100000000;
  return `893${random9}01`; // 893 is VN prefix, total 13 chars
}

async function main() {
  console.log('Starting SKU and Barcode seeding...');
  
  const variants = await prisma.productVariant.findMany({
    include: {
      product: {
        include: {
          brand: true
        }
      }
    }
  });

  console.log(`Found ${variants.length} variants to update.`);

  let updatedCount = 0;
  for (const v of variants) {
    const brandName = v.product.brand?.name || 'GENERIC';
    const productName = v.product.name;
    const variantName = v.name;
    const concentration = v.product.concentration || '';
    
    // Create SKU: BRAND-PRODUCT-CONCENTRATION-VARIANT (normalized)
    const skuRaw = `${brandName}-${productName}-${concentration}-${variantName}`;
    const sku = slugify(skuRaw).toUpperCase();
    
    // Generate a random barcode if it doesn't have one
    const barcode = v.barcode || generateBarcode();

    try {
      await prisma.productVariant.update({
        where: { id: v.id },
        data: {
          sku: v.sku || sku,
          barcode: barcode
        }
      });
      updatedCount++;
      if (updatedCount % 20 === 0) console.log(`Updated ${updatedCount}/${variants.length}...`);
    } catch (err) {
      console.error(`Failed to update variant ${v.id}:`, err);
    }
  }

  console.log(`Success! Updated ${updatedCount} variants with SKU and Barcode.`);
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
