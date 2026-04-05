import api from '@/lib/axios';
import { env } from '@/lib/env';

export type JournalSection = {
    id: string;
    subtitle?: string | null;
    content: string;
    imageUrl?: string | null;
    productId?: string | null;
    product?: any | null; // We can use any since we just need product.id or product.slug/product.name
    order: number;
};

export type Journal = {
    id: string;
    title: string;
    excerpt?: string | null;
    mainImage: string;
    category?: string | null;
    priority: number;
    isActive: boolean;
    sections?: JournalSection[];
    createdAt: string;
};

export type UploadSectionData = {
    subtitle?: string;
    content: string;
    hasNewImage?: boolean;
    existingImageUrl?: string | null;
    imageFile?: File | null;
    productId?: string;
};

interface IJournalService {
    list(): Promise<Journal[]>;
    getById(id: string): Promise<Journal>;
    create(data: {
        title: string;
        excerpt?: string;
        category?: string;
        priority?: number;
        mainImage: File;
        sections: UploadSectionData[];
    }): Promise<Journal>;
    update(id: string, data: {
        title?: string;
        excerpt?: string;
        category?: string;
        priority?: number;
        mainImage?: File | null;
        sections?: UploadSectionData[];
    }): Promise<Journal>;
    delete(id: string): Promise<{ success: boolean }>;
}

export const journalService: IJournalService = {
    list() {
        return api.get<Journal[]>('/journals').then((r) => r.data);
    },
    getById(id: string) {
        return api.get<Journal>('/journals/' + id).then((r) => r.data);
    },
    create(data) {
        const form = new FormData();
        form.append('title', data.title);
        if (data.excerpt) form.append('excerpt', data.excerpt);
        if (data.category) form.append('category', data.category);
        if (data.priority !== undefined) form.append('priority', data.priority.toString());
        form.append('mainImage', data.mainImage);

        const sectionsData = data.sections.map(s => ({
            subtitle: s.subtitle,
            content: s.content,
            hasNewImage: !!s.imageFile,
            existingImageUrl: s.existingImageUrl,
            productId: s.productId
        }));
        form.append('sectionsData', JSON.stringify(sectionsData));

        data.sections.forEach(s => {
            if (s.imageFile) {
                form.append('sectionImages', s.imageFile);
            }
        });

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        return fetch(env.NEXT_PUBLIC_API_URL + '/journals', {
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
        if (data.excerpt !== undefined) form.append('excerpt', data.excerpt);
        if (data.category !== undefined) form.append('category', data.category);
        if (data.priority !== undefined) form.append('priority', data.priority.toString());
        if (data.mainImage) form.append('mainImage', data.mainImage);

        if (data.sections) {
            const sectionsData = data.sections.map((s: UploadSectionData) => ({
                subtitle: s.subtitle,
                content: s.content,
                hasNewImage: !!s.imageFile,
                existingImageUrl: s.existingImageUrl,
                productId: s.productId
            }));
            form.append('sectionsData', JSON.stringify(sectionsData));

            data.sections.forEach((s: UploadSectionData) => {
                if (s.imageFile) {
                    form.append('sectionImages', s.imageFile);
                }
            });
        }

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        return fetch(env.NEXT_PUBLIC_API_URL + '/journals/' + id, {
            method: 'PATCH',
            headers: token ? { Authorization: 'Bearer ' + token } : {},
            body: form,
        }).then((r) => {
            if (!r.ok) return r.json().then((d) => { throw new Error(d?.message || 'Update failed'); });
            return r.json();
        });
    },
    delete(id: string) {
        return api.delete<{ success: boolean }>('/journals/' + id).then((r) => r.data);
    }
};
