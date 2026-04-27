import api from '@/lib/axios';

// Admin: /admin/brands, /admin/categories, /admin/scent-families

export type CatalogItem = {
  id: number;
  name: string;
  description?: string | null;
};

export const catalogService = {
  // Public
  getPublicBrands() {
    return api.get<CatalogItem[]>('/catalog/brands').then((r) => r.data);
  },
  getScentNotes() {
    return api.get<string[]>('/catalog/scent-notes').then((r) => r.data);
  },

  // Brands (Admin)
  getBrands() {
    return api.get<CatalogItem[]>('/admin/brands').then((r) => r.data);
  },
  getBrand(id: number) {
    return api.get<CatalogItem>('/admin/brands/' + id).then((r) => r.data);
  },
  createBrand(dto: { name: string; description?: string }) {
    return api.post<CatalogItem>('/admin/brands', dto).then((r) => r.data);
  },
  updateBrand(id: number, dto: { name?: string; description?: string }) {
    return api.patch<CatalogItem>('/admin/brands/' + id, dto).then((r) => r.data);
  },
  deleteBrand(id: number) {
    return api.delete<{ success: boolean }>('/admin/brands/' + id).then((r) => r.data);
  },

  // Categories
  getCategories() {
    return api.get<CatalogItem[]>('/admin/categories').then((r) => r.data);
  },
  getCategory(id: number) {
    return api.get<CatalogItem>('/admin/categories/' + id).then((r) => r.data);
  },
  createCategory(dto: { name: string; description?: string }) {
    return api.post<CatalogItem>('/admin/categories', dto).then((r) => r.data);
  },
  updateCategory(id: number, dto: { name?: string; description?: string }) {
    return api.patch<CatalogItem>('/admin/categories/' + id, dto).then((r) => r.data);
  },
  deleteCategory(id: number) {
    return api.delete<{ success: boolean }>('/admin/categories/' + id).then((r) => r.data);
  },

  // Scent Families
  getScentFamilies() {
    return api.get<CatalogItem[]>('/admin/scent-families').then((r) => r.data);
  },
  getScentFamily(id: number) {
    return api.get<CatalogItem>('/admin/scent-families/' + id).then((r) => r.data);
  },
  createScentFamily(dto: { name: string; description?: string }) {
    return api.post<CatalogItem>('/admin/scent-families', dto).then((r) => r.data);
  },
  updateScentFamily(id: number, dto: { name?: string; description?: string }) {
    return api.patch<CatalogItem>('/admin/scent-families/' + id, dto).then((r) => r.data);
  },
  deleteScentFamily(id: number) {
    return api.delete<{ success: boolean }>('/admin/scent-families/' + id).then((r) => r.data);
  },
};
