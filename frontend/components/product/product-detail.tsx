'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag, Heart, ShieldCheck, Sparkles, BrainCircuit } from 'lucide-react';
import { type Product, type ProductVariant } from '@/services/product.service';
import { cartService } from '@/services/cart.service';
import { favoriteService } from '@/services/favorite.service';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ReviewList from '../review/review-list';
import ReviewSummaryView from '../review/review-summary';
import StarRating from '../review/star-rating';
import { useTranslations, useFormatter } from 'next-intl';

export default function ProductDetail({ product }: { product: Product }) {
    const t = useTranslations('product_detail');
    const tCommon = useTranslations('common');
    const tFeatured = useTranslations('featured');
    const format = useFormatter();
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
        product.variants?.[0] || null
    );
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) return;

        let mounted = true;
        favoriteService
            .isFavorite(product.id)
            .then((value) => {
                if (mounted) setIsFavorite(value);
            })
            .catch(() => {
                if (mounted) setIsFavorite(false);
            });

        return () => {
            mounted = false;
        };
    }, [isAuthenticated, product.id]);

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        if (!selectedVariant) return;

        setLoading(true);
        setError(null);
        setSuccess(false);
        try {
            await cartService.addItem(selectedVariant.id, 1);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (e: unknown) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (n: number) =>
        format.number(n, {
            style: 'currency',
            currency: tFeatured('currency_code') || 'VND',
            maximumFractionDigits: 0
        });

    const handleToggleFavorite = async () => {
        if (!isAuthenticated) {
            toast.error(t('toast_login_required'));
            router.push('/login');
            return;
        }

        if (favoriteLoading) return;
        if (!selectedVariant && !isFavorite) {
            toast.error(t('toast_select_size'));
            return;
        }

        setFavoriteLoading(true);
        try {
            const nextFavorite = await favoriteService.toggleProduct(product.id, isFavorite, selectedVariant?.id);
            setIsFavorite(nextFavorite);
            if (nextFavorite) {
                toast.success(t('toast_favorite_added'));
            } else {
                toast.success(t('toast_favorite_removed'));
            }
        } catch (e: unknown) {
            toast.error((e as Error).message || t('toast_favorite_error'));
        } finally {
            setFavoriteLoading(false);
        }
    };

    return (
        <div className="space-y-16 lg:space-y-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20">
                {/* Visual Section */}
                <div className="space-y-4 lg:space-y-6">
                    <div className="aspect-[4/5] glass rounded-[2.5rem] lg:rounded-[3rem] border-border overflow-hidden relative group shadow-2xl">
                        {product.images?.length ? (
                            <img
                                src={product.images[activeImageIndex]?.url || product.images[0].url}
                                alt={product.name}
                                className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full bg-secondary/20 flex items-center justify-center font-heading text-gold/30 uppercase tracking-[0.5em] text-[10px]">
                                {t('visual_data_unavailable')}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-linear-to-tr from-gold/10 via-transparent to-transparent opacity-0 lg:group-hover:opacity-100 transition-opacity duration-1000" />
                        <div className="absolute inset-x-0 bottom-0 p-8 lg:p-12 text-center bg-linear-to-t from-background/80 to-transparent backdrop-blur-[2px]">
                            <span className="text-gold font-heading tracking-[0.5em] uppercase text-[9px] lg:text-[10px] animate-pulse inline-flex items-center gap-3">
                                <Sparkles className="w-3 h-3 lg:w-4 lg:h-4" /> {t('neural_scanning_active')}
                            </span>
                        </div>
                    </div>
                    {/* Gallery Thumbnails */}
                    <div className="flex gap-3 lg:gap-4 overflow-x-auto pb-4 lg:pb-6 scrollbar-thin scrollbar-thumb-gold/20 scrollbar-track-transparent snap-x snap-mandatory px-1">
                        {product.images?.map((img, idx) => (
                            <button
                                key={img.id}
                                onClick={() => setActiveImageIndex(idx)}
                                className={`flex-shrink-0 w-20 sm:w-24 lg:w-28 aspect-square glass rounded-xl lg:rounded-2xl border transition-all duration-500 overflow-hidden snap-center relative group/thumb ${activeImageIndex === idx ? 'border-gold shadow-lg shadow-gold/10' : 'border-border/50 hover:border-gold/30'}`}
                            >
                                <img
                                    src={img.url}
                                    alt=""
                                    className={`w-full h-full object-cover transition-transform duration-700 ${activeImageIndex === idx ? 'scale-110' : 'group-hover/thumb:scale-110'}`}
                                />
                                {activeImageIndex === idx && (
                                    <div className="absolute inset-0 bg-gold/5 pointer-events-none" />
                                )}
                            </button>
                        ))}
                    </div>
                    {/* Product Description */}
                    <div className="space-y-4 px-2 lg:px-0">
                        <p className="text-sm lg:text-base text-muted-foreground font-body leading-relaxed max-w-xl">
                            {product.description || t('fallback_description')}
                        </p>
                    </div>
                </div>

                {/* Intellectual Section */}
                <div className="flex flex-col px-2 lg:px-0">
                    <div className="space-y-2 mb-6 lg:mb-8">
                        <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-full glass border-gold/20 text-gold text-[7px] lg:text-[8px] uppercase tracking-widest font-bold">
                                {product.brand?.name || t('elite_series')}
                            </span>
                            <span className="text-[9px] lg:text-[10px] text-muted-foreground uppercase tracking-widest font-heading">
                                {t('archived_hash')}{product.slug.toUpperCase().slice(0, 8)}
                            </span>
                        </div>
                        <h1 className="text-4xl lg:text-7xl font-heading text-foreground uppercase tracking-tighter leading-none mb-2">
                            {product.name}
                        </h1>
                        <div className="flex items-center gap-2 mb-4">
                            <StarRating rating={4.5} readOnly size={12} />
                            <span className="text-[9px] lg:text-[10px] text-muted-foreground uppercase tracking-widest">{t('rating_label', { rating: 4.5 })}</span>
                        </div>
                        <p className="text-2xl lg:text-3xl font-heading text-gold">
                            {selectedVariant ? formatCurrency(selectedVariant.price) : t('select_size')}
                        </p>
                    </div>

                    <div className="space-y-8 mb-10 lg:mb-12">
                        <div className="space-y-4 lg:space-y-6">
                            <h3 className="text-[9px] lg:text-[10px] uppercase tracking-[0.3em] font-heading text-foreground border-b border-border/50 pb-3 lg:pb-4">
                                {t('select_olfactory_volume')}
                            </h3>
                            <div className="flex flex-wrap gap-3 lg:gap-4">
                                {product.variants?.map((v) => (
                                    <button
                                        key={v.id}
                                        onClick={() => setSelectedVariant(v)}
                                        className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl border transition-all flex flex-col items-center min-w-[70px] lg:min-w-[80px] ${selectedVariant?.id === v.id
                                            ? 'bg-gold/10 border-gold text-gold scale-105'
                                            : 'glass border-border text-muted-foreground hover:border-gold/30'
                                            }`}
                                    >
                                        <span className="text-[9px] lg:text-[10px] font-heading uppercase tracking-widest mb-1">
                                            {v.name}
                                        </span>
                                        <span className="text-[7px] lg:text-[8px] opacity-60 font-body">{formatCurrency(v.price)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {product.notes && product.notes.length > 0 && (
                            <div className="space-y-4 lg:space-y-6">
                                <h3 className="text-[9px] lg:text-[10px] uppercase tracking-[0.3em] font-heading text-foreground border-b border-border/50 pb-3 lg:pb-4">
                                    {t('olfactory_structure')}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    {[
                                        { type: 'TOP', label: t('top_notes') },
                                        { type: 'MIDDLE', label: t('heart_notes') },
                                        { type: 'BASE', label: t('base_notes') },
                                    ].map((group) => {
                                        const notes = product.notes!
                                            .filter((n) => n.note?.type === group.type)
                                            .map((n) => n.note?.name)
                                            .filter(Boolean);
                                        if (notes.length === 0) return null;
                                        return (
                                            <div key={group.type}>
                                                <p className="text-[8px] text-muted-foreground uppercase tracking-widest mb-1">
                                                    {group.label}
                                                </p>
                                                <p className="text-[9px] lg:text-[10px] font-heading text-gold uppercase tracking-wider leading-relaxed">
                                                    {notes.join(', ')}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 lg:space-y-6">
                            <h3 className="text-[9px] lg:text-[10px] uppercase tracking-[0.3em] font-heading text-foreground border-b border-border/50 pb-3 lg:pb-4">
                                {t('technical_specifications')}
                            </h3>
                            <div className="grid grid-cols-2 gap-6 lg:gap-8">
                                <div>
                                    <p className="text-[8px] text-muted-foreground uppercase tracking-widest mb-1">
                                        {t('concentration')}
                                    </p>
                                    <p className="text-[10px] lg:text-xs font-heading text-gold uppercase tracking-widest">
                                        {product.concentration || 'Eau de Parfum'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[8px] text-muted-foreground uppercase tracking-widest mb-1">
                                        {t('longevity')}
                                    </p>
                                    <p className="text-[10px] lg:text-xs font-heading text-gold uppercase tracking-widest">
                                        {product.longevity || 'Persistent'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-500 text-[9px] lg:text-[10px] uppercase tracking-widest mb-4">{error}</p>
                    )}

                    {success && (
                        <p className="text-green-500 text-[9px] lg:text-[10px] uppercase tracking-widest mb-4">{t('unit_added_queue')}</p>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 mb-10 lg:mb-12">
                        <button
                            onClick={handleAddToCart}
                            disabled={loading || !selectedVariant}
                            className="flex-1 bg-gold text-white dark:text-luxury-black h-14 lg:h-16 rounded-full font-heading text-[9px] lg:text-[10px] uppercase font-bold tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gold/20 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? (
                                tCommon('processing')
                            ) : (
                                <>
                                    <ShoppingBag className="w-4 h-4" /> {t('assemble_acquisition')}
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleToggleFavorite}
                            disabled={favoriteLoading}
                            className={`w-14 h-14 lg:w-16 lg:h-16 glass border-border rounded-full flex items-center justify-center group transition-all shrink-0 ${isFavorite ? 'text-red-700 bg-red-500/10 border-red-400/50' : 'text-muted-foreground hover:text-red-400'
                                }`}
                            aria-label={isFavorite ? t('remove_favorite') : t('add_favorite')}
                        >
                            <Heart className={`w-5 h-5 transition-all ${isFavorite ? 'fill-red-700/60' : 'group-hover:fill-red-400/20'}`} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 pt-8 lg:pt-10 border-t border-border/50">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl glass border-gold/10 flex items-center justify-center shrink-0">
                                <BrainCircuit className="w-5 h-5 text-gold" />
                            </div>
                            <div>
                                <h4 className="text-[9px] lg:text-[10px] uppercase font-heading tracking-widest text-foreground mb-1">
                                    {t('pattern_matching')}
                                </h4>
                                <p className="text-[7px] lg:text-[8px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                                    {t('pattern_matching_desc')}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl glass border-gold/10 flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-5 h-5 text-gold" />
                            </div>
                            <div>
                                <h4 className="text-[9px] lg:text-[10px] uppercase font-heading tracking-widest text-foreground mb-1">
                                    {t('authenticity_shield')}
                                </h4>
                                <p className="text-[7px] lg:text-[8px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                                    {t('authenticity_shield_desc')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Review Section */}
            <div className="space-y-12 max-w-4xl mx-auto px-2 lg:px-0">
                <ReviewSummaryView productId={product.id} />
                <ReviewList productId={product.id} />
            </div>
        </div>
    );
}
