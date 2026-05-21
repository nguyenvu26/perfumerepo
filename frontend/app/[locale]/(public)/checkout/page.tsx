'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { Link, useRouter } from '@/lib/i18n';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import {
    ArrowLeft, CreditCard, Wallet,
    Loader2, Download, Tag, X, Check, Lock, ChevronRight, Ticket
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cartService } from '@/services/cart.service';
import { orderService } from '@/services/order.service';
import { paymentService, type PayOSPaymentResponse } from '@/services/payment.service';
import { promotionService, type PromotionValidationResponse } from '@/services/promotion.service';
import {
    ghnService,
    type GHNService,
} from '@/services/ghn.service';
import { AddressSelector } from '@/components/address/address-selector';
import { UserAddress } from '@/services/address.service';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type PaymentMethod = 'COD' | 'ONLINE' | null;
const PAYMENT_TTL_SECONDS = 10 * 60;
const PAYMENT_STATUS_POLL_MS = 3000;

function QRCodeCanvas({ qrCodeValue }: { qrCodeValue: string }) {
    const t = useTranslations('checkout');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current && qrCodeValue) {
            QRCode.toCanvas(canvasRef.current, qrCodeValue, {
                errorCorrectionLevel: 'H',
                margin: 1,
                width: 280,
                color: {
                    dark: '#000',
                    light: '#fff',
                },
            });
        }
    }, [qrCodeValue]);

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-2xl border-2 border-gold shadow-lg">
                <canvas ref={canvasRef} />
            </div>
            <button
                onClick={() => {
                    if (canvasRef.current) {
                        const link = document.createElement('a');
                        link.download = 'qr-code.png';
                        link.href = canvasRef.current.toDataURL();
                        link.click();
                    }
                }}
                className="flex items-center gap-2 text-xs text-gold hover:text-gold/80 transition"
            >
                <Download size={14} />
                {t('download_qr')}
            </button>
        </div>
    );
}

function PaymentOptionRow({
    title,
    description,
    icon: Icon,
    selected,
    onSelect,
    imageSrc,
}: {
    title: string;
    description: string;
    icon: any;
    selected: boolean;
    onSelect: () => void;
    imageSrc?: string;
}) {
    return (
        <button
            onClick={onSelect}
            className={cn(
                'flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all',
                selected
                    ? 'border-gold bg-gold/[0.05]'
                    : 'border-border/60 bg-card hover:border-gold/40'
            )}
        >
            <div className="flex items-center gap-4">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-border/60">
                    {selected && <div className="h-2.5 w-2.5 rounded-full bg-gold" />}
                </div>
                <div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </div>
            {imageSrc ? (
                <div className="flex h-8 px-2 flex-shrink-0 items-center justify-center rounded-lg bg-white p-1 border border-border/40 shadow-sm">
                    <img src={imageSrc} alt={title} className="h-full w-auto object-contain" />
                </div>
            ) : (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted/40 text-gold">
                    <Icon size={18} />
                </div>
            )}
        </button>
    );
}

