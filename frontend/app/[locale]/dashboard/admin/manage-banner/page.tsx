'use client';

import { useEffect, useState } from 'react';
import { bannerService, Banner } from '@/services/banner.service';
import { Trash2, Plus, ImageIcon, Edit3, X, Save } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function ManageBannerPage() {
    const t = useTranslations('dashboard.admin.manageBanner');
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const loadBanners = () => {
        setLoading(true);
        bannerService.list()
            .then(b => setBanners(b))
            .finally(() => setLoading(false));
    };

    const resetForm = () => {
        setEditingId(null);
        setTitle('');
        setSubtitle('');
        setLinkUrl('');
        setFile(null);
    };

    const startEdit = (b: Banner) => {
        setEditingId(b.id);
        setTitle(b.title || '');
        setSubtitle(b.subtitle || '');
        setLinkUrl(b.linkUrl || '');
        setFile(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        loadBanners();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm(t('list.delete_confirm'))) return;
        try {
            await bannerService.delete(id);
            loadBanners();
        } catch (e) {
            console.error(e);
            alert(t('list.delete_error'));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId && !file) return alert(t('list.error_no_image'));

        setIsSubmitting(true);
        try {
            if (editingId) {
                await bannerService.update(editingId, { title, subtitle, linkUrl, ...(file ? { image: file } : {}) });
                alert(t('list.update_success'));
            } else {
                await bannerService.create({ title, subtitle, linkUrl, image: file! });
                alert(t('list.create_success'));
            }
            resetForm();
            loadBanners();
        } catch (err) {
            console.error(err);
            alert(t('list.action_error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-serif text-foreground mb-8">{t('title')}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
                {/* Form */}
                <div className="bg-background border border-border rounded-2xl p-6 h-fit sticky top-24 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold">{editingId ? t('form.update_title') : t('form.add_title')}</h2>
                        {editingId && (
                            <button type="button" onClick={resetForm} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground">
                                <X size={14} /> {t('form.cancel_edit')}
                            </button>
                        )}
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                                {t('form.image_label')} {editingId && t('form.image_hint')}
                            </label>
                            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm border border-dashed border-border p-3 rounded-xl" accept="image/*" />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">{t('form.title_label')}</label>
                            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-transparent text-sm" placeholder={t('form.title_placeholder')} />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">{t('form.subtitle_label')}</label>
                            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-transparent text-sm" placeholder={t('form.subtitle_placeholder')} />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">{t('form.link_label')}</label>
                            <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-transparent text-sm" placeholder={t('form.link_placeholder')} />
                        </div>

                        <button disabled={isSubmitting} className="w-full mt-6 flex items-center justify-center gap-2 bg-gold text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-gold-light transition-all shadow-lg shadow-gold/20 disabled:opacity-50">
                            {isSubmitting ? t('form.submitting') : editingId ? <><Save size={16} /> {t('form.submit_update')}</> : <><Plus size={16} /> {t('form.submit_add')}</>}
                        </button>
                    </form>
                </div>

                {/* List */}
                <div>
                    <h2 className="text-lg font-bold mb-4">{t('list.title')}</h2>
                    {loading ? (
                        <p className="text-sm text-muted-foreground">{t('list.loading')}</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {banners.map(b => (
                                <div key={b.id} className="relative bg-background border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
                                    <div className="relative aspect-video bg-secondary/30 flex items-center justify-center">
                                        {b.imageUrl ? (
                                            <Image src={b.imageUrl} alt={b.title || 'Banner'} fill className="object-cover" />
                                        ) : (
                                            <ImageIcon className="opacity-20" size={40} />
                                        )}

                                    </div>
                                    <div className="p-4 flex-1 flex flex-col">
                                        <h3 className="text-sm font-bold truncate">{b.title || t('list.no_title')}</h3>
                                        <p className="text-xs text-muted-foreground truncate">{b.subtitle || t('list.no_subtitle')}</p>
                                        <div className="mt-auto pt-4 flex justify-end gap-2 items-center border-t border-border mt-4">
                                            <button onClick={() => startEdit(b)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors">
                                                <Edit3 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(b.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
