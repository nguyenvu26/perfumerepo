'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { Link, useRouter } from '@/lib/i18n';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import {
    ArrowLeft, ArrowRight, CreditCard, Wallet,
    Loader2, Download, Tag, Check, X,
    Plus, type LucideIcon
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

// QR Code Canvas Component
function QRCodeCanvas({ qrCodeValue }: { qrCodeValue: string }) {
    const t = useTranslations('checkout');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current && qrCodeValue) {
            QRCode.toCanvas(canvasRef.current, qrCodeValue, {
                errorCorrectionLevel: 'H',
                margin: 1,
                width: 256,
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

function CheckoutProgress({
    step,
    labels,
    locale,
}: {
    step: number;
    labels: string[];
    locale: string;
}) {
    const stepLabel = locale === 'vi' ? 'Bước' : 'Step';

    return (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {labels.map((label, index) => {
                const itemIndex = index + 1;
                const isActive = step === itemIndex;
                const isDone = step > itemIndex;

                return (
                    <motion.div
                        key={label}
                        animate={isActive ? { y: [0, -2, 0] } : { y: 0 }}
                        transition={isActive ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
                        className={cn(
                            "rounded-[1.4rem] border px-3 py-3 transition-all",
                            isActive
                                ? "border-gold/50 bg-gold/[0.08] shadow-[0_18px_40px_-30px_rgba(197,160,89,0.55)]"
                                 : isDone
                                     ? "border-emerald-500/25 bg-emerald-500/[0.08]"
                                     : "border-border/40 bg-muted/20"
                         )}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                                    isActive
                                         ? "bg-gold text-luxury-black"
                                         : isDone
                                             ? "bg-emerald-500 text-white"
                                             : "bg-muted text-muted-foreground"
                                 )}
                            >
                                {isDone ? <Check size={13} /> : itemIndex}
                            </div>
                             <div className="min-w-0">
                                 <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
                                     {stepLabel} {itemIndex}
                                 </p>
                                 <p className="mt-1 text-sm font-medium leading-5 text-foreground">
                                     {label}
                                 </p>
                             </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

function PaymentOptionCard({
    title,
    description,
    bullets,
    badge,
    icon: Icon,
    selected,
    loading,
    onSelect,
    tone,
    locale,
}: {
    title: string;
    description: string;
    bullets: string[];
    badge: string;
    icon: LucideIcon;
    selected: boolean;
    loading: boolean;
    onSelect: () => void;
    tone: 'champagne' | 'night';
    locale: string;
}) {
    const toneClasses = tone === 'champagne'
        ? {
            card: selected
                ? 'border-gold/60 bg-[linear-gradient(180deg,rgba(197,160,89,0.16),rgba(17,17,18,0.96))] shadow-[0_26px_70px_-46px_rgba(197,160,89,0.45)]'
                : 'border-gold/20 bg-[linear-gradient(180deg,rgba(197,160,89,0.12),rgba(12,12,13,0.96))] hover:border-gold/40 hover:shadow-[0_26px_70px_-46px_rgba(197,160,89,0.25)]',
            icon: selected ? 'border-gold/50 bg-gold text-luxury-black' : 'border-gold/20 bg-gold/12 text-gold',
            badge: 'border-gold/25 bg-gold/10 text-gold',
            bulletIcon: 'bg-gold/12 text-gold',
        }
        : {
            card: selected
                ? 'border-gold/60 bg-[linear-gradient(180deg,rgba(197,160,89,0.16),rgba(17,17,18,0.96))] shadow-[0_26px_70px_-46px_rgba(197,160,89,0.45)]'
                : 'border-gold/20 bg-[linear-gradient(180deg,rgba(197,160,89,0.12),rgba(12,12,13,0.96))] hover:border-gold/40 hover:shadow-[0_26px_70px_-46px_rgba(197,160,89,0.25)]',
            icon: selected ? 'border-gold/50 bg-gold text-luxury-black' : 'border-gold/20 bg-gold/12 text-gold',
            badge: 'border-gold/25 bg-gold/10 text-gold',
            bulletIcon: 'bg-gold/12 text-gold',
        };

    return (
        <button
            onClick={onSelect}
            className={cn(
                'group relative flex min-h-[320px] flex-col overflow-hidden rounded-[2rem] border p-6 text-left transition-all duration-300 lg:min-h-[360px] lg:p-7',
                toneClasses.card
            )}
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_45%)]" />
            <div className="relative flex items-start justify-between gap-4">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-[1.1rem] border transition-all lg:h-14 lg:w-14', toneClasses.icon)}>
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Icon size={22} strokeWidth={1.7} />}
                </div>
                <div className="flex items-center gap-2">
                    <span className={cn('rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]', toneClasses.badge)}>
                        {badge}
                    </span>
                    {selected && (
                        <span className="rounded-full border border-gold/30 bg-gold/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
                            {locale === 'vi' ? 'Đã chọn' : 'Selected'}
                        </span>
                    )}
                </div>
            </div>

            <div className="relative mt-8 space-y-4">
                <h3 className="whitespace-nowrap text-[1.7rem] font-semibold leading-none tracking-[-0.045em] text-white lg:text-[2.05rem]">
                    {title}
                </h3>
                <p className="max-w-sm text-sm leading-7 text-white/62">
                    {description}
                </p>
            </div>

            <div className="relative mt-6 space-y-3">
                {bullets.map((item) => (
                    <div
                        key={item}
                        className="flex items-center gap-3 rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/88"
                    >
                        <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', toneClasses.bulletIcon)}>
                            <Check size={13} />
                        </span>
                        <span>{item}</span>
                    </div>
                ))}
            </div>
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
    const [step, setStep] = useState(1);
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Address state
    const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
    const [selectedPaymentPreview, setSelectedPaymentPreview] = useState<PaymentMethod>(null);
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
    const [appliedCoupon, setAppliedCoupon] = useState<PromotionValidationResponse | null>(null);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [myVouchers, setMyVouchers] = useState<any[]>([]);
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [loadingVouchers, setLoadingVouchers] = useState(false);

    const checkoutStepLabels = locale === 'vi'
        ? ['Địa chỉ', 'Thanh toán', 'Xác nhận']
        : ['Address', 'Payment', 'Confirm'];
    const codTitle = locale === 'vi' ? 'Thanh toán khi nhận hàng' : t('cod_label');
    const onlineTitle = locale === 'vi' ? 'Thanh toán trực tiếp' : t('online_payment_label');
    const pageTitle = locale === 'vi' ? 'Thanh toán' : 'Checkout';
    const stepHint = locale === 'vi'
        ? {
            1: 'Chọn địa chỉ nhận hàng và phương thức vận chuyển.',
            2: 'Chọn cách thanh toán phù hợp với bạn.',
            3: 'Quét mã và xác nhận giao dịch.'
        }
        : {
            1: 'Choose the shipping address and delivery service.',
            2: 'Select the payment method that fits you best.',
            3: 'Scan the code and confirm the transaction.'
        };
    const paymentOptions = locale === 'vi'
        ? [
            {
                key: 'COD' as const,
                title: codTitle,
                description: 'Thanh toán sau khi nhận và kiểm tra đơn.',
                bullets: ['Kiểm tra trước', 'Thanh toán tại nhà', 'Dễ thao tác'],
                badge: 'COD',
                tone: 'champagne' as const,
                icon: Wallet,
            },
            {
                key: 'ONLINE' as const,
                title: onlineTitle,
                description: 'Quét QR để hoàn tất nhanh và theo dõi rõ ràng.',
                bullets: ['QR / PayOS', 'Xác nhận nhanh', 'Theo dõi rõ'],
                badge: 'VietQR / PayOS',
                tone: 'night' as const,
                icon: CreditCard,
            }
        ]
        : [
            {
                key: 'COD' as const,
                title: codTitle,
                description: 'Pay after receiving and reviewing the order.',
                bullets: ['Review first', 'Pay at home', 'Simple flow'],
                badge: 'COD',
                tone: 'champagne' as const,
                icon: Wallet,
            },
            {
                key: 'ONLINE' as const,
                title: onlineTitle,
                description: 'Scan the QR code for a faster checkout.',
                bullets: ['QR / PayOS', 'Fast confirmation', 'Clear tracking'],
                badge: 'VietQR / PayOS',
                tone: 'night' as const,
                icon: CreditCard,
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
    }, [isAuthenticated, router]);

    // Fetch GHN services when district changes
    useEffect(() => {
        if (!selectedAddress?.districtId) {
            setServices([]);
            setSelectedServiceId(null);
            return;
        }
        ghnService.getServices(selectedAddress.districtId).then((s) => {
            // Filter ch\u1ec9 l\u1ea5y d\u1ecbch v\u1ee5 h\u00e0ng nh\u1eb9 (service_type_id = 2) cho n\u01b0\u1edbc hoa
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

    const canProceedStep1 = Boolean(selectedAddress && (ghnEnabled ? selectedServiceId : true));

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
        if (step !== 3 || !orderId || paymentDetected) return;
        const timer = window.setInterval(async () => {
            try {
                const payment = await paymentService.getPaymentByOrder(orderId);
                if (payment?.status === 'PAID') {
                    setPaymentDetected(true);
                    window.clearInterval(timer);
                    router.push(`/checkout/success?orderId=${orderId}`);
                }
            } catch {
                // keep polling; backend may be syncing webhook/fallback
            }
        }, PAYMENT_STATUS_POLL_MS);
        return () => window.clearInterval(timer);
    }, [step, orderId, paymentDetected, router]);

    const applyVoucherCode = async (code: string) => {
        setIsApplyingCoupon(true);
        setCouponError(null);
        try {
            const result = await promotionService.validate(code, subtotal);
            setAppliedCoupon(result);
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

    const handleCreateOrderIfNeeded = async (method: PaymentMethod): Promise<string | null> => {
        if (orderId) return orderId;
        if (!selectedAddress) {
            toast.error(t('error_missing_address'));
            return null;
        }

        setSubmitting(true);
        try {
            const order = await orderService.create({
                shippingAddress: `${selectedAddress.detailAddress}, ${selectedAddress.wardName}, ${selectedAddress.districtName}, ${selectedAddress.provinceName}`,
                recipientName: selectedAddress.recipientName,
                phone: selectedAddress.phone,
                promotionCode: appliedCoupon?.code,
                paymentMethod: method ?? undefined,
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
            setOrderId(order.id);
            return order.id;
        } catch (e: any) {
            toast.error(e.response?.data?.message || e.message || t('error_create_order'));
            return null;
        } finally {
            setSubmitting(false);
        }
    };

    const handlePaymentMethodSelect = async (method: PaymentMethod) => {
        setPaymentMethod(method);
        setSelectedPaymentPreview(method);
        const currentOrderId = await handleCreateOrderIfNeeded(method);
        if (!currentOrderId) return;

        if (method === 'COD') {
            setSubmitting(true);
            router.push(`/checkout/success?orderId=${currentOrderId}`);
        } else if (method === 'ONLINE') {
            setSubmitting(true);
            try {
                const payment = await paymentService.createPayment(currentOrderId);
                setPaymentData(payment);
                setPaymentExpiresAt(Date.now() + PAYMENT_TTL_SECONDS * 1000);
                setSecondsLeft(PAYMENT_TTL_SECONDS);
                setStep(3);
            } catch (e: any) {
                toast.error(e.message || t('error_create_payment'));
            } finally {
                setSubmitting(false);
            }
        }
    };

    const selectedPaymentLabel = selectedPaymentPreview === 'COD'
        ? codTitle
        : selectedPaymentPreview === 'ONLINE'
            ? onlineTitle
            : (locale === 'vi' ? 'Chưa chọn' : 'Not selected');

    const primaryAction = step === 1
        ? {
            label: t('continue_to_payment'),
            onClick: () => setStep(2),
            disabled: !canProceedStep1,
        }
        : step === 2
            ? {
                label: locale === 'vi' ? 'Hoàn tất thanh toán' : 'Complete payment',
                onClick: () => {
                    if (selectedPaymentPreview) {
                        void handlePaymentMethodSelect(selectedPaymentPreview);
                    }
                },
                disabled: !selectedPaymentPreview || submitting,
            }
            : null;
    const currentStepHint = stepHint[step as 1 | 2 | 3];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-gold" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background transition-colors text-foreground">
            <main className="container-responsive py-20 lg:py-28">
                <div className="mx-auto max-w-[1440px]">
                    <div className="grid gap-8 xl:gap-10 lg:grid-cols-[minmax(0,1fr)_390px]">
                        <div className="space-y-6 lg:space-y-8">
                             <Link
                                 href="/cart"
                                 className="inline-flex min-h-[46px] items-center gap-3 rounded-full border border-border/80 bg-background/50 px-5 text-sm font-medium text-muted-foreground transition-all hover:border-gold/40 hover:text-gold"
                             >
                                 <ArrowLeft size={16} />
                                 {t('return_to_cart')}
                             </Link>

                            <div className="rounded-[2.2rem] border border-border/60 bg-card/40 p-6 shadow-xl backdrop-blur-3xl sm:p-8">
                                <div className="space-y-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-dark dark:text-gold/75">
                                        Checkout
                                    </p>
                                    <h1 className="text-4xl font-semibold tracking-[-0.04em] text-foreground md:text-5xl">
                                        {pageTitle}
                                    </h1>
                                    <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                                        {currentStepHint}
                                    </p>
                                </div>

                                <div className="mt-6">
                                    <CheckoutProgress
                                        step={step}
                                        labels={checkoutStepLabels}
                                        locale={locale}
                                    />
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="space-y-6"
                                    >
                                         <section className="rounded-[2.2rem] border border-border/60 bg-card/40 p-6 shadow-xl sm:p-8">
                                             <div className="mb-6 space-y-2">
                                                 <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-dark dark:text-gold/75">
                                                     {t('shipping_address')}
                                                 </p>
                                                 <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
                                                     {locale === 'vi' ? 'Thông tin giao nhận' : 'Delivery details'}
                                                 </h2>
                                             </div>

                                            <AddressSelector
                                                selectedId={selectedAddress?.id}
                                                onSelect={setSelectedAddress}
                                            />
                                        </section>

                                        {ghnEnabled && services.length > 0 && (
                                            <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_-56px_rgba(0,0,0,0.8)] sm:p-8">
                                                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                                    <div className="space-y-2">
                                                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/75">
                                                            {t('shipping_service')}
                                                        </p>
                                                        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">
                                                            {locale === 'vi' ? 'Chọn dịch vụ vận chuyển' : 'Select shipping service'}
                                                        </h2>
                                                    </div>
                                                    <div className={cn(
                                                        'text-sm font-medium',
                                                        feeError ? 'text-red-400' : 'text-gold'
                                                    )}>
                                                        {loadingFee
                                                            ? (locale === 'vi' ? 'Đang tính phí...' : 'Calculating...')
                                                            : feeError
                                                                ? feeError
                                                                : t('estimated_shipping_fee', { fee: formatCurrency(shippingFee) })}
                                                    </div>
                                                </div>

                                                {services.length > 1 ? (
                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        {services.map((service) => (
                                                            <button
                                                                key={service.service_id}
                                                                onClick={() => setSelectedServiceId(service.service_id)}
                                                                className={cn(
                                                                    'rounded-[1.5rem] border px-5 py-5 text-left transition-all',
                                                                    selectedServiceId === service.service_id
                                                                        ? 'border-gold/45 bg-gold/[0.08] shadow-[0_24px_70px_-46px_rgba(197,160,89,0.35)]'
                                                                        : 'border-white/10 bg-white/[0.02] hover:border-gold/30'
                                                                )}
                                                            >
                                                                <p className="text-lg font-semibold text-white">{service.short_name}</p>
                                                                <p className="mt-2 text-sm text-white/52">GHN Express</p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="rounded-[1.5rem] border border-gold/20 bg-gold/[0.08] px-5 py-5">
                                                        <p className="text-lg font-semibold text-white">{services[0]?.short_name}</p>
                                                        <p className="mt-2 text-sm text-white/56">GHN Express</p>
                                                    </div>
                                                )}
                                            </section>
                                        )}
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="space-y-6"
                                    >
                                        <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_-56px_rgba(0,0,0,0.8)] sm:p-8">
                                            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                                                <div className="space-y-2">
                                                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/75">
                                                        {locale === 'vi' ? 'Phương thức thanh toán' : 'Payment methods'}
                                                    </p>
                                                    <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">
                                                        {locale === 'vi' ? 'Chọn cách thanh toán' : 'Choose how you want to pay'}
                                                    </h2>
                                                    <p className="max-w-xl text-sm leading-7 text-white/52">
                                                        {locale === 'vi'
                                                            ? 'Hai lựa chọn rõ ràng, ít thao tác và dễ xác nhận.'
                                                            : 'Two clear options, easy to compare and confirm.'}
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
                                                    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] px-4 py-4">
                                                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/38">
                                                            {locale === 'vi' ? 'Sản phẩm' : 'Items'}
                                                        </p>
                                                        <p className="mt-2 text-2xl font-semibold text-white">{cartItems.length}</p>
                                                    </div>
                                                    <div className="rounded-[1.25rem] border border-gold/20 bg-gold/[0.08] px-4 py-4">
                                                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/80">
                                                            {locale === 'vi' ? 'Tạm tính' : 'Subtotal'}
                                                        </p>
                                                        <p className="mt-2 text-xl font-semibold text-gold">{formatCurrency(total)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        <div className="grid gap-5 md:grid-cols-2">
                                            {paymentOptions.map((option) => (
                                                <PaymentOptionCard
                                                    key={option.key}
                                                    title={option.title}
                                                    description={option.description}
                                                    bullets={option.bullets}
                                                    badge={option.badge}
                                                    icon={option.icon}
                                                    selected={selectedPaymentPreview === option.key}
                                                    loading={submitting && paymentMethod === option.key}
                                                    onSelect={() => setSelectedPaymentPreview(option.key)}
                                                    tone={option.tone}
                                                    locale={locale}
                                                />
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => setStep(1)}
                                            className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/10 px-6 text-sm font-medium text-white/66 transition-all hover:border-gold/35 hover:text-gold"
                                        >
                                            {t('back_to_address')}
                                        </button>
                                    </motion.div>
                                )}

                                {step === 3 && paymentData && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="space-y-6"
                                    >
                                        <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_-56px_rgba(0,0,0,0.8)] sm:p-8">
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="space-y-2">
                                                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/75">
                                                        QR / PayOS
                                                    </p>
                                                    <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">
                                                        {locale === 'vi' ? 'Quét mã để hoàn tất' : 'Scan to complete payment'}
                                                    </h2>
                                                    <p className="max-w-xl text-sm leading-7 text-white/52">
                                                        {t('qr_desc_scanning')}
                                                    </p>
                                                </div>

                                                <div className={cn(
                                                    'inline-flex min-h-[48px] items-center rounded-full border px-4 text-sm font-semibold',
                                                    isPaymentExpired ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-gold/30 bg-gold/[0.08] text-gold'
                                                )}>
                                                    {isPaymentExpired
                                                        ? (locale === 'vi' ? 'Đã hết hạn' : 'Expired')
                                                        : `${locale === 'vi' ? 'Còn lại' : 'Time left'} ${countdownLabel}`}
                                                </div>
                                            </div>

                                            <div className="mt-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-center">
                                                <div className="flex justify-center">
                                                    {paymentData.qrCode ? (
                                                        <QRCodeCanvas qrCodeValue={paymentData.qrCode} />
                                                    ) : (
                                                        <div className="flex h-[320px] w-[320px] items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.03]">
                                                            <Loader2 className="animate-spin text-gold" size={32} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-5">
                                                    <div className="space-y-3">
                                                        <p className="text-4xl font-semibold tracking-[-0.03em] text-gold">
                                                            {formatCurrency(paymentData.amount)}
                                                        </p>
                                                        <div className="space-y-1">
                                                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                                                                {paymentData.accountName}
                                                            </p>
                                                            <p className="font-mono text-sm text-muted-foreground/70">
                                                                {paymentData.accountNumber}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="grid gap-3 sm:grid-cols-2">
                                                        <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
                                                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
                                                                {locale === 'vi' ? 'Trạng thái' : 'Status'}
                                                            </p>
                                                            <p className="mt-3 text-base font-semibold text-foreground">
                                                                {paymentDetected
                                                                    ? (locale === 'vi' ? 'Đã nhận thanh toán' : 'Payment received')
                                                                    : isPaymentExpired
                                                                        ? (locale === 'vi' ? 'Đã hết hạn' : 'Expired')
                                                                        : t('waiting_for_payment')}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-[1.4rem] border border-border/60 bg-card/40 p-4">
                                                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground/40">
                                                                {locale === 'vi' ? 'Thời gian hiệu lực' : 'Validity'}
                                                            </p>
                                                            <p className="mt-3 text-base font-semibold text-foreground">
                                                                {locale === 'vi' ? '10 phút' : '10 minutes'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {paymentDetected && (
                                                        <div className="rounded-[1.4rem] border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
                                                            {locale === 'vi'
                                                                ? 'Đã nhận thanh toán, đang chuyển sang trang thành công.'
                                                                : 'Payment detected, redirecting to success page.'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </section>

                                        <div className="flex flex-wrap gap-3">
                                            <a
                                                href={isPaymentExpired ? '#' : (paymentData.checkoutUrl || '#')}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => {
                                                    if (isPaymentExpired) e.preventDefault();
                                                }}
                                                className={cn(
                                                    'inline-flex min-h-[54px] items-center justify-center rounded-full px-6 text-sm font-semibold transition-all',
                                                    isPaymentExpired
                                                        ? 'cursor-not-allowed border border-border/60 bg-card/40 text-foreground/35'
                                                        : 'bg-gold text-luxury-black hover:bg-[#d6b779]'
                                                )}
                                            >
                                                {isPaymentExpired ? 'ĐÃ HẾT HẠN THANH TOÁN' : t('pay_via_payos_btn')}
                                                {!isPaymentExpired && <ArrowRight size={16} className="ml-3" />}
                                            </a>

                                            <button
                                                onClick={() => setStep(2)}
                                                className="inline-flex min-h-[54px] items-center justify-center rounded-full border border-border/60 px-6 text-sm font-medium text-foreground/66 transition-all hover:border-gold/35 hover:text-gold"
                                            >
                                                {t('other_method')}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <aside className="lg:sticky lg:top-28 lg:h-fit">
                            <div className="rounded-[2rem] border border-border/60 bg-card/40 p-6 shadow-[0_28px_90px_-60px_rgba(0,0,0,0.92)] sm:p-7">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/75">
                                            Order
                                        </p>
                                        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                                            {t('order_summary')}
                                        </h2>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground/38">
                                            {locale === 'vi' ? 'Bước' : 'Step'}
                                        </p>
                                        <p className="mt-2 text-sm font-semibold text-foreground">{step}/3</p>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-3">
                                    <div className="flex items-center justify-between text-sm text-foreground/48">
                                        <span>{locale === 'vi' ? `${cartItems.length} sản phẩm` : `${cartItems.length} items`}</span>
                                        <span>{appliedCoupon ? (locale === 'vi' ? 'Đã áp dụng ưu đãi' : 'Promotion applied') : (locale === 'vi' ? 'Chưa có ưu đãi' : 'No promotion')}</span>
                                    </div>

                                    <div className="max-h-[260px] space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                                        {cartItems.length > 0 ? (
                                            cartItems.map((item) => (
                                                <div key={item.id} className="flex gap-3 rounded-[1.4rem] border border-border/40 bg-muted/20 p-3">
                                                    <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-[1rem] border border-border/40 bg-muted/30">
                                                        {item.variant.product.images?.[0]?.url ? (
                                                            <img
                                                                src={item.variant.product.images[0].url}
                                                                alt={item.variant.product.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">-</div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <p className="line-clamp-2 text-sm font-medium leading-6 text-foreground">
                                                                    {item.variant.product.name}
                                                                </p>
                                                                <p className="mt-1 text-xs text-foreground/42">
                                                                    {item.variant.name}
                                                                </p>
                                                            </div>
                                                            <p className="whitespace-nowrap text-sm font-semibold text-foreground">
                                                                {formatCurrency(item.variant.price * item.quantity)}
                                                            </p>
                                                        </div>
                                                        <p className="mt-2 text-xs text-foreground/36">
                                                            {t('quantity_label', { qty: item.quantity })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="rounded-[1.4rem] border border-border/40 bg-muted/20 px-4 py-6 text-center text-sm text-foreground/38">
                                                {t('empty_cart')}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 border-t border-border/40 pt-5 space-y-4">
                                    <div className="rounded-[1.4rem] border border-border/40 bg-muted/20 p-4">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground/38">
                                            {t('shipping_address')}
                                        </p>
                                        {selectedAddress ? (
                                            <div className="mt-3 space-y-1">
                                                <p className="text-sm font-semibold text-foreground">{selectedAddress.recipientName}</p>
                                                <p className="text-sm text-foreground/58">{selectedAddress.phone}</p>
                                                <p className="text-sm leading-6 text-foreground/52">
                                                    {selectedAddress.detailAddress}, {selectedAddress.wardName}, {selectedAddress.districtName}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="mt-3 text-sm text-foreground/42">
                                                {locale === 'vi' ? 'Chưa chọn địa chỉ giao hàng.' : 'No shipping address selected yet.'}
                                            </p>
                                        )}
                                    </div>

                                    {step >= 2 && (
                                        <div className="flex items-center justify-between rounded-[1.4rem] border border-border/40 bg-muted/20 px-4 py-4">
                                            <span className="text-sm text-foreground/52">
                                                {locale === 'vi' ? 'Phương thức thanh toán' : 'Payment method'}
                                            </span>
                                            <span className="text-sm font-semibold text-foreground">
                                                {selectedPaymentLabel}
                                            </span>
                                        </div>
                                    )}

                                    {appliedCoupon ? (
                                        <div className="flex items-center justify-between rounded-[1.4rem] border border-gold/25 bg-gold/[0.08] px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-luxury-black">
                                                    <Tag size={18} />
                                                </span>
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">{appliedCoupon.code}</p>
                                                    <p className="text-xs text-gold">-{formatCurrency(appliedCoupon.discountAmount)}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleRemoveCoupon}
                                                className="rounded-full p-2 text-foreground/48 transition-colors hover:text-red-400"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsVoucherModalOpen(true)}
                                            className="flex w-full items-center justify-between rounded-[1.4rem] border border-dashed border-white/12 bg-muted/20 px-4 py-4 text-left transition-all hover:border-gold/35 hover:text-gold"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Tag size={18} className="text-foreground/50" />
                                                <span className="text-sm font-medium text-foreground/68">
                                                    {t('select_voucher')}
                                                </span>
                                            </div>
                                            {isApplyingCoupon ? (
                                                <Loader2 size={16} className="animate-spin text-gold" />
                                            ) : (
                                                <Plus size={16} className="text-foreground/40" />
                                            )}
                                        </button>
                                    )}

                                    {couponError && (
                                        <p className="text-sm text-red-400">
                                            {couponError}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-6 border-t border-border/40 pt-5 space-y-3">
                                    <div className="flex items-center justify-between text-sm text-foreground/56">
                                        <span>{t('subtotal')}</span>
                                        <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
                                    </div>
                                    {appliedCoupon && (
                                        <div className="flex items-center justify-between text-sm text-emerald-300">
                                            <span>{t('coupon_discount_label')}</span>
                                            <span>-{formatCurrency(couponDiscount)}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between text-sm text-foreground/56">
                                        <span>{t('shipping_fee_summary')}</span>
                                        <span className="font-medium text-foreground">
                                            {ghnEnabled && shippingFee > 0 ? formatCurrency(shippingFee) : t('shipping_free')}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 rounded-[1.6rem] border border-gold/20 bg-gold/[0.08] p-5">
                                    <div className="flex items-end justify-between gap-4">
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold/80">
                                                {t('total')}
                                            </p>
                                            <p className="mt-2 text-sm leading-6 text-foreground/48">
                                                {locale === 'vi'
                                                    ? 'Đã gồm phí vận chuyển và ưu đãi.'
                                                    : 'Shipping and discounts included.'}
                                            </p>
                                        </div>
                                        <p className="text-3xl font-semibold tracking-[-0.03em] text-gold">
                                            {formatCurrency(total)}
                                        </p>
                                    </div>
                                </div>

                                {primaryAction && (
                                    <button
                                        onClick={primaryAction.onClick}
                                        disabled={primaryAction.disabled}
                                        className="mt-6 inline-flex min-h-[56px] w-full items-center justify-center rounded-full bg-gold px-6 text-sm font-semibold tracking-[0.18em] uppercase text-luxury-black transition-all hover:bg-[#d6b779] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-foreground/28"
                                    >
                                        {submitting && step === 2 ? (
                                            <Loader2 size={16} className="mr-3 animate-spin" />
                                        ) : (
                                            <ArrowRight size={16} className="mr-3" />
                                        )}
                                        {primaryAction.label}
                                    </button>
                                )}

                                {step === 3 && paymentData && (
                                    <div className="mt-6 space-y-3">
                                        <a
                                            href={isPaymentExpired ? '#' : (paymentData.checkoutUrl || '#')}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => {
                                                if (isPaymentExpired) e.preventDefault();
                                            }}
                                            className={cn(
                                                'inline-flex min-h-[56px] w-full items-center justify-center rounded-full px-6 text-sm font-semibold tracking-[0.18em] uppercase transition-all',
                                                isPaymentExpired
                                                    ? 'cursor-not-allowed border border-border/60 bg-card/40 text-foreground/28'
                                                    : 'bg-gold text-luxury-black hover:bg-[#d6b779]'
                                            )}
                                        >
                                            {isPaymentExpired ? 'ĐÃ HẾT HẠN THANH TOÁN' : t('pay_via_payos_btn')}
                                        </a>

                                        <button
                                            onClick={() => setStep(2)}
                                            className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-border/60 px-6 text-sm font-medium text-foreground/68 transition-all hover:border-gold/35 hover:text-gold"
                                        >
                                            {t('other_method')}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <AnimatePresence>
                                {isVoucherModalOpen && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6"
                                        onClick={() => setIsVoucherModalOpen(false)}
                                    >
                                        <motion.div
                                            initial={{ scale: 0.96, y: 24 }}
                                            animate={{ scale: 1, y: 0 }}
                                            exit={{ scale: 0.96, y: 24 }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-full max-w-xl overflow-hidden rounded-[2.5rem] border border-border/60 bg-card p-6 shadow-[0_30px_90px_-50px_rgba(0,0,0,0.9)] sm:p-8"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/75">
                                                        {t('promotion_label')}
                                                    </p>
                                                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                                                        {t('vouchers_modal_title')}
                                                    </h3>
                                                    <p className="mt-2 text-sm text-foreground/48">
                                                        {t('vouchers_modal_subtitle')}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setIsVoucherModalOpen(false)}
                                                    className="rounded-full border border-border/60 p-2 text-foreground/48 transition-colors hover:text-foreground"
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
                                                                void applyVoucherCode(voucher.promotion.code);
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
                                                                    <p className="mt-1 text-xs text-foreground/46">
                                                                        {voucher.promotion.discountType === 'PERCENTAGE'
                                                                            ? `-${voucher.promotion.discountValue}%`
                                                                            : `-${formatCurrency(voucher.promotion.discountValue)}`}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <ArrowRight size={16} className="text-foreground/38" />
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="rounded-[1.5rem] border border-border/60 bg-card/40 px-5 py-8 text-center text-sm text-foreground/40">
                                                        {t('no_vouchers')}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
}
