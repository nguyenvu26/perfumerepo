import api from '@/lib/axios';
import { env } from '@/lib/env';

export type Banner = {
    id: string;
    title?: string | null;
    subtitle?: string | null;
    imageUrl: string;
    linkUrl?: string | null;
    isActive: boolean;
};

interface IBannerService {
    list(): Promise<Banner[]>;
    create(data: {
        title?: string;
        subtitle?: string;
        linkUrl?: string;
        image: File;
    }): Promise<Banner>;
    update(id: string, data: {
        title?: string;
        subtitle?: string;
        linkUrl?: string;
        image?: File;
    }): Promise<Banner>;
    delete(id: string): Promise<{ success: boolean }>;
}

export const bannerService: IBannerService = {
    list() {
        return api.get<Banner[]>('/banners').then((r) => r.data);
    },
    create(data) {
        const form = new FormData();
        if (data.title) form.append('title', data.title);
        if (data.subtitle) form.append('subtitle', data.subtitle);
        if (data.linkUrl) form.append('linkUrl', data.linkUrl);
        if (data.image) form.append('image', data.image);

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        return fetch(env.NEXT_PUBLIC_API_URL + '/banners', {
            method: 'POST',
            headers: token ? { Authorization: 'Bearer ' + token } : {},
            body: form,
        }).then((r) => {
            if (!r.ok) return r.json().then((d) => { throw new Error(d?.message || 'Upload failed'); });
            return r.json();
        });
    },
    update(id: string, data: any) {
        const form = new FormData();
        if (data.title !== undefined) form.append('title', data.title);
        if (data.subtitle !== undefined) form.append('subtitle', data.subtitle);
        if (data.linkUrl !== undefined) form.append('linkUrl', data.linkUrl);
        if (data.image) form.append('image', data.image);

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        return fetch(env.NEXT_PUBLIC_API_URL + '/banners/' + id, {
            method: 'PATCH',
            headers: token ? { Authorization: 'Bearer ' + token } : {},
            body: form,
        }).then(r => {
            if (!r.ok) return r.json().then(d => { throw new Error(d.message); });
            return r.json();
        });
    },
    delete(id: string) {
        return api.delete<{ success: boolean }>('/banners/' + id).then((r) => r.data);
    }
};
