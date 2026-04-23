'use client';

import { UserAddress } from '@/services/address.service';
import { cn } from '@/lib/utils';
import { MapPin, Phone, User, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AddressCardProps {
    address: UserAddress;
    selected?: boolean;
    onClick?: () => void;
    className?: string;
}

export function AddressCard({ address, selected, onClick, className }: AddressCardProps) {
    const t = useTranslations('address.card');

    return (
        <div
            onClick={onClick}
            className={cn(
                'relative rounded-[2rem] border-2 p-7 transition-all cursor-pointer group shadow-[0_20px_50px_-36px_rgba(15,23,42,0.28)]',
                selected
                    ? 'border-gold bg-gold/5 dark:bg-gold/10'
                    : 'border-stone-100 dark:border-white/5 bg-white dark:bg-zinc-900 hover:border-gold/50',
                className
            )}
        >
            {selected && (
                <div className="absolute right-5 top-5 text-gold">
                    <CheckCircle2 size={22} />
                </div>
            )}

            <div className="space-y-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-50 text-stone-500 transition-colors group-hover:text-gold dark:bg-zinc-800 dark:text-stone-400">
                        <User size={16} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">{t('recipient')}</p>
                        <p className="text-lg font-semibold text-luxury-black dark:text-white">{address.recipientName}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-50 text-stone-500 transition-colors group-hover:text-gold dark:bg-zinc-800 dark:text-stone-400">
                        <Phone size={16} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">{t('phone')}</p>
                        <p className="text-base font-medium text-luxury-black dark:text-white">{address.phone}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3 border-t border-stone-50 pt-3 dark:border-white/5">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-stone-50 text-stone-500 transition-colors group-hover:text-gold dark:bg-zinc-800 dark:text-stone-400">
                        <MapPin size={16} />
                    </div>
                    <div className="flex-1">
                        <p className="mb-1 text-xs font-semibold text-stone-500 dark:text-stone-400">{t('shipping')}</p>
                        <p className="text-sm leading-7 text-stone-600 dark:text-stone-300">
                            {address.detailAddress}, {address.wardName}, {address.districtName}, {address.provinceName}
                        </p>
                    </div>
                </div>
            </div>

            {address.isDefault && (
                <div className="mt-5 inline-flex items-center rounded-full border border-stone-200 bg-stone-100 px-3 py-1.5 dark:border-white/10 dark:bg-white/5">
                    <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">{t('default')}</span>
                </div>
            )}
        </div>
    );
}
