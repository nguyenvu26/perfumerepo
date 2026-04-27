'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useScentDNAStore } from '@/store/scent-dna.store';

export function ScentDNAInitializer() {
  const { user } = useAuthStore();
  const { fetchPreferences } = useScentDNAStore();

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user, fetchPreferences]);

  return null;
}
