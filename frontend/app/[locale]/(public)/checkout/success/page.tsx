'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { CheckCircle, Truck, Package, Calendar, Mail, Phone } from 'lucide-react';
import { orderService } from '@/services/order.service';
import { useTranslations, useLocale } from 'next-intl';

export default function OrderSuccessPage() {
    const t = useTranslations('order_success');
    const searchParams = useSearchParams();
    const orderId = searchParams?.get('orderId');
    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        if (orderId) {
            orderService.getById(orderId).then(setOrder).catch(() => { });
        }
    }, [orderId]);

    const locale = useLocale();
    const getEstimatedDate = (days: number) => {
        return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex items-center justify-center p-6 py-24 transition-colors">
            <div className="max-w-4xl w-full">
                <div className="glass bg-white dark:bg-zinc-900 rounded-[3rem] border border-stone-200 dark:border-white/10 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
                    {/* Left Side - Content */}
                    <div className="p-12 md:p-16 flex flex-col justify-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', damping: 12 }}
                            className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-10"
                        >
                            <CheckCircle size={32} />
                        </motion.div>

                        <h1 className="text-4xl font-serif text-luxury-black dark:text-white mb-6">
                            {t('title')}
                        </h1>
                        <p className="text-stone-500 dark:text-stone-400 text-lg font-light leading-relaxed mb-10">
                            {t('desc')}
                        </p>

                        <div className="space-y-6 mb-12">
                            <div className="flex items-center gap-4 text-stone-600 dark:text-stone-400">
                                <Package size={20} className="text-stone-300 dark:text-stone-600" />
                                <span className="text-sm font-medium">
                                    {t('order_code')}:{' '}
                                    <span className="text-luxury-black dark:text-white font-bold">
                                        {order?.code || '—'}
                                    </span>
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-stone-600 dark:text-stone-400">
                                <Mail size={20} className="text-stone-300 dark:text-stone-600" />
                                <span className="text-sm font-medium">
                                    Email:{' '}
                                    <span className="text-luxury-black dark:text-white font-bold">
                                        {order?.user?.email || '—'}
                                    </span>
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-stone-600 dark:text-stone-400">
                                <Phone size={20} className="text-stone-300 dark:text-stone-600" />
                                <span className="text-sm font-medium">
                                    SĐT:{' '}
                                    <span className="text-luxury-black dark:text-white font-bold">
                                        {order?.phone || '—'}
                                    </span>
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-stone-600 dark:text-stone-400">
                                <Calendar size={20} className="text-stone-300 dark:text-stone-600" />
                                <span className="text-sm font-medium">
                                    {t('estimated_arrival')}:{' '}
                                    <span className="text-luxury-black dark:text-white font-bold">
                                        {getEstimatedDate(2)} - {getEstimatedDate(4)}
                                    </span>
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-stone-600 dark:text-stone-400">
                                <Truck size={20} className="text-stone-300 dark:text-stone-600" />
                                <span className="text-sm font-medium">
                                    {t('payment_method')}:{' '}
                                    <span className="text-luxury-black dark:text-white font-bold italic tracking-wide">
                                        {order?.paymentStatus === 'PAID' 
                                            ? t('status_paid') 
                                            : order?.paymentStatus === 'PENDING' 
                                                ? t('status_pending') 
                                                : t('status_cod')}
                                    </span>
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href={orderId ? `/dashboard/customer/orders/${orderId}` : '/dashboard/customer/orders'}
                                className="flex-1 bg-luxury-black dark:bg-gold text-white py-4 rounded-full font-bold tracking-widest uppercase text-center text-xs hover:bg-stone-800 dark:hover:bg-gold/80 transition-all shadow-xl"
                            >
                                {t('view_order')}
                            </Link>
                            <Link
                                href="/"
                                className="flex-1 border border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-500 py-4 rounded-full font-bold tracking-widest uppercase text-center text-xs hover:border-luxury-black dark:hover:border-white hover:text-luxury-black dark:hover:text-white transition-all"
                            >
                                {t('back_home')}
                            </Link>
                        </div>
                    </div>

                    {/* Right Side - Image */}
                    <div className="relative hidden lg:block bg-stone-100 dark:bg-zinc-800 p-16">
                        <div className="h-full w-full rounded-[2rem] overflow-hidden relative shadow-2xl">
                            <Image
                                src="/luxury_perfume_hero_cinematic.png"
                                alt="Success"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-x-0 bottom-0 p-10 bg-linear-to-t from-black/80 to-transparent text-white">
                                <p className="italic font-serif text-xl mb-4 leading-relaxed">
                                    {t('wait_quote')}
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-px bg-gold" />
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-stone-300">
                                        AURA ATELIER
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[10px] font-bold tracking-[.3em] uppercase text-stone-300">
                        {t('processed_by')}
                    </p>
                </div>
            </div>
        </div>
    );
}
