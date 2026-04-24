import { Breadcrumb } from '@/components/common/breadcrumb';
import { productService } from '@/services/product.service';
import ProductDetail from '@/components/product/product-detail';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    try {
        const product = await productService.getById(id);
        if (!product) return { title: 'Product Not Found' };

        const title = `${product.name} ${product.brand ? `by ${product.brand.name}` : ''} | PerfumeGPT`;
        const description = product.description 
            ? product.description.substring(0, 160) 
            : `Discover ${product.name}, a luxury fragrance available at PerfumeGPT. Explore notes, longevity, and more.`;
            
        const imageUrl = product.images?.[0]?.url || '/og-image.png';

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                images: [{ url: imageUrl }],
                type: 'article',
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [imageUrl],
            },
        };
    } catch {
        return { title: 'PerfumeGPT' };
    }
}

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
        ...(product.category ? [{ label: product.category.name, href: `/collection?category=${encodeURIComponent(product.category.name)}` }] : []),
        ...(product.brand ? [{ label: product.brand.name, href: `/collection?brandId=${product.brand.id}&brand=${encodeURIComponent(product.brand.name)}` }] : []),
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
