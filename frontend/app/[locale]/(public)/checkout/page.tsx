'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { Link, useRouter } from '@/lib/i18n';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import {
    ArrowLeft, ArrowRight, CreditCard, Wallet,
    MapPin, Phone, Loader2, Download, Tag, Check, X, User,
    MapPinned
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cartService } from '@/services/cart.service';
import { orderService } from '@/services/order.service';
import { paymentService, type PayOSPaymentResponse } from '@/services/payment.service';
import { promotionService, type PromotionValidationResponse } from '@/services/promotion.service';
import { loyaltyService } from '@/services/loyalty.service';
import {
    ghnService,
    type GHNService,
} from '@/services/ghn.service';
import { AddressSelector } from '@/components/address/address-selector';
import { UserAddress } from '@/services/address.service';
import { cn } from '@/lib/utils';

type PaymentMethod = 'COD' | 'ONLINE' | null;

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

export default function CheckoutPage() {
    const t = useTranslations('checkout');
    const locale = useLocale();
    const router = useRouter();
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
    const [orderId, setOrderId] = useState<string | null>(null);
    const [paymentData, setPaymentData] = useState<PayOSPaymentResponse | null>(null);

    // GHN shipping
    const [ghnEnabled, setGhnEnabled] = useState(false);
    const [services, setServices] = useState<GHNService[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
    const [shippingFee, setShippingFee] = useState(0);
    const [loadingFee, setLoadingFee] = useState(false);
    const [feeError, setFeeError] = useState<string | null>(null);

    // Promotion & Loyalty states
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<PromotionValidationResponse | null>(null);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [loyaltyInfo, setLoyaltyInfo] = useState({ points: 0 });
    const [usePoints, setUsePoints] = useState(false);
    const [pointsToUse, setPointsToUse] = useState(0);

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/login');
            return;
        }
        cartService.getCart().then((c) => {
            setCartItems(c.items);
            setLoading(false);
        }).catch(() => setLoading(false));

        loyaltyService.getStatus().then(setLoyaltyInfo);

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
            // Filter chỉ lấy dịch vụ hàng nhẹ (service_type_id = 2) cho nước hoa
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
    const loyaltyDiscount = usePoints ? pointsToUse * 500 : 0;
    const total = Math.max(0, subtotal - couponDiscount - loyaltyDiscount + shippingFee);

    const canProceedStep1 = Boolean(selectedAddress && (ghnEnabled ? selectedServiceId : true));

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsApplyingCoupon(true);
        setCouponError(null);
        try {
            const result = await promotionService.validate(couponCode.trim(), subtotal);
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
        setCouponCode('');
        setCouponError(null);
    };

    const handleCreateOrderIfNeeded = async (method: PaymentMethod): Promise<string | null> => {
        if (orderId) return orderId;
        if (!selectedAddress) {
            alert(t('error_missing_address'));
            return null;
        }

        setSubmitting(true);
        try {
            const order = await orderService.create({
                shippingAddress: `${selectedAddress.detailAddress}, ${selectedAddress.wardName}, ${selectedAddress.districtName}, ${selectedAddress.provinceName}`,
                recipientName: selectedAddress.recipientName,
                phone: selectedAddress.phone,
                promotionCode: appliedCoupon?.code,
                redeemPoints: usePoints ? pointsToUse : undefined,
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
            });
            setOrderId(order.id);
            return order.id;
        } catch (e: any) {
            alert(e.response?.data?.message || e.message || t('error_create_order'));
            return null;
        } finally {
            setSubmitting(false);
        }
    };

    const handlePaymentMethodSelect = async (method: PaymentMethod) => {
        setPaymentMethod(method);
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
                setStep(3);
            } catch (e: any) {
                alert(e.message || t('error_create_payment'));
            } finally {
                setSubmitting(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-gold" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background transition-colors">
            <main className="container mx-auto px-6 py-32 lg:py-40">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-16 lg:gap-24">
                        {/* Main Checkout Flow */}
                        <div className="flex-1 w-full order-2 lg:order-1">
                            <Link
                                href="/cart"
                                className="inline-flex items-center gap-3 text-[10px] font-bold tracking-[.4em] uppercase text-stone-400 hover:text-luxury-black dark:hover:text-white transition-colors mb-16 group"
                            >
                                <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
                                {t('return_to_cart')}
                            </Link>

                            <h1 className="text-5xl md:text-7xl font-serif text-luxury-black dark:text-white mb-16 tracking-tighter">
                                {t('page_title_part1')} <span className="italic uppercase">{t('page_title_part2')}</span>
                            </h1>

                            <AnimatePresence mode="wait">
                                {/* Step 1: Address Selection */}
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="space-y-10"
                                    >
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between pl-2">
                                                <h2 className="text-[10px] font-bold tracking-[.3em] uppercase text-stone-400 flex items-center gap-3 italic">
                                                    <MapPinned size={16} className="text-gold" />
                                                    {t('shipping_address')}
                                                </h2>
                                            </div>

                                            <AddressSelector
                                                selectedId={selectedAddress?.id}
                                                onSelect={setSelectedAddress}
                                            />
                                        </div>

                                        {ghnEnabled && services.length > 0 && (
                                            <div className="space-y-4 p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-stone-100 dark:border-white/5 shadow-sm">
                                                <label className="text-[10px] font-bold tracking-widest uppercase text-stone-400 pl-2 flex items-center gap-2">
                                                    {t('shipping_service')}
                                                </label>
                                                {services.length > 1 ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {services.map((s) => (
                                                            <button
                                                                key={s.service_id}
                                                                onClick={() => setSelectedServiceId(s.service_id)}
                                                                className={cn(
                                                                    "p-6 rounded-2xl border-2 text-left transition-all group",
                                                                    selectedServiceId === s.service_id
                                                                        ? "border-gold bg-gold/5"
                                                                        : "border-stone-100 dark:border-white/5 hover:border-gold/30"
                                                                )}
                                                            >
                                                                <p className="text-xs font-bold text-luxury-black dark:text-white uppercase tracking-wider group-hover:text-gold transition-colors">{s.short_name}</p>
                                                                <p className="text-[10px] text-stone-400 uppercase tracking-tighter mt-1">GHN Express</p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="p-4 bg-gold/5 rounded-2xl border border-gold/20">
                                                        <p className="text-xs font-bold text-gold uppercase tracking-wider">{services[0]?.short_name}</p>
                                                        <p className="text-[10px] text-stone-400 uppercase tracking-tighter mt-1">GHN Express - Hàng nhẹ</p>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-3 pt-4 border-t border-stone-50 dark:border-white/5">
                                                    {loadingFee ? (
                                                        <Loader2 size={18} className="animate-spin text-gold" />
                                                    ) : feeError ? (
                                                        <span className="text-[10px] text-red-500 font-bold uppercase">{feeError}</span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold uppercase text-gold tracking-[.2em] italic">
                                                            {t('estimated_shipping_fee', { fee: formatCurrency(shippingFee) })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => setStep(2)}
                                            disabled={!canProceedStep1}
                                            className="w-full py-6 bg-gold-btn-gradient text-white rounded-full font-bold tracking-[.4em] uppercase text-[10px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {t('continue_to_payment')}
                                            <ArrowRight size={16} className="inline ml-4 group-hover:translate-x-2 transition-transform" />
                                        </button>
                                    </motion.div>
                                )}

                                {/* Step 2: Payment Method */}
                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="space-y-8"
                                    >
                                        <h2 className="text-2xl font-serif text-luxury-black dark:text-white mb-8">
                                            {t.rich('payment_method_title', {
                                                span: (chunks) => <span className="italic">{chunks}</span>
                                            })}
                                        </h2>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <button
                                                onClick={() => handlePaymentMethodSelect('COD')}
                                                disabled={submitting}
                                                className="p-8 rounded-[3rem] border-2 border-stone-100 dark:border-white/5 bg-white dark:bg-zinc-900 flex flex-col items-center gap-6 text-center hover:border-gold transition-all group disabled:opacity-50 shadow-sm"
                                            >
                                                <div className="w-16 h-16 rounded-full bg-stone-50 dark:bg-zinc-800 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-white transition-all">
                                                    {submitting && paymentMethod === 'COD' ? <Loader2 className="animate-spin" /> : <Wallet size={32} strokeWidth={1.5} />}
                                                </div>
                                                <div className="space-y-2">
                                                    <span className="block text-xs font-bold tracking-[.2em] uppercase text-luxury-black dark:text-white">
                                                        {t('cod_label')}
                                                    </span>
                                                    <span className="text-[10px] text-stone-400 uppercase tracking-widest italic">
                                                        COD
                                                    </span>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => handlePaymentMethodSelect('ONLINE')}
                                                disabled={submitting}
                                                className="p-8 rounded-[3rem] border-2 border-stone-100 dark:border-white/5 bg-white dark:bg-zinc-900 flex flex-col items-center gap-6 text-center hover:border-gold transition-all group disabled:opacity-50 shadow-sm"
                                            >
                                                <div className="w-16 h-16 rounded-full bg-stone-50 dark:bg-zinc-800 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-white transition-all">
                                                    {submitting && paymentMethod === 'ONLINE' ? <Loader2 className="animate-spin" /> : <CreditCard size={32} strokeWidth={1.5} />}
                                                </div>
                                                <div className="space-y-2">
                                                    <span className="block text-xs font-bold tracking-[.2em] uppercase text-luxury-black dark:text-white">
                                                        {t('online_payment_label')}
                                                    </span>
                                                    <span className="text-[10px] text-stone-400 uppercase tracking-widest italic">
                                                        VietQR / PayOS
                                                    </span>
                                                </div>
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => setStep(1)}
                                            className="w-full py-4 border border-stone-100 dark:border-white/5 rounded-full font-bold tracking-[.3em] uppercase text-[10px] text-stone-400 hover:text-luxury-black dark:hover:text-white transition-all"
                                        >
                                            {t('back_to_address')}
                                        </button>
                                    </motion.div>
                                )}

                                {/* Step 3: QR Code */}
                                {step === 3 && paymentData && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="space-y-8"
                                    >
                                        <div className="text-center space-y-4">
                                            <h2 className="text-3xl font-serif text-luxury-black dark:text-white">
                                                {t.rich('qr_title', {
                                                    span: (chunks) => <span className="italic">{chunks}</span>
                                                })}
                                            </h2>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                                                {t('qr_desc_scanning')}
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-center gap-8 p-12 bg-white dark:bg-zinc-900 rounded-[3rem] border border-stone-100 dark:border-white/5 shadow-2xl">
                                            {paymentData.qrCode ? (
                                                <QRCodeCanvas qrCodeValue={paymentData.qrCode} />
                                            ) : (
                                                <div className="w-64 h-64 bg-stone-50 dark:bg-zinc-800 flex items-center justify-center rounded-3xl">
                                                    <Loader2 className="w-12 h-12 text-gold animate-spin" />
                                                </div>
                                            )}

                                            <div className="text-center space-y-3">
                                                <p className="text-2xl font-serif text-gold italic">
                                                    {formatCurrency(paymentData.amount)}
                                                </p>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-luxury-black dark:text-white uppercase tracking-widest">
                                                        {paymentData.accountName}
                                                    </p>
                                                    <p className="text-[10px] text-stone-400 font-mono tracking-tighter">
                                                        {paymentData.accountNumber}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 py-3 px-6 bg-stone-50 dark:bg-white/5 rounded-full border border-stone-100 dark:border-white/5">
                                                <Loader2 className="w-4 h-4 animate-spin text-gold" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{t('waiting_for_payment')}</span>
                                            </div>
                                        </div>

                                        <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-[2rem] p-8">
                                            <p className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-widest text-center mb-6">
                                                {t('pay_via_payos_desc')}
                                            </p>
                                            <a
                                                href={paymentData.checkoutUrl || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full py-5 bg-gold text-white rounded-full font-bold tracking-[.3em] uppercase text-[10px] text-center hover:bg-gold/90 transition-all shadow-lg"
                                            >
                                                {t('pay_via_payos_btn')}
                                                <ArrowRight size={16} className="inline ml-3" />
                                            </a>
                                        </div>

                                        <button
                                            onClick={() => setStep(2)}
                                            className="w-full py-4 border border-stone-100 dark:border-white/5 rounded-full font-bold tracking-[.3em] uppercase text-[10px] text-stone-400 hover:text-luxury-black dark:hover:text-white transition-all"
                                        >
                                            {t('other_method')}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Order Summary Sidebar */}
                        <div className="w-full lg:w-[450px] sticky top-40 order-1 lg:order-2">
                            <div className="bg-white dark:bg-zinc-900 rounded-[4rem] p-12 border border-stone-100 dark:border-white/5 shadow-2xl">
                                <h3 className="text-2xl font-serif text-luxury-black dark:text-white uppercase tracking-[.2em] mb-12 pb-8 border-b border-stone-100 dark:border-white/5 italic">
                                    {t('order_summary')}
                                </h3>

                                <div className="space-y-10 mb-12 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {cartItems.length > 0 ? (
                                        cartItems.map((item) => (
                                            <div key={item.id} className="flex gap-6 group">
                                                <div className="relative w-24 h-32 rounded-2xl overflow-hidden bg-stone-50 dark:bg-zinc-800 flex-shrink-0 border border-stone-100 dark:border-white/5">
                                                    {item.variant.product.images?.[0]?.url ? (
                                                        <img src={item.variant.product.images[0].url} alt={item.variant.product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-stone-500 font-serif italic">—</div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h4 className="text-[10px] font-bold text-luxury-black dark:text-white uppercase tracking-[.2em] mb-1">
                                                                {item.variant.product.name}
                                                            </h4>
                                                            <p className="text-[10px] text-gold uppercase tracking-widest font-bold italic">
                                                                {item.variant.name}
                                                            </p>
                                                        </div>
                                                        <span className="text-xs font-bold text-luxury-black dark:text-white">
                                                            {formatCurrency(item.variant.price * item.quantity)}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-stone-400 uppercase tracking-widest italic mb-6">
                                                        {t('quantity_label', { qty: item.quantity })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-20 text-center space-y-4 opacity-30">
                                            <p className="text-[10px] font-bold tracking-widest uppercase italic">
                                                {t('empty_cart')}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Coupon Section */}
                                <div className="mt-8 pt-8 border-t border-stone-100 dark:border-white/5">
                                    <div className="flex gap-3">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                placeholder={t('coupon_code')}
                                                disabled={!!appliedCoupon || isApplyingCoupon}
                                                className="w-full h-14 bg-stone-50 dark:bg-zinc-950 border border-stone-100 dark:border-white/5 rounded-2xl px-6 text-[10px] font-bold tracking-[.3em] uppercase focus:ring-0 focus:border-gold transition-all disabled:opacity-50"
                                            />
                                            {appliedCoupon && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                                                    <Check size={20} />
                                                </div>
                                            )}
                                        </div>
                                        {appliedCoupon ? (
                                            <button
                                                onClick={handleRemoveCoupon}
                                                className="h-14 aspect-square bg-stone-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-stone-400 hover:text-red-500 transition-colors"
                                            >
                                                <X size={20} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleApplyCoupon}
                                                disabled={!couponCode || isApplyingCoupon}
                                                className="px-8 bg-luxury-black dark:bg-white text-white dark:text-luxury-black rounded-2xl text-[10px] font-bold tracking-[.3em] uppercase hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
                                            >
                                                {isApplyingCoupon ? <Loader2 className="animate-spin" size={16} /> : <Tag size={16} />}
                                                {t('apply')}
                                            </button>
                                        )}
                                    </div>
                                    {couponError && (
                                        <p className="mt-4 text-[10px] font-bold text-red-500 uppercase tracking-widest leading-relaxed italic pl-2">
                                            {couponError}
                                        </p>
                                    )}
                                    {appliedCoupon && (
                                        <p className="mt-4 text-[10px] font-bold text-green-500 uppercase tracking-widest leading-relaxed flex items-center gap-2 italic pl-2">
                                            <Tag size={12} /> {t('coupon_applied', { amount: formatCurrency(appliedCoupon.discountAmount) })}
                                        </p>
                                    )}

                                    {loyaltyInfo.points >= 100 && (
                                        <div className="mt-8 pt-6 border-t border-stone-100 dark:border-white/5">
                                            <label className="flex items-center gap-4 cursor-pointer group">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        checked={usePoints}
                                                        onChange={(e) => {
                                                            setUsePoints(e.target.checked);
                                                            if (e.target.checked) setPointsToUse(Math.min(loyaltyInfo.points, Math.floor((subtotal - couponDiscount) / 500)));
                                                        }}
                                                        className="sr-only"
                                                    />
                                                    <div className={`w-10 h-6 rounded-full transition-colors ${usePoints ? 'bg-gold' : 'bg-stone-100 dark:bg-zinc-800'}`} />
                                                    <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${usePoints ? 'translate-x-4' : ''}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-luxury-black dark:text-white">
                                                        {t('loyalty_points')}
                                                    </p>
                                                    <p className="text-[8px] text-stone-400 uppercase tracking-tighter font-bold">
                                                        {t('points_balance_summary', { points: loyaltyInfo.points, value: formatCurrency(loyaltyInfo.points * 500) })}
                                                    </p>
                                                </div>
                                            </label>

                                            {usePoints && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    className="mt-4 pl-14"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <input
                                                            type="number"
                                                            value={pointsToUse}
                                                            onChange={(e) => setPointsToUse(Math.min(loyaltyInfo.points, Number(e.target.value)))}
                                                            className="w-24 h-10 bg-stone-50 dark:bg-zinc-950 border border-stone-100 dark:border-white/5 rounded-xl px-4 text-xs font-bold outline-none border-gold"
                                                        />
                                                        <span className="text-[10px] text-stone-400 uppercase font-bold tracking-widest italic">-{formatCurrency(pointsToUse * 500)}</span>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6 pt-12 border-t border-stone-100 dark:border-white/5">
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-stone-400">
                                            <span>{t('subtotal')}</span>
                                            <span className="text-luxury-black dark:text-white">
                                                {formatCurrency(subtotal)}
                                            </span>
                                        </div>
                                        {appliedCoupon && (
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-green-500 italic">
                                                <span>{t('coupon_discount_label')}</span>
                                                <span className="">
                                                    -{formatCurrency(couponDiscount)}
                                                </span>
                                            </div>
                                        )}
                                        {usePoints && loyaltyDiscount > 0 && (
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gold italic">
                                                <span>{t('loyalty_points_summary')}</span>
                                                <span className="">
                                                    -{formatCurrency(loyaltyDiscount)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-stone-400">
                                            <span>{t('shipping_fee_summary')}</span>
                                            <span className={shippingFee > 0 ? 'text-luxury-black dark:text-white' : 'text-gold italic'}>
                                                {ghnEnabled && shippingFee > 0
                                                    ? formatCurrency(shippingFee)
                                                    : t('shipping_free')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-8 mt-6 flex justify-between items-center border-t border-stone-100 dark:border-white/10">
                                        <span className="text-[10px] font-bold tracking-[.5em] uppercase text-stone-400">
                                            {t('total')}
                                        </span>
                                        <span className="text-4xl font-serif text-luxury-black dark:text-white italic">
                                            {formatCurrency(total)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
