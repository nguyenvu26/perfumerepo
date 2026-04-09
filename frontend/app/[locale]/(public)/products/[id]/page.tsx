import { ChevronRight } from 'lucide-react';
import { Link } from '@/lib/i18n';
import { productService } from '@/services/product.service';
import ProductDetail from '@/components/product/product-detail';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const t = await getTranslations('common.breadcrumbs');

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
                    <Link href="/" className="hover:text-gold transition-colors">{t('home')}</Link>
                    <ChevronRight className="w-3 h-3" />
                    <Link href="/collection" className="hover:text-gold transition-colors">{t('collection')}</Link>
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
