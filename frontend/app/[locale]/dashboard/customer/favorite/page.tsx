'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Heart, Loader2 } from 'lucide-react';
import { Link } from '@/lib/i18n';
import { AuthGuard } from '@/components/auth/auth-guard';
import { favoriteService, type FavoriteItem } from '@/services/favorite.service';
import { useTranslations, useFormatter } from 'next-intl';

export default function CustomerFavoritePage() {
  const t = useTranslations('dashboard.customer.favorite');
  const format = useFormatter();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const data = await favoriteService.getFavorites();
        setFavorites(data);
      } finally {
        setLoading(false);
      }
    };

    void loadFavorites();
    window.addEventListener(favoriteService.eventName, loadFavorites);
    return () => window.removeEventListener(favoriteService.eventName, loadFavorites);
  }, []);

  const handleRemoveFavorite = async (productId: string) => {
    await favoriteService.removeProduct(productId);
    const data = await favoriteService.getFavorites();
    setFavorites(data);
  };

  return (
    <AuthGuard allowedRoles={['customer']}>
      <main className="p-4 sm:p-8 max-w-7xl mx-auto">
        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-5xl font-heading gold-gradient uppercase tracking-tighter mb-2 transition-colors">
            {t('title')}
          </h1>
          <p className="text-muted-foreground font-body text-[10px] md:text-sm uppercase tracking-widest">
            {t('subtitle')}
          </p>
        </header>

        {loading ? (
          <div className="flex items-center gap-3 text-muted-foreground py-20 justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gold" />
            <p className="text-[10px] uppercase font-bold tracking-widest">{t('loading')}</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="glass rounded-[2.5rem] md:rounded-[3rem] border-border p-12 md:p-20 text-center space-y-6">
            <Heart className="w-12 h-12 md:w-16 md:h-16 mx-auto text-muted-foreground/30" strokeWidth={1} />
            <div className="space-y-2 px-4">
                <h2 className="font-heading text-lg md:text-2xl uppercase tracking-widest leading-snug">{t('empty_title')}</h2>
                <p className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t('empty_subtitle') || 'Hãy lưu giữ những mùi hương bạn yêu thích tại đây.'}</p>
            </div>
            <Link
              href="/collection"
              className="inline-flex mt-4 px-10 py-4 rounded-full bg-gold text-primary-foreground text-[10px] font-bold tracking-widest uppercase shadow-xl shadow-gold/20 hover:scale-105 transition-transform"
            >
              {t('view_collection')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {favorites.map((item) => (
              <div key={item.id} className="glass rounded-[2rem] md:rounded-[2.5rem] border-border overflow-hidden group hover:border-gold/30 transition-all">
                <div className="aspect-[4/5] bg-secondary/10 relative overflow-hidden">
                  {item.imageUrl ? (
                    <Image 
                        src={item.imageUrl} 
                        alt={item.name} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-1000" 
                    />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-10">
                          <Heart size={64} />
                      </div>
                  )}
                  <div className="absolute top-4 right-4 z-10">
                      <button
                        onClick={() => void handleRemoveFavorite(item.id)}
                        className="w-10 h-10 rounded-full glass border-white/10 flex items-center justify-center text-white/40 hover:text-red-500 hover:border-red-500/50 transition-all shadow-xl"
                        title={t('remove')}
                      >
                        <Heart size={16} fill="currentColor" />
                      </button>
                  </div>
                </div>
                <div className="p-5 md:p-6 space-y-4 md:space-y-5">
                  <div className="space-y-1">
                    <p className="text-[8px] md:text-[9px] text-gold uppercase tracking-[0.3em] font-bold">
                      {item.brandName || t('brand_fallback')}
                    </p>
                    <h3 className="font-heading text-lg md:text-xl uppercase tracking-wider leading-tight truncate">{item.name}</h3>
                    {item.variantName ? (
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium italic">
                        {t('size_label', { name: item.variantName })}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-base md:text-lg font-heading text-foreground">
                    {typeof item.price === 'number'
                      ? format.number(item.price, { style: 'currency', currency: 'VND' })
                      : ''}
                  </p>
                  <div className="flex flex-col gap-2 pt-2">
                    <Link
                      href={`/products/${item.id}`}
                      className="flex-1 bg-gold text-primary-foreground py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-center shadow-lg shadow-gold/20 hover:scale-[1.02] active:scale-95 transition-all min-h-[44px] flex items-center justify-center"
                    >
                      {t('details')}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
