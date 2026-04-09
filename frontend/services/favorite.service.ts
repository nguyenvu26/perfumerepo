import api from '@/lib/axios';
import type { Product } from '@/services/product.service';

export type FavoriteItem = {
  id: string;
  name: string;
  slug: string;
  brandName?: string;
  imageUrl?: string;
  variantId?: string;
  variantName?: string;
  price?: number;
  addedAt: string;
};

const FAVORITES_UPDATED_EVENT = 'favorites:updated';

type FavoriteApiRow = {
  productId: string;
  variantId?: string | null;
  createdAt: string;
  product: Product;
  variant?: {
    id: string;
    name: string;
    price: number;
  } | null;
};

const toFavoriteItem = (row: FavoriteApiRow): FavoriteItem => ({
  id: row.productId,
  name: row.product.name,
  slug: row.product.slug,
  brandName: row.product.brand?.name,
  imageUrl: row.product.images?.[0]?.url,
  variantId: row.variant?.id ?? row.variantId ?? undefined,
  variantName: row.variant?.name,
  price: row.variant?.price ?? row.product.variants?.[0]?.price,
  addedAt: row.createdAt,
});

const dispatchUpdated = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT));
};

export const favoriteService = {
  eventName: FAVORITES_UPDATED_EVENT,
  async getFavorites(): Promise<FavoriteItem[]> {
    const rows = await api.get<FavoriteApiRow[]>('/favorites').then((r) => r.data);
    return rows.map(toFavoriteItem);
  },
  async isFavorite(productId: string): Promise<boolean> {
    const res = await api.get<{ isFavorite: boolean }>(`/favorites/${productId}/status`).then((r) => r.data);
    return res.isFavorite;
  },
  async addProduct(productId: string, variantId?: string): Promise<void> {
    await api.post(`/favorites/${productId}`, { variantId });
    dispatchUpdated();
  },
  async removeProduct(productId: string): Promise<void> {
    await api.delete(`/favorites/${productId}`);
    dispatchUpdated();
  },
  async toggleProduct(productId: string, currentFavorite: boolean, variantId?: string): Promise<boolean> {
    if (currentFavorite) {
      await this.removeProduct(productId);
      return false;
    }
    await this.addProduct(productId, variantId);
    return true;
  },
};
