'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { orderService } from '@/services/order.service';
import Link from 'next/link';

export default function PayOSCancelPage() {
    const searchParams = useSearchParams();
    const orderId = searchParams?.get('orderId');
    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        if (orderId) {
            orderService.getById(orderId).then(setOrder).catch(() => {});
        }
    }, [orderId]);

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-[2rem] p-12 border border-stone-100 dark:border-white/10 shadow-2xl text-center space-y-6">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
                    <XCircle size={40} />
                </div>
                <h1 className="text-3xl font-serif text-luxury-black dark:text-white">
                    Đã hủy thanh toán
                </h1>
                <p className="text-stone-500 dark:text-stone-400">
                    Bạn đã hủy quá trình thanh toán. Đơn hàng của bạn vẫn được lưu và bạn có thể thanh toán lại sau.
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
                        href={`/checkout${orderId ? `?orderId=${orderId}` : ''}`}
                        className="flex-1 bg-luxury-black dark:bg-gold text-white py-3 rounded-full font-bold tracking-widest uppercase text-center text-xs hover:bg-stone-800 dark:hover:bg-gold/80 transition-all"
                    >
                        Thanh toán lại
                    </Link>
                    <Link
                        href="/dashboard/customer/orders"
                        className="flex-1 border border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-500 py-3 rounded-full font-bold tracking-widest uppercase text-center text-xs hover:border-luxury-black dark:hover:border-white hover:text-luxury-black dark:hover:text-white transition-all"
                    >
                        Xem đơn hàng
                    </Link>
                </div>
            </div>
        </div>
    );
}
