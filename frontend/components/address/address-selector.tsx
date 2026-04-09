'use client';

import { useState, useEffect } from 'react';
import { addressService, UserAddress, CreateAddressDto } from '@/services/address.service';
import { AddressCard } from './address-card';
import { AddressForm } from './address-form';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddressSelectorProps {
    onSelect: (address: UserAddress) => void;
    selectedId?: string;
}

export function AddressSelector({ onSelect, selectedId }: AddressSelectorProps) {
    const [addresses, setAddresses] = useState<UserAddress[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchAddresses = async () => {
        try {
            const data = await addressService.getAll();
            setAddresses(data);
            if (data.length > 0 && !selectedId) {
                const defaultAddr = data.find((a) => a.isDefault) || data[0];
                onSelect(defaultAddr);
            }
        } catch (error) {
            console.error('Failed to fetch addresses', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const handleCreateAddress = async (dto: CreateAddressDto) => {
        setSubmitting(true);
        try {
            const newAddr = await addressService.create(dto);
            setAddresses([newAddr, ...addresses]);
            onSelect(newAddr);
            setShowForm(false);
        } catch (error) {
            console.error('Failed to create address', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
                <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400">Đang tải sổ địa chỉ...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AnimatePresence mode="wait">
                {showForm ? (
                    <motion.div
                        key="address-form"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <button
                            onClick={() => setShowForm(false)}
                            className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-stone-400 hover:text-luxury-black dark:hover:text-white transition-colors"
                        >
                            <ChevronLeft size={14} /> Quay lại danh sách
                        </button>
                        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-stone-100 dark:border-white/5 shadow-sm">
                            <h3 className="text-xl font-serif text-luxury-black dark:text-white mb-8">Thêm địa chỉ mới</h3>
                            <AddressForm onSubmit={handleCreateAddress} loading={submitting} />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="address-list"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {addresses.map((address) => (
                                <AddressCard
                                    key={address.id}
                                    address={address}
                                    selected={selectedId === address.id}
                                    onClick={() => onSelect(address)}
                                />
                            ))}
                            <button
                                onClick={() => setShowForm(true)}
                                className="h-full min-h-[150px] p-6 rounded-[2rem] border-2 border-dashed border-stone-200 dark:border-white/10 flex flex-col items-center justify-center gap-4 group hover:border-gold hover:bg-gold/5 transition-all"
                            >
                                <div className="w-12 h-12 rounded-full bg-stone-50 dark:bg-zinc-800 flex items-center justify-center text-stone-400 group-hover:text-gold group-hover:bg-gold/10 transition-all">
                                    <Plus size={24} />
                                </div>
                                <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 group-hover:text-gold">
                                    Thêm địa chỉ mới
                                </span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
