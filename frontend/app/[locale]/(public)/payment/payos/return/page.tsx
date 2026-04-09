'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { paymentService } from '@/services/payment.service';
import { orderService } from '@/services/order.service';
import Link from 'next/link';

export default function PayOSReturnPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams?.get('orderId');
    const [loading, setLoading] = useState(true);
    const [payment, setPayment] = useState<any>(null);
    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        if (orderId) {
            Promise.all([
                paymentService.getPaymentByOrder(orderId).catch(() => null),
                orderService.getById(orderId).catch(() => null),
            ]).then(([p, o]) => {
                setPayment(p);
                setOrder(o);
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [orderId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-gold mx-auto" />
                    <p className="text-stone-400">Đang xử lý...</p>
                </div>
            </div>
        );
    }

    const isPaid = payment?.status === 'PAID' || order?.paymentStatus === 'PAID';

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-[2rem] p-12 border border-stone-100 dark:border-white/10 shadow-2xl text-center space-y-6">
                {isPaid ? (
                    <>
                        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 size={40} />
                        </div>
                        <h1 className="text-3xl font-serif text-luxury-black dark:text-white">
                            Thanh toán thành công!
                        </h1>
                        <p className="text-stone-500 dark:text-stone-400">
                            Đơn hàng của bạn đã được xác nhận. Chúng tôi sẽ xử lý và giao hàng trong thời gian sớm nhất.
                        </p>
                        {order && (
                            <div className="bg-stone-50 dark:bg-zinc-800 rounded-xl p-4 text-left">
                                <p className="text-sm text-stone-600 dark:text-stone-400">
                                    Mã đơn hàng: <span className="font-bold text-luxury-black dark:text-white">{order.code}</span>
                                </p>
                            </div>
                        )}
                        <div className="flex gap-4 pt-4">
                            <Link
                                href="/dashboard/customer/orders"
                                className="flex-1 bg-luxury-black dark:bg-gold text-white py-3 rounded-full font-bold tracking-widest uppercase text-center text-xs hover:bg-stone-800 dark:hover:bg-gold/80 transition-all"
                            >
                                Xem đơn hàng
                            </Link>
                            <Link
                                href="/"
                                className="flex-1 border border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-500 py-3 rounded-full font-bold tracking-widest uppercase text-center text-xs hover:border-luxury-black dark:hover:border-white hover:text-luxury-black dark:hover:text-white transition-all"
                            >
                                Về trang chủ
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-20 h-20 bg-orange-50 dark:bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto">
                            <XCircle size={40} />
                        </div>
                        <h1 className="text-3xl font-serif text-luxury-black dark:text-white">
                            Thanh toán chưa hoàn tất
                        </h1>
                        <p className="text-stone-500 dark:text-stone-400">
                            Thanh toán của bạn đang được xử lý. Vui lòng đợi trong giây lát hoặc kiểm tra lại sau.
                        </p>
                        <div className="flex gap-4 pt-4">
                            <Link
                                href={`/dashboard/customer/orders${orderId ? `?orderId=${orderId}` : ''}`}
                                className="flex-1 bg-luxury-black dark:bg-gold text-white py-3 rounded-full font-bold tracking-widest uppercase text-center text-xs hover:bg-stone-800 dark:hover:bg-gold/80 transition-all"
                            >
                                Kiểm tra đơn hàng
                            </Link>
                            <Link
                                href="/"
                                className="flex-1 border border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-500 py-3 rounded-full font-bold tracking-widest uppercase text-center text-xs hover:border-luxury-black dark:hover:border-white hover:text-luxury-black dark:hover:text-white transition-all"
                            >
                                Về trang chủ
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
