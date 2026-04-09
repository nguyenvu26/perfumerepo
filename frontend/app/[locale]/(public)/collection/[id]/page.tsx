import { ChevronRight } from 'lucide-react';
import { Link } from '@/lib/i18n';
import { productService } from '@/services/product.service';
import { getTranslations } from 'next-intl/server';
import ProductDetail from '@/components/product/product-detail';
import { notFound } from 'next/navigation';

export default async function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tCommon = await getTranslations('common');

  let product;
  try {
    product = await productService.getById(id);
    if (!product) return notFound();
  } catch {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-background pt-32 px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        <nav className="flex items-center gap-4 text-[10px] uppercase tracking-widest font-heading text-muted-foreground mb-12">
          <Link href="/" className="hover:text-gold transition-colors">{tCommon('odyssey')}</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/collection" className="hover:text-gold transition-colors">{tCommon('catalog')}</Link>
          <ChevronRight className="w-3 h-3" />
          {product.brand && (
            <>
              <span className="text-muted-foreground">{product.brand.name}</span>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
          <span className="text-gold">{product.name}</span>
        </nav>

        <ProductDetail product={product} />
      </div>
    </div>
  );
}
