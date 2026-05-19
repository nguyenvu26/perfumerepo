'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { Check, Package, Calendar, Mail, Phone, CreditCard } from 'lucide-react';
import { orderService } from '@/services/order.service';
import { useTranslations, useLocale } from 'next-intl';

export default function OrderSuccessPage() {
    const t = useTranslations('order_success');
    const searchParams = useSearchParams();
    const orderId = searchParams?.get('orderId');
    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('pending_payment');
        }
        if (orderId) {
            orderService.getById(orderId).then(setOrder).catch(() => { });
        }
    }, [orderId]);

    const locale = useLocale();
    const getEstimatedDate = (days: number) => {
        return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-[#F8F8F8] dark:bg-zinc-950 flex items-center justify-center py-20 lg:py-24 transition-colors">
            <div className="max-w-[1100px] w-full mx-auto px-4 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
                
                {/* Left Side - Content Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-[3rem] shadow-sm p-10 md:p-14 lg:p-16 flex flex-col justify-center border border-black/5 dark:border-white/5">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', damping: 12 }}
                        className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-8 shrink-0"
                    >
                        <Check className="w-7 h-7" strokeWidth={2.5} />
                    </motion.div>

                    <h1 className="text-4xl lg:text-[2.75rem] font-serif text-luxury-black dark:text-white mb-6 leading-tight">
                        {locale === 'vi' ? 'Đơn Hàng Đã Được Xác Nhận' : 'Order Has Been Confirmed'}
                    </h1>
                    <p className="text-stone-500 dark:text-stone-400 text-base font-light leading-relaxed mb-12 max-w-[340px]">
                        {locale === 'vi' 
                            ? 'Tuyệt tác của bạn đang được chuẩn bị với sự tỉ mỉ và tình yêu từ Cửa Hàng.'
                            : 'Your masterpiece is being prepared with meticulous care and love from the Store.'}
                    </p>

                    <div className="space-y-6 mb-16">
                        <div className="flex items-center gap-4">
                            <Package size={18} className="text-stone-300 dark:text-stone-600 shrink-0" />
                            <span className="text-sm text-stone-600 dark:text-stone-400">
                                {locale === 'vi' ? 'Mã Đơn Hàng' : 'Order Code'}:{' '}
                                <span className="text-luxury-black dark:text-white font-bold ml-1">
                                    {order?.code || '—'}
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Mail size={18} className="text-stone-300 dark:text-stone-600 shrink-0" />
                            <span className="text-sm text-stone-600 dark:text-stone-400">
                                Email:{' '}
                                <span className="text-luxury-black dark:text-white font-bold ml-1">
                                    {order?.user?.email || '—'}
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Phone size={18} className="text-stone-300 dark:text-stone-600 shrink-0" />
                            <span className="text-sm text-stone-600 dark:text-stone-400">
                                {locale === 'vi' ? 'SĐT' : 'Phone'}:{' '}
                                <span className="text-luxury-black dark:text-white font-bold ml-1">
                                    {order?.phone || '—'}
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Calendar size={18} className="text-stone-300 dark:text-stone-600 shrink-0" />
                            <span className="text-sm text-stone-600 dark:text-stone-400">
                                {locale === 'vi' ? 'Thời gian giao hàng dự kiến' : 'Estimated arrival'}:{' '}
                                <span className="text-luxury-black dark:text-white font-bold ml-1">
                                    {getEstimatedDate(2)} - {getEstimatedDate(4)}
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <CreditCard size={18} className="text-stone-300 dark:text-stone-600 shrink-0" />
                            <span className="text-sm text-stone-600 dark:text-stone-400">
                                {locale === 'vi' ? 'Phương thức' : 'Method'}:{' '}
                                <span className="text-luxury-black dark:text-white font-bold italic ml-1">
                                    {order?.paymentStatus === 'PAID'
                                        ? t('status_paid')
                                        : order?.paymentStatus === 'PENDING'
                                            ? t('status_pending')
                                            : (locale === 'vi' ? 'Chờ xác nhận' : 'Pending Confirmation')}
                                </span>
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <Link
                            href={orderId ? `/dashboard/customer/orders/${orderId}` : '/dashboard/customer/orders'}
                            className="w-full sm:w-auto bg-[#1C1F26] text-white px-8 py-3.5 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-colors text-center"
                        >
                            {locale === 'vi' ? 'Xem đơn hàng & theo dõi' : 'View order & track'}
                        </Link>
                        <Link
                            href="/"
                            className="w-full sm:w-auto border border-stone-200 dark:border-stone-800 text-stone-500 px-8 py-3.5 rounded-full text-[11px] font-bold uppercase tracking-widest hover:border-stone-300 hover:text-luxury-black dark:hover:text-white transition-colors text-center"
                        >
                            {locale === 'vi' ? 'Về trang chủ' : 'Back home'}
                        </Link>
                    </div>
                </div>

                {/* Right Side - Image Card */}
                <div className="hidden lg:block relative rounded-[3rem] overflow-hidden shadow-2xl h-[760px] w-full">
                    <Image
                        src="/bleu de channel.png"
                        alt="Success"
                        fill
                        className="object-cover"
                    />
                    {/* Dark gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    
                    <div className="absolute inset-x-0 bottom-0 p-12 text-white z-10 text-center">
                        <p className="italic font-serif text-2xl mb-8 leading-relaxed px-4">
                            {locale === 'vi' 
                                ? '"Sự chờ đợi là phần tinh tế nhất của mỗi trải nghiệm."'
                                : '"The wait is the most refined part of every experience."'}
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <div className="w-8 h-[1px] bg-gold" />
                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-stone-300">
                                PERFUME GPT
                            </span>
                            <div className="w-8 h-[1px] bg-gold" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
