'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Edit, Loader2, Plus, Star, Trash } from 'lucide-react';

import { addressService, type CreateAddressDto, type UserAddress } from '@/services/address.service';
import { AddressCard } from '@/components/address/address-card';
import { AddressForm } from '@/components/address/address-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useUIStore } from '@/store/ui.store';

type AddressManagerProps = {
  className?: string;
};

export function AddressManager({ className }: AddressManagerProps) {
  const t = useTranslations('dashboard.addresses');

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const { setModalOpen } = useUIStore();

  useEffect(() => {
    setModalOpen(isFormOpen);
  }, [isFormOpen, setModalOpen]);

  const defaultAddress = useMemo(
    () => addresses.find((a) => a.isDefault) ?? addresses[0] ?? null,
    [addresses],
  );

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const data = await addressService.getAll();
      setAddresses(data);
    } catch {
      toast.error(t('error.fetch'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAddresses();
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
    } catch {
      toast.error(t('error.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('delete_confirm', { type: t('title') }))) return;
    try {
      await addressService.delete(id);
      toast.success(t('success.deleted'));
      await fetchAddresses();
    } catch {
      toast.error(t('error.delete'));
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await addressService.setDefault(id);
      toast.success(t('success.set_default'));
      await fetchAddresses();
    } catch {
      toast.error(t('error.set_default'));
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-gold" size={28} />
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-start justify-between gap-6 mb-6">
        <div>
          <h4 className="font-heading text-[10px] uppercase tracking-widest text-muted-foreground">
            {t('title')}
          </h4>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mt-1">
            {t('subtitle')}
          </p>
        </div>

        <Dialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setSelectedAddress(null);
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => setSelectedAddress(null)}
              className="rounded-full bg-luxury-black dark:bg-gold text-white hover:scale-105 transition-transform"
            >
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

      {addresses.length === 0 ? (
        <div className="text-center py-14 border-2 border-dashed border-stone-200 dark:border-white/10 rounded-[2rem] glass">
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            {t('no_addresses')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {defaultAddress ? (
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t('default_label')}</p>
              <AddressCard address={defaultAddress} />
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <div key={address.id} className="relative group">
                <AddressCard address={address} />
                <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!address.isDefault ? (
                    <Button
                      size="icon"
                      variant="outline"
                      className="rounded-full bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm border-gold/20 hover:border-gold hover:text-gold"
                      onClick={() => void handleSetDefault(address.id)}
                      title={t('set_default')}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  ) : null}
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
                    onClick={() => void handleDelete(address.id)}
                    title={t('delete')}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

