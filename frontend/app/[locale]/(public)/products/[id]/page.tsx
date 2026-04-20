import { Breadcrumb } from '@/components/common/breadcrumb';
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

    const breadcrumbItems = [
        { label: t('collection'), href: '/collection' },
        ...(product.brand ? [{ label: product.brand.name }] : []),
        { label: product.name, active: true }
    ];

    return (
        <div className="min-h-screen bg-background pt-32 px-6 pb-20">
            <div className="max-w-7xl mx-auto">
                <Breadcrumb items={breadcrumbItems} className="mb-12" />
                
                <ProductDetail product={product} />
            </div>
        </div>
    );
}
