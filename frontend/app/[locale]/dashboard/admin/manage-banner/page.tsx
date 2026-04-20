'use client';

import { useEffect, useState } from 'react';
import { bannerService, Banner } from '@/services/banner.service';
import { Trash2, Plus, ImageIcon, Edit3, X, Save, Loader2 } from 'lucide-react';
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
        <div className="p-4 sm:p-6 md:p-8 pb-20 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="mb-8 md:mb-10 space-y-1">
                <h1 className="text-3xl sm:text-4xl font-heading gold-gradient mb-1 uppercase tracking-tighter leading-none">{t('title')}</h1>
                <p className="text-muted-foreground font-body text-[10px] sm:text-xs uppercase tracking-[.3em] font-extrabold opacity-70">
                   Quản lý không gian quảng cáo thương hiệu
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8 md:gap-12">
                {/* Form Section */}
                <div className="bg-white/50 dark:bg-black/20 backdrop-blur-md border border-stone-200 dark:border-white/5 rounded-[2.5rem] p-8 h-fit lg:sticky lg:top-24 shadow-sm order-2 lg:order-1 self-start">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-lg font-heading uppercase tracking-widest text-foreground">{editingId ? t('form.update_title') : t('form.add_title')}</h2>
                        {editingId && (
                            <button type="button" onClick={resetForm} className="p-2 bg-stone-100 dark:bg-white/5 rounded-full text-stone-400 hover:text-foreground transition-all">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold ml-1">
                                {t('form.image_label')} {editingId && <span className="opacity-50 italic">({t('form.image_hint')})</span>}
                            </label>
                            <div className="relative group">
                                <input 
                                    type="file" 
                                    onChange={(e) => setFile(e.target.files?.[0] || null)} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                    accept="image/*" 
                                />
                                <div className="w-full h-32 border-2 border-dashed border-stone-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 group-hover:border-gold/30 transition-all bg-stone-50/50 dark:bg-white/[0.02]">
                                    <ImageIcon className="w-8 h-8 text-stone-300 dark:text-white/10 group-hover:text-gold transition-colors" />
                                    <span className="text-[10px] uppercase font-bold text-stone-400">
                                       {file ? file.name : 'Upload New Banner'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold ml-1">{t('form.title_label')}</label>
                            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-base md:text-xs font-bold uppercase tracking-widest outline-none focus:border-gold transition-all shadow-sm" placeholder={t('form.title_placeholder')} />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold ml-1">{t('form.subtitle_label')}</label>
                            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-base md:text-xs font-bold uppercase tracking-widest outline-none focus:border-gold transition-all shadow-sm" placeholder={t('form.subtitle_placeholder')} />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold ml-1">{t('form.link_label')}</label>
                            <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-base md:text-xs font-bold uppercase tracking-widest outline-none focus:border-gold transition-all shadow-sm" placeholder={t('form.link_placeholder')} />
                        </div>

                        <button disabled={isSubmitting} className="w-full mt-8 flex items-center justify-center gap-3 bg-gold text-black h-14 rounded-2xl font-bold uppercase tracking-[0.3em] text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gold/20 disabled:opacity-50">
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : editingId ? <Save size={16} /> : <Plus size={16} />}
                            {isSubmitting ? t('form.submitting') : editingId ? t('form.submit_update') : t('form.submit_add')}
                        </button>
                    </form>
                </div>

                {/* List Section */}
                <div className="order-1 lg:order-2">
                    <h2 className="text-lg font-heading uppercase tracking-widest text-foreground mb-8 flex items-center gap-3">
                        {t('list.title')}
                        <span className="text-[10px] font-bold bg-secondary/50 px-3 py-1 rounded-full text-muted-foreground">{banners.length}</span>
                    </h2>
                    {loading ? (
                        <div className="py-20 flex flex-col items-center gap-4">
                           <Loader2 size={32} className="text-gold animate-spin opacity-50" />
                           <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground animate-pulse italic">{t('list.loading')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                            {banners.map(b => (
                                <div key={b.id} className="relative glass border border-border rounded-[2.5rem] overflow-hidden shadow-xl flex flex-col group hover:border-gold/30 transition-all duration-700">
                                    <div className="relative aspect-[21/9] sm:aspect-video bg-secondary/10 flex items-center justify-center overflow-hidden">
                                        {b.imageUrl ? (
                                            <Image src={b.imageUrl} alt={b.title || 'Banner'} fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                                        ) : (
                                            <ImageIcon className="opacity-10" size={48} />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    </div>
                                    <div className="p-6 sm:p-8 flex-1 flex flex-col space-y-4">
                                        <div>
                                            <h3 className="text-sm sm:text-base font-heading uppercase tracking-widest group-hover:text-gold transition-colors truncate">{b.title || t('list.no_title')}</h3>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest opacity-60 truncate mt-1">{b.subtitle || t('list.no_subtitle')}</p>
                                        </div>
                                        <div className="mt-auto pt-6 flex justify-between items-center border-t border-border/10">
                                            <span className="text-[9px] font-mono opacity-50 italic">{b.linkUrl || '#'}</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => startEdit(b)} className="w-11 h-11 flex items-center justify-center bg-secondary/10 rounded-2xl text-stone-400 hover:text-gold hover:bg-gold/10 transition-all active:scale-90 shadow-inner">
                                                    <Edit3 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(b.id)} className="w-11 h-11 flex items-center justify-center bg-red-500/5 rounded-2xl text-stone-400 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90 shadow-inner">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
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
