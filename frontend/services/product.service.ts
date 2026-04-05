import api from '@/lib/axios';
import { env } from '@/lib/env';

// Public: GET /products, GET /products/:id
// Admin: GET/POST/PATCH/DELETE /admin/products, POST/DELETE /admin/products/:id/images

export type ProductVariant = {
  id: string;
  name: string;
  sku?: string | null;
  price: number;
  stock: number;
  isActive: boolean;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  brandId: number;
  categoryId?: number | null;
  scentFamilyId?: number | null;
  description?: string | null;
  gender?: string | null;
  longevity?: string | null;
  concentration?: string | null;
  isActive: boolean;
  brand?: { id: number; name: string };
  category?: { id: number; name: string } | null;
  images?: { id: number; url: string; order: number; publicId?: string }[];
  variants?: ProductVariant[];
  notes?: { note: { name: string; type: 'TOP' | 'MIDDLE' | 'BASE' } }[];
};

export type ProductListRes = {
  items: Product[];
  total: number;
  skip: number;
  take: number;
};

interface IProductService {
  list(params?: { search?: string; skip?: number; take?: number; brandId?: number; categoryId?: number }): Promise<ProductListRes>;
  getById(id: string): Promise<Product>;
  adminList(params?: { search?: string; skip?: number; take?: number; brandId?: number; categoryId?: number }): Promise<ProductListRes>;
  adminCreate(dto: {
    name: string;
    slug: string;
    brandId: number;
    categoryId?: number | null;
    scentFamilyId?: number | null;
    description?: string;
    gender?: string;
    longevity?: string;
    concentration?: string;
    isActive?: boolean;
    variants: Omit<ProductVariant, 'id' | 'isActive'>[];
  }): Promise<Product>;
  adminUpdate(id: string, dto: Partial<Parameters<IProductService['adminCreate']>[0]>): Promise<Product>;
  adminDelete(id: string): Promise<{ success: boolean }>;
  adminGetById(id: string): Promise<Product>;
  adminUploadImages(productId: string, files: File[]): Promise<Product>;
  adminDeleteImage(productId: string, imageId: number | string): Promise<{ success: boolean }>;
}

export const productService: IProductService = {
  // Public
  list(params?: { search?: string; skip?: number; take?: number; brandId?: number; categoryId?: number }) {
    return api.get<ProductListRes>('/products', { params }).then((r) => r.data);
  },
  getById(id: string) {
    return api.get<Product>('/products/' + id).then((r) => r.data);
  },

  // Admin
  adminList(params?: { search?: string; skip?: number; take?: number; brandId?: number; categoryId?: number }) {
    return api.get<ProductListRes>('/admin/products', { params }).then((r) => r.data);
  },
  adminCreate(dto: {
    name: string;
    slug: string;
    brandId: number;
    categoryId?: number | null;
    scentFamilyId?: number | null;
    description?: string;
    gender?: string;
    longevity?: string;
    concentration?: string;
    isActive?: boolean;
    variants: Omit<ProductVariant, 'id' | 'isActive'>[];
  }) {
    return api.post<Product>('/admin/products', dto).then((r) => r.data);
  },
  adminUpdate(id: string, dto: Partial<Parameters<IProductService['adminCreate']>[0]>) {
    return api.patch<Product>('/admin/products/' + id, dto).then((r) => r.data);
  },
  adminDelete(id: string) {
    return api.delete<{ success: boolean }>('/admin/products/' + id).then((r) => r.data);
  },
  adminGetById(id: string) {
    return api.get<Product>('/admin/products/' + id).then((r) => r.data);
  },
  adminUploadImages(productId: string, files: File[]): Promise<Product> {
    const form = new FormData();
    files.forEach((f) => form.append('images', f));
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return fetch(env.NEXT_PUBLIC_API_URL + '/admin/products/' + productId + '/images', {
      method: 'POST',
      headers: token ? { Authorization: 'Bearer ' + token } : {},
      body: form,
    }).then((r) => {
      if (!r.ok) return r.json().then((d) => { throw new Error(d?.message || 'Upload failed'); });
      return r.json();
    });
  },
  adminDeleteImage(productId: string, imageId: number | string) {
    return api.delete<{ success: boolean }>('/admin/products/' + productId + '/images/' + imageId).then((r) => r.data);
  },
};
