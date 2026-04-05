'use client';

import { useState, useEffect } from 'react';
import { addressService, UserAddress, CreateAddressDto } from '@/services/address.service';
import { AddressCard } from '@/components/address/address-card';
import { AddressForm } from '@/components/address/address-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Loader2, Trash, Edit, Star, MapPinned } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function AddressesPage() {
    const t = useTranslations('dashboard.addresses');
    const [addresses, setAddresses] = useState<UserAddress[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);

    const fetchAddresses = async () => {
        setLoading(true);
        try {
            const data = await addressService.getAll();
            setAddresses(data);
        } catch (error) {
            toast.error(t('error.fetch'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const handleFormSubmit = async (dto: CreateAddressDto) => {
        setSubmitting(true);
        try {
            if (selectedAddress) {
                await addressService.update(selectedAddress.id, dto);
                toast.success(t('success.updated'));
            } else {
                await addressService.create(dto);
                toast.success(t('success.added'));
            }
            await fetchAddresses();
            setIsFormOpen(false);
            setSelectedAddress(null);
        } catch (error) {
            toast.error(t('error.generic'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('delete_confirm'))) return;
        try {
            await addressService.delete(id);
            toast.success(t('success.deleted'));
            await fetchAddresses();
        } catch (error) {
            toast.error(t('error.delete'));
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            await addressService.setDefault(id);
            toast.success(t('success.set_default'));
            await fetchAddresses();
        } catch (error) {
            toast.error(t('error.set_default'));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="animate-spin text-gold" size={32} />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-10">
            <div className="flex items-center justify-between mb-10">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-heading gold-gradient uppercase tracking-tighter flex items-center gap-4">
                        <MapPinned className="text-gold" />
                        {t('title')}
                    </h1>
                    <p className="text-muted-foreground font-body text-[10px] uppercase tracking-widest mt-1">
                        {t('subtitle')}
                    </p>
                </div>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setSelectedAddress(null)} className="rounded-full bg-luxury-black dark:bg-gold hover:scale-105 transition-transform">
                            <Plus className="mr-2 h-4 w-4" /> {t('add_new')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] border-gold/10 glass max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-serif text-gold uppercase tracking-widest">
                                {selectedAddress ? t('edit') : t('add_new')}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <AddressForm
                                onSubmit={handleFormSubmit}
                                initialData={selectedAddress || {}}
                                loading={submitting}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {addresses.map((address) => (
                    <div key={address.id} className="relative group">
                        <AddressCard address={address} />
                        <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!address.isDefault && (
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="rounded-full bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm border-gold/20 hover:border-gold hover:text-gold"
                                    onClick={() => handleSetDefault(address.id)}
                                    title={t('set_default')}
                                >
                                    <Star className="h-4 w-4" />
                                </Button>
                            )}
                            <Button
                                size="icon"
                                variant="outline"
                                className="rounded-full bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm border-gold/20 hover:border-gold hover:text-gold"
                                onClick={() => {
                                    setSelectedAddress(address);
                                    setIsFormOpen(true);
                                }}
                                title={t('edit')}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="destructive"
                                className="rounded-full bg-red-500/80 backdrop-blur-sm"
                                onClick={() => handleDelete(address.id)}
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {addresses.length === 0 && (
                 <div className="text-center py-20 border-2 border-dashed border-stone-200 dark:border-white/10 rounded-[2rem] glass">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-6">{t('no_addresses')}</p>
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                             <Button onClick={() => setSelectedAddress(null)} className="rounded-full bg-gold text-primary font-bold uppercase tracking-widest px-8 py-3 h-auto text-[10px]">
                                <Plus className="mr-2 h-4 w-4" /> {t('add_new')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[2.5rem] border-gold/10 glass max-w-2xl">
                             <DialogHeader>
                                <DialogTitle className="text-2xl font-serif text-gold uppercase tracking-widest">{t('add_new')}</DialogTitle>
                            </DialogHeader>
                             <div className="py-4">
                                <AddressForm onSubmit={handleFormSubmit} loading={submitting} />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </div>
    );
}