export default function CheckoutPage() {
    const t = useTranslations('checkout');
    const locale = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const format = useFormatter();
    const tFeatured = useTranslations('featured');
    const { isAuthenticated } = useAuth();

    const [view, setView] = useState<'checkout' | 'qr'>('checkout');
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Address state
    const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
    const [orderId, setOrderId] = useState<string | null>(null);
    const [paymentData, setPaymentData] = useState<PayOSPaymentResponse | null>(null);
    const [paymentExpiresAt, setPaymentExpiresAt] = useState<number | null>(null);
    const [secondsLeft, setSecondsLeft] = useState<number>(PAYMENT_TTL_SECONDS);
    const [paymentDetected, setPaymentDetected] = useState(false);

    // GHN shipping
    const [ghnEnabled, setGhnEnabled] = useState(false);
    const [services, setServices] = useState<GHNService[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
    const [shippingFee, setShippingFee] = useState(0);
    const [loadingFee, setLoadingFee] = useState(false);
    const [feeError, setFeeError] = useState<string | null>(null);

    // Promotion states
    const [voucherInput, setVoucherInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<PromotionValidationResponse | null>(null);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [myVouchers, setMyVouchers] = useState<any[]>([]);
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [loadingVouchers, setLoadingVouchers] = useState(false);

    const codTitle = t('cod_label');
    const onlineTitle = t('online_payment_label');

    const paymentOptions = [
        {
            key: 'COD' as const,
            title: codTitle,
            description: locale === 'vi' ? 'Thanh toán bằng tiền mặt khi nhận hàng' : 'Pay with cash upon delivery',
            icon: Wallet,
            imageSrc: '/COD1.webp',
        },
        {
            key: 'ONLINE' as const,
            title: onlineTitle,
            description: locale === 'vi' ? 'VietQR, PayOS' : 'VietQR, PayOS',
            icon: CreditCard,
            imageSrc: '/PAYOS.png',
        }
    ];

    useEffect(() => {
        if (isAuthenticated) {
            setLoadingVouchers(true);
            promotionService.getMyPromotions()
                .then(setMyVouchers)
                .finally(() => setLoadingVouchers(false));
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/login');
            return;
        }

        // Check if there is an active pending payment first
        const stored = typeof window !== 'undefined' ? localStorage.getItem('pending_payment') : null;
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
                    setOrderId(parsed.orderId);
                    setPaymentData(parsed.paymentData);
                    setPaymentExpiresAt(parsed.expiresAt);
                    setSecondsLeft(Math.max(0, Math.floor((parsed.expiresAt - Date.now()) / 1000)));
                    setPaymentMethod('ONLINE');
                    if (parsed.cartItems) {
                        setCartItems(parsed.cartItems);
                    }
                    setView('qr');
                    setLoading(false);

                    // Fetch configured ghn
                    ghnService.isConfigured().then((r) => {
                        if (r.configured) setGhnEnabled(true);
                    }).catch(() => { });
                    return;
                } else {
                    localStorage.removeItem('pending_payment');
                }
            } catch (e) {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('pending_payment');
                }
            }
        }

        cartService.getCart().then((c) => {
            const itemsParam = searchParams.get('items');
            if (itemsParam) {
                const selectedIds = itemsParam.split(',').map(id => parseInt(id));
                setCartItems(c.items.filter(item => selectedIds.includes(item.id)));
            } else {
                setCartItems(c.items);
            }
            setLoading(false);
        }).catch(() => setLoading(false));

        ghnService.isConfigured().then((r) => {
            if (r.configured) setGhnEnabled(true);
        }).catch(() => { });
    }, [isAuthenticated, router, searchParams]);

    // Fetch GHN services when district changes
    useEffect(() => {
        if (!selectedAddress?.districtId) {
            setServices([]);
            setSelectedServiceId(null);
            return;
        }
        ghnService.getServices(selectedAddress.districtId).then((s) => {
            const lightServices = s.filter(service => service.service_type_id === 2);
            setServices(lightServices);
            if (lightServices.length > 0) setSelectedServiceId(lightServices[0].service_id);
            else setSelectedServiceId(null);
        }).catch(() => setServices([]));
    }, [selectedAddress?.districtId]);

    const calculateFee = useCallback(async () => {
        if (!selectedAddress?.districtId || !selectedAddress?.wardCode || !selectedServiceId) return;
        setLoadingFee(true);
        setFeeError(null);
        try {
            const res = await ghnService.calculateFee({
                toDistrictId: selectedAddress.districtId,
                toWardCode: selectedAddress.wardCode,
                serviceId: selectedServiceId,
                weight: 500,
            });
            setShippingFee(res.total ?? 0);
        } catch (e: any) {
            setFeeError(e.message || t('error_calculate_fee'));
            setShippingFee(0);
        } finally {
            setLoadingFee(false);
        }
    }, [selectedAddress, selectedServiceId, t]);

    const formatCurrency = useCallback((amount: number) => {
        return format.number(amount, {
            style: 'currency',
            currency: tFeatured('currency_code') || 'VND',
            maximumFractionDigits: 0
        });
    }, [format, tFeatured]);

    useEffect(() => {
        if (selectedAddress && selectedServiceId) {
            calculateFee();
        } else {
            setShippingFee(0);
        }
    }, [selectedAddress, selectedServiceId, calculateFee]);

    const subtotal = cartItems.reduce((acc, i) => acc + i.variant.price * i.quantity, 0);
    const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const total = Math.max(0, subtotal - couponDiscount + shippingFee);

    useEffect(() => {
        if (!paymentExpiresAt) return;
        const timer = window.setInterval(() => {
            const next = Math.max(0, Math.floor((paymentExpiresAt - Date.now()) / 1000));
            setSecondsLeft(next);
        }, 1000);
        return () => window.clearInterval(timer);
    }, [paymentExpiresAt]);

    const isPaymentExpired = paymentExpiresAt ? Date.now() >= paymentExpiresAt : false;
    const countdownLabel = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;

    useEffect(() => {
        if (view !== 'qr' || !orderId || paymentDetected) return;
        const timer = window.setInterval(async () => {
            try {
                const payment = await paymentService.getPaymentByOrder(orderId);
                if (payment?.status === 'PAID') {
                    setPaymentDetected(true);
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('pending_payment');
                    }
                    window.clearInterval(timer);
                    router.push(`/checkout/success?orderId=${orderId}`);
                }
            } catch {
                // keep polling
            }
        }, PAYMENT_STATUS_POLL_MS);
        return () => window.clearInterval(timer);
    }, [view, orderId, paymentDetected, router]);

    const applyVoucherCode = async (code: string) => {
        if (!code) return;
        setIsApplyingCoupon(true);
        setCouponError(null);
        try {
            const result = await promotionService.validate(code, subtotal);
            setAppliedCoupon(result);
            setVoucherInput('');
        } catch (e: any) {
            setCouponError(e.response?.data?.message || t('invalid_coupon'));
            setAppliedCoupon(null);
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponError(null);
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            toast.error(t('error_missing_address'));
            return;
        }

        setSubmitting(true);
        try {
            let currentOrderId = orderId;
            if (!currentOrderId) {
                const order = await orderService.create({
                    shippingAddress: `${selectedAddress.detailAddress}, ${selectedAddress.wardName}, ${selectedAddress.districtName}, ${selectedAddress.provinceName}`,
                    recipientName: selectedAddress.recipientName,
                    phone: selectedAddress.phone,
                    promotionCode: appliedCoupon?.code,
                    paymentMethod: paymentMethod ?? undefined,
                    ...(ghnEnabled && selectedAddress.provinceId
                        ? {
                            shippingProvinceId: selectedAddress.provinceId,
                            shippingDistrictId: selectedAddress.districtId,
                            shippingWardCode: selectedAddress.wardCode,
                            shippingServiceId: selectedServiceId ?? undefined,
                            shippingFee,
                        }
                        : {}),
                    cartItemIds: cartItems.map(i => i.id),
                });
                currentOrderId = order.id;
                setOrderId(order.id);
            }

            if (paymentMethod === 'COD') {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('pending_payment');
                }
                router.push(`/checkout/success?orderId=${currentOrderId}`);
            } else if (paymentMethod === 'ONLINE') {
                if (paymentData && paymentExpiresAt && Date.now() < paymentExpiresAt) {
                    setView('qr');
                } else {
                    const payment = await paymentService.createPayment(currentOrderId);
                    setPaymentData(payment);
                    const expiresAt = Date.now() + PAYMENT_TTL_SECONDS * 1000;
                    setPaymentExpiresAt(expiresAt);
                    setSecondsLeft(PAYMENT_TTL_SECONDS);

                    if (typeof window !== 'undefined') {
                        localStorage.setItem('pending_payment', JSON.stringify({
                            orderId: currentOrderId,
                            expiresAt: expiresAt,
                            paymentData: payment,
                            cartItems: cartItems
                        }));
                    }

                    setView('qr');
                }
            }
        } catch (e: any) {
            toast.error(e.response?.data?.message || e.message || t('error_create_order'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-gold" />
            </div>
        );
    }

    if (view === 'qr' && paymentData) {
        return (
            <div className="min-h-screen bg-background text-foreground transition-colors">
                <main className="container-responsive pt-28 pb-20 lg:pt-36 lg:pb-28 relative z-10">
                    <div className="mx-auto max-w-4xl space-y-8">
                        <button
                            onClick={() => setView('checkout')}
                            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-gold transition-colors"
                        >
                            <ArrowLeft size={16} />
                            {locale === 'vi' ? 'Quay lại' : 'Back'}
                        </button>

                        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-10">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between text-center sm:text-left">
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-semibold text-foreground">
                                        {locale === 'vi' ? 'Quét mã để hoàn tất' : 'Scan to complete payment'}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {t('qr_desc_scanning')}
                                    </p>
                                </div>
                                <div className={cn(
                                    'inline-flex mx-auto sm:mx-0 items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold',
                                    isPaymentExpired ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-gold/30 bg-gold/[0.08] text-gold'
                                )}>
                                    {isPaymentExpired
                                        ? (locale === 'vi' ? 'Đã hết hạn' : 'Expired')
                                        : `${locale === 'vi' ? 'Còn lại' : 'Time left'} ${countdownLabel}`}
                                </div>
                            </div>

                            <div className="mt-10 flex flex-col items-center justify-center gap-10 lg:flex-row lg:gap-16">
                                <div className="flex justify-center">
                                    {paymentData.qrCode ? (
                                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-border/40">
                                            <QRCodeCanvas qrCodeValue={paymentData.qrCode} />
                                        </div>
                                    ) : (
                                        <div className="flex h-[300px] w-[300px] items-center justify-center rounded-[2rem] border border-border/60 bg-muted/20">
                                            <Loader2 className="animate-spin text-gold" size={32} />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6 w-full max-w-xs text-center lg:text-left">
                                    <div className="space-y-2">
                                        <p className="text-4xl font-semibold text-gold">
                                            {formatCurrency(paymentData.amount)}
                                        </p>
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                                {paymentData.accountName}
                                            </p>
                                            <p className="font-mono text-sm text-muted-foreground/70">
                                                {paymentData.accountNumber}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-left">
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            {locale === 'vi' ? 'Trạng thái' : 'Status'}
                                        </p>
                                        <p className="mt-2 text-base font-semibold text-foreground">
                                            {paymentDetected
                                                ? (locale === 'vi' ? 'Đã nhận thanh toán' : 'Payment received')
                                                : isPaymentExpired
                                                    ? (locale === 'vi' ? 'Đã hết hạn' : 'Expired')
                                                    : t('waiting_for_payment')}
                                        </p>
                                    </div>

                                    {paymentDetected && (
                                        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400">
                                            {locale === 'vi'
                                                ? 'Đã nhận thanh toán, đang chuyển trang...'
                                                : 'Payment detected, redirecting...'}
                                        </div>
                                    )}

                                    <a
                                        href={isPaymentExpired ? '#' : (paymentData.checkoutUrl || '#')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => {
                                            if (isPaymentExpired) e.preventDefault();
                                        }}
                                        className={cn(
                                            'inline-flex min-h-[50px] w-full items-center justify-center rounded-xl px-6 text-sm font-semibold transition-all',
                                            isPaymentExpired
                                                ? 'cursor-not-allowed border border-border/60 bg-muted/40 text-muted-foreground'
                                                : 'bg-gold text-luxury-black hover:bg-gold-dark'
                                        )}
                                    >
                                        {isPaymentExpired ? 'ĐÃ HẾT HẠN' : t('pay_via_payos_btn')}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors">
            <main className="container-responsive pt-28 pb-12 lg:pt-36 lg:pb-16">
                <div className="mx-auto max-w-[1440px]">

                    <div className="grid gap-10 xl:gap-14 lg:grid-cols-[minmax(0,1fr)_420px]">

                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Shipping & Payment Method Section */}
                            <section className="space-y-6">
                                <h2 className="text-xl font-semibold text-foreground">
                                    {locale === 'vi' ? 'Phương thức giao hàng & Thanh toán' : 'Shipping & Payment'}
                                </h2>

                                <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-8 shadow-sm">
                                    <div className="grid gap-8 md:grid-cols-2 md:divide-x md:divide-border/40">

                                        {/* Left: Payment Method */}
                                        <div className="md:pr-8">
                                            <h3 className="text-base font-medium text-foreground mb-4">
                                                {locale === 'vi' ? 'Phương thức thanh toán' : 'Payment Method'}
                                            </h3>
                                            <div className="space-y-3">
                                                {paymentOptions.map((option) => (
                                                    <PaymentOptionRow
                                                        key={option.key}
                                                        title={option.title}
                                                        description={option.description}
                                                        icon={option.icon}
                                                        selected={paymentMethod === option.key}
                                                        onSelect={() => setPaymentMethod(option.key)}
                                                        imageSrc={option.imageSrc}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Right: Shipping Service */}
                                        <div className={cn(
                                            "md:pl-8",
                                            !ghnEnabled || services.length === 0 ? "hidden md:flex flex-col items-center justify-center opacity-50" : ""
                                        )}>
                                            {ghnEnabled && services.length > 0 ? (
                                                <div>
                                                    <div className="mb-4">
                                                        <h3 className="text-base font-medium text-foreground whitespace-nowrap">
                                                            {locale === 'vi' ? 'Dịch vụ vận chuyển' : 'Shipping Service'}
                                                        </h3>
                                                    </div>
                                                    <div className="grid gap-3">
                                                        {services.map((service) => (
                                                            <button
                                                                key={service.service_id}
                                                                onClick={() => setSelectedServiceId(service.service_id)}
                                                                className={cn(
                                                                    'w-full flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-all',
                                                                    selectedServiceId === service.service_id
                                                                        ? 'border-gold bg-gold/[0.05]'
                                                                        : 'border-border/60 bg-muted/20 hover:border-gold/40'
                                                                )}
                                                            >
                                                                <div className="flex flex-col gap-0.5 flex-1">
                                                                    <p className="text-sm font-semibold text-foreground">{service.short_name}</p>
                                                                    <p className="text-xs text-muted-foreground">GHN Express</p>
                                                                    {selectedServiceId === service.service_id && (
                                                                        <p className={cn('text-[13px] font-medium mt-1.5', feeError ? 'text-red-400' : 'text-gold')}>
                                                                            {loadingFee
                                                                                ? (locale === 'vi' ? 'Đang tính phí...' : 'Calculating...')
                                                                                : feeError
                                                                                    ? feeError
                                                                                    : t('estimated_shipping_fee', { fee: formatCurrency(shippingFee) })}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="flex h-8 px-2 flex-shrink-0 items-center justify-center rounded-lg bg-white p-1 border border-border/40 shadow-sm">
                                                                    <img src="/GHN.png" alt="GHN Express" className="h-full w-auto object-contain" />
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-sm italic text-muted-foreground text-center">
                                                    {locale === 'vi' ? 'Vui lòng chọn địa chỉ giao hàng trước' : 'Please select a shipping address first'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Shipping Info Section */}
                            <section className="space-y-6">
                                <h2 className="text-xl font-semibold text-foreground">
                                    {locale === 'vi' ? 'Thông tin giao hàng' : 'Shipping Information'}
                                </h2>

                                <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
                                    <AddressSelector
                                        selectedId={selectedAddress?.id}
                                        onSelect={setSelectedAddress}
                                    />
                                </div>

                            </section>


                        </div>

                        {/* Right Column: Order Summary */}
                        <aside className="lg:sticky lg:top-8 lg:h-fit">
                            <div className="rounded-[1.5rem] border border-border/40 bg-card p-6 shadow-sm sm:p-8">
                                <h2 className="text-lg font-semibold text-foreground mb-6">
                                    {locale === 'vi' ? 'Đơn hàng của bạn' : 'Your Order'}
                                </h2>

                                {/* Cart Items */}
                                <div className="max-h-[320px] space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                                    {cartItems.length > 0 ? (
                                        cartItems.map((item) => (
                                            <div key={item.id} className="flex gap-4 group">
                                                <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-border/40 bg-muted/30">
                                                    {item.variant.product.images?.[0]?.url ? (
                                                        <img
                                                            src={item.variant.product.images[0].url}
                                                            alt={item.variant.product.name}
                                                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">-</div>
                                                    )}
                                                </div>
                                                <div className="flex flex-1 flex-col justify-center">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="line-clamp-2 text-sm font-medium text-foreground">
                                                            {item.variant.product.name}
                                                        </p>
                                                    </div>
                                                    <div className="mt-1 flex items-center justify-between">
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.variant.name} <span className="mx-1">•</span> SL: {item.quantity}
                                                        </p>
                                                        <p className="text-sm font-semibold text-foreground">
                                                            {formatCurrency(item.variant.price * item.quantity)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-6 text-center text-sm text-muted-foreground">
                                            {t('empty_cart')}
                                        </div>
                                    )}
                                </div>

                                {/* Discount Code */}
                                <div className="mt-8 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder={locale === 'vi' ? 'Mã giảm giá' : 'Discount code'}
                                            value={voucherInput}
                                            onChange={(e) => setVoucherInput(e.target.value)}
                                            className="flex-1 rounded-xl border border-border/60 bg-muted/10 px-4 py-3 text-sm focus:border-gold focus:outline-none transition-colors"
                                        />
                                        <button
                                            onClick={() => applyVoucherCode(voucherInput)}
                                            disabled={isApplyingCoupon || !voucherInput}
                                            className="rounded-xl bg-muted/40 border border-border/60 px-5 py-3 text-sm font-medium hover:bg-muted/80 disabled:opacity-50 transition-colors"
                                        >
                                            {isApplyingCoupon ? <Loader2 size={16} className="animate-spin text-gold" /> : (locale === 'vi' ? 'Áp dụng' : 'Apply')}
                                        </button>
                                    </div>
                                    {couponError && <p className="text-xs text-red-400 pl-1">{couponError}</p>}

                                    {appliedCoupon ? (
                                        <div className="flex items-center justify-between rounded-xl border border-gold/25 bg-gold/[0.08] px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Tag size={16} className="text-gold" />
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">{appliedCoupon.code}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-semibold text-gold">-{formatCurrency(appliedCoupon.discountAmount)}</span>
                                                <button onClick={handleRemoveCoupon} className="text-muted-foreground hover:text-red-400">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsVoucherModalOpen(true)}
                                            className="flex items-center gap-2 text-xs font-medium text-gold hover:text-gold-dark transition-colors pl-1"
                                        >
                                            <Ticket size={14} />
                                            {locale === 'vi' ? 'Chọn mã ưu đãi khả dụng' : 'Select available voucher'}
                                        </button>
                                    )}
                                </div>

                                {/* Totals */}
                                <div className="mt-6 space-y-4 border-t border-border/40 pt-6 text-sm">
                                    <div className="flex justify-between items-center text-muted-foreground">
                                        <span>{t('subtotal')}</span>
                                        <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-muted-foreground">
                                        <span>{t('shipping_fee_summary')}</span>
                                        <span className="font-medium text-emerald-400">
                                            {ghnEnabled && shippingFee === 0 ? (locale === 'vi' ? 'Miễn phí' : 'Free') : formatCurrency(shippingFee)}
                                        </span>
                                    </div>

                                </div>

                                {/* Total */}
                                <div className="mt-6 flex items-end justify-between border-t border-border/40 pt-6">
                                    <span className="text-base font-semibold text-foreground">{t('total')}</span>
                                    <div className="text-right">
                                        <span className="text-2xl font-bold text-gold tracking-tight">{formatCurrency(total)}</span>

                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={!selectedAddress || !paymentMethod || submitting}
                                    className="mt-8 flex min-h-[56px] w-full items-center justify-center rounded-xl bg-gold px-6 text-sm font-semibold uppercase tracking-widest text-luxury-black transition-all hover:bg-[#d6b779] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        locale === 'vi' ? 'Đặt hàng ngay' : 'Place order'
                                    )}
                                </button>

                                <p className="mt-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                                    <Lock size={12} />
                                    {locale === 'vi' ? 'Thông tin của bạn được bảo mật tuyệt đối' : 'Your information is highly secure'}
                                </p>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            <AnimatePresence>
                {isVoucherModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6"
                        onClick={() => setIsVoucherModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.96, y: 24 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.96, y: 24 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-xl overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-xl sm:p-8"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gold/75">
                                        {t('promotion_label')}
                                    </p>
                                    <h3 className="mt-2 text-2xl font-semibold text-foreground">
                                        {t('vouchers_modal_title')}
                                    </h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {t('vouchers_modal_subtitle')}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsVoucherModalOpen(false)}
                                    className="rounded-full border border-border/60 p-2 text-muted-foreground hover:text-foreground"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="mt-6 max-h-[60vh] space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                                {loadingVouchers ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2 size={28} className="animate-spin text-gold" />
                                    </div>
                                ) : myVouchers.length > 0 ? (
                                    myVouchers.map((voucher) => (
                                        <button
                                            key={voucher.id}
                                            onClick={() => {
                                                applyVoucherCode(voucher.promotion.code);
                                                setIsVoucherModalOpen(false);
                                            }}
                                            className="flex w-full items-center justify-between rounded-[1.5rem] border border-border/60 bg-card/40 px-5 py-4 text-left transition-all hover:border-gold/30 hover:bg-gold/[0.05]"
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/12 text-gold">
                                                    <Tag size={18} />
                                                </span>
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {voucher.promotion.code}
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {voucher.promotion.discountType === 'PERCENTAGE'
                                                            ? `-${voucher.promotion.discountValue}%`
                                                            : `-${formatCurrency(voucher.promotion.discountValue)}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-muted-foreground" />
                                        </button>
                                    ))
                                ) : (
                                    <div className="rounded-[1.5rem] border border-border/60 bg-card/40 px-5 py-8 text-center text-sm text-muted-foreground">
                                        {t('no_vouchers')}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
