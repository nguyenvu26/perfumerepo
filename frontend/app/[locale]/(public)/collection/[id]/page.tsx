import { ChevronRight, ShoppingBag, Sparkles } from 'lucide-react';
import { Link } from '@/lib/i18n';
import { productService } from '@/services/product.service';
import { getTranslations, getFormatter } from 'next-intl/server';
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

  const format = await getFormatter();
  const tFeatured = await getTranslations('featured');

  let similarProducts: any[] = [];
  try {
     const filter = product.brandId ? { brandId: product.brandId, take: 4 } : { take: 4 };
     const res = await productService.list(filter);
     similarProducts = res.items.filter(p => p.id !== product.id).slice(0, 3);
  } catch (e) {
  }

  const formatCurrency = (amount: number) => {
      return format.number(amount, {
          style: 'currency',
          currency: tFeatured('currency_code') || 'VND',
          maximumFractionDigits: 0
      });
  };

  const getMinPrice = (p: any) => {
      const prices = (p.variants ?? []).map((v: any) => v.price);
      return prices.length ? Math.min(...prices) : null;
  };

  const genderLabel = (g: string | null | undefined) => {
      const v = (g || '').toUpperCase();
      if (v === 'MALE' || v === 'MEN') return 'Nam';
      if (v === 'FEMALE' || v === 'WOMEN') return 'Nữ';
      return 'Unisex';
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f6f1_0%,#ffffff_34%,#fbfaf7_100%)] px-6 pb-20 pt-28 transition-colors dark:bg-[linear-gradient(180deg,#09090b_0%,#0c0c10_36%,#09090b_100%)] md:pt-32">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-10 flex flex-wrap items-center gap-3 text-sm text-muted-foreground md:mb-12">
          <Link href="/" className="transition-colors hover:text-gold">{tCommon('odyssey')}</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/collection" className="transition-colors hover:text-gold">{tCommon('catalog')}</Link>
          <ChevronRight className="h-4 w-4" />
          {product.brand && (
            <>
              <Link
                href={`/collection?brandId=${product.brand.id}&brand=${encodeURIComponent(product.brand.name)}`}
                className="transition-colors hover:text-gold"
              >
                {product.brand.name}
              </Link>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
          <span className="font-medium text-gold">{product.name}</span>
        </nav>

        <ProductDetail product={product} />

        {similarProducts.length > 0 && (
          <div className="mt-24 pt-16 border-t border-border/50">
            <h2 className="text-2xl font-heading text-foreground mb-8 uppercase tracking-widest text-center">
              Các sản phẩm khác từ {product.brand?.name || 'thương hiệu này'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {similarProducts.map((p) => {
                const price = getMinPrice(p);
                return (
                  <Link key={p.id} href={`/collection/${p.id}`} className="group block h-full">
                      <div className="bg-background glass rounded-[2.5rem] overflow-hidden hover:border-gold/30 transition-all duration-500 flex flex-col h-full border border-border shadow-sm hover:shadow-xl hover:shadow-gold/5">
                          <div className="relative aspect-[3/4] bg-secondary/10 overflow-hidden shrink-0">
                              {p.images?.[0]?.url ? (
                                  <img
                                      src={p.images[0].url}
                                      alt={p.name}
                                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
                                  />
                              ) : (
                                  <div className="absolute inset-0 flex items-center justify-center text-gold/20">
                                      <ShoppingBag size={48} strokeWidth={0.5} />
                                  </div>
                              )}

                              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="px-4 py-2 rounded-full bg-white/90 dark:bg-black/90 text-foreground text-[8px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                                      {genderLabel(p.gender)}
                                  </span>
                              </div>
                              
                              <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>

                          <div className="p-8 flex flex-col flex-1">
                              <p className="text-[9px] text-gold uppercase tracking-[0.3em] font-black mb-2">
                                  {p.brand?.name ?? '—'}
                              </p>
                              <h3 className="text-base font-heading font-medium text-foreground line-clamp-2 uppercase tracking-wide group-hover:text-gold transition-colors leading-[1.4]">
                                  {p.name}
                              </h3>
                              <div className="mt-auto pt-6 flex items-center justify-between border-t border-border/50">
                                  <p className="text-lg font-serif text-foreground">
                                      {price != null ? formatCurrency(price) : '—'}
                                  </p>
                                  <div className="text-gold transition-transform group-hover:scale-110 group-hover:translate-x-1 duration-300">
                                      <Sparkles size={16} />
                                  </div>
                              </div>
                          </div>
                      </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
