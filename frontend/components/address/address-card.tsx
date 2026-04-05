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
                'relative p-6 rounded-[2rem] border-2 transition-all cursor-pointer group',
                selected
                    ? 'border-gold bg-gold/5 dark:bg-gold/10'
                    : 'border-stone-100 dark:border-white/5 bg-white dark:bg-zinc-900 hover:border-gold/50',
                className
            )}
        >
            {selected && (
                <div className="absolute top-4 right-4 text-gold">
                    <CheckCircle2 size={20} />
                </div>
            )}

            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-50 dark:bg-zinc-800 flex items-center justify-center text-stone-400 group-hover:text-gold transition-colors">
                        <User size={14} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400">{t('recipient')}</p>
                        <p className="text-sm font-bold text-luxury-black dark:text-white">{address.recipientName}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-50 dark:bg-zinc-800 flex items-center justify-center text-stone-400 group-hover:text-gold transition-colors">
                        <Phone size={14} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400">{t('phone')}</p>
                        <p className="text-sm font-medium text-luxury-black dark:text-white">{address.phone}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-stone-50 dark:border-white/5">
                    <div className="w-8 h-8 rounded-full bg-stone-50 dark:bg-zinc-800 flex items-center justify-center text-stone-400 group-hover:text-gold transition-colors flex-shrink-0">
                        <MapPin size={14} />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-1">{t('shipping')}</p>
                        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                            {address.detailAddress}, {address.wardName}, {address.districtName}, {address.provinceName}
                        </p>
                    </div>
                </div>
            </div>

            {address.isDefault && (
                <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10">
                    <span className="text-[8px] font-bold tracking-widest uppercase text-stone-400">{t('default')}</span>
                </div>
            )}
        </div>
    );
}
