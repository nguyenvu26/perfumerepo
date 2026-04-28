import api from '@/lib/axios';

export interface ReviewImage {
  id: string;
  imageUrl: string;
}

export interface Review {
  id: string;
  userId: string;
  productId: string;
  orderItemId: number;
  rating: number;
  content?: string;
  isVerified: boolean;
  isHidden: boolean;
  isPinned: boolean;
  flagged: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName?: string;
    avatarUrl?: string;
  };
  images: ReviewImage[];
  _count?: {
    reactions: number;
  };
}

export interface ReviewSummary {
  id: string;
  productId: string;
  summary: string;
  pros?: string;
  cons?: string;
  keywords?: string;
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  updatedAt: string;
}

export interface ReviewListRes {
  items: Review[];
  total: number;
}

export interface ReviewStats {
  average: number;
  total: number;
  distribution: Record<number, number>;
}

export const reviewService = {
  create(dto: {
    productId: string;
    orderItemId: number;
    rating: number;
    content?: string;
    images?: string[];
  }) {
    return api.post<Review>('/reviews', dto).then((r) => r.data);
  },

  uploadImages(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    return api
      .post<string[]>('/reviews/upload-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  getByProduct(productId: string, skip = 0, take = 20) {
    return api
      .get<ReviewListRes>(`/reviews/product/${productId}`, { params: { skip, take } })
      .then((r) => r.data);
  },

  getSummary(productId: string) {
    return api
      .get<ReviewSummary>(`/reviews/product/${productId}/summary`)
      .then((r) => r.data);
  },

  getStats(productId: string) {
    return api
      .get<ReviewStats>(`/reviews/product/${productId}/stats`)
      .then((r) => r.data);
  },

  update(id: string, dto: { rating?: number; content?: string; images?: string[] }) {
    return api.patch<Review>(`/reviews/${id}`, dto).then((r) => r.data);
  },

  remove(id: string) {
    return api.delete(`/reviews/${id}`).then((r) => r.data);
  },

  react(id: string, type: 'HELPFUL' | 'NOT_HELPFUL') {
    return api.post(`/reviews/${id}/react`, { type }).then((r) => r.data);
  },

  report(id: string, reason: string) {
    return api.post(`/reviews/${id}/report`, { reason }).then((r) => r.data);
  },

  // Admin APIs
  adminList(params: { productId?: string; userId?: string; rating?: number; skip?: number; take?: number }) {
    return api.get<ReviewListRes>('/admin/reviews', { params }).then((r) => r.data);
  },

  adminHide(id: string) {
    return api.patch(`/admin/reviews/${id}/hide`).then((r) => r.data);
  },

  adminShow(id: string) {
    return api.patch(`/admin/reviews/${id}/show`).then((r) => r.data);
  },

  adminPin(id: string) {
    return api.patch(`/admin/reviews/${id}/pin`).then((r) => r.data);
  },

  adminUnpin(id: string) {
    return api.patch(`/admin/reviews/${id}/unpin`).then((r) => r.data);
  },

  adminFlag(id: string) {
    return api.patch(`/admin/reviews/${id}/flag`).then((r) => r.data);
  },

  adminDelete(id: string) {
    return api.delete(`/admin/reviews/${id}`).then((r) => r.data);
  },

  adminGetReports() {
    return api.get('/admin/reviews/reports').then((r) => r.data);
  },
};
