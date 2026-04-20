'use client';

import { useEffect, useState } from 'react';
import { journalService, Journal } from '@/services/journal.service';
import { Plus, Trash2, Edit } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/lib/i18n';
import { useTranslations } from 'next-intl';

export default function ManageJournalPage() {
    const t = useTranslations('dashboard.admin.manageJournal.list');
    const [journals, setJournals] = useState<Journal[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = () => {
        setLoading(true);
        journalService.list()
            .then(setJournals)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm(t('delete_confirm'))) return;
        try {
            await journalService.delete(id);
            loadData();
        } catch (e) {
            console.error(e);
            alert(t('delete_error'));
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-10 space-y-8 md:space-y-12 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-8">
                <div className="space-y-2">
                    <h1 className="text-4xl sm:text-5xl font-heading gold-gradient mb-1 uppercase tracking-tighter italic leading-tight">{t('title')}</h1>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-[.4em] font-black opacity-60 italic leading-none">
                       Chronicles of Essence & Memory
                    </p>
                </div>
                <Link
                    href="/dashboard/admin/manage-journal/create"
                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gold text-black h-12 sm:h-14 px-8 rounded-full font-black uppercase tracking-[.2em] text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gold/20"
                >
                    <Plus size={16} /> {t('create_btn')}
                </Link>
            </header>

            {loading ? (
                <div className="py-32 flex flex-col items-center gap-6">
                    <div className="h-12 w-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                    <p className="text-[10px] uppercase font-black tracking-[.5em] text-muted-foreground animate-pulse italic leading-none">{t('loading')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-10">
                    {journals.map(j => (
                        <div key={j.id} className="glass bg-white dark:bg-black/20 border border-stone-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col group hover:border-gold/30 hover:scale-[1.01] transition-all duration-700 shadow-xl backdrop-blur-xl">
                            <div className="relative aspect-video bg-secondary/10 overflow-hidden">
                                {j.mainImage ? (
                                    <Image src={j.mainImage} alt={j.title} fill className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gold/10 italic font-serif">Empty Canvas</div>
                                )}
                                <div className="absolute top-6 left-6 bg-black/60 text-white text-[8px] uppercase tracking-widest px-4 py-1.5 rounded-full font-black backdrop-blur-md border border-white/10 shadow-lg">
                                    {t('priority_label', { value: j.priority })}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            </div>
                            <div className="p-8 sm:p-10 flex-1 flex flex-col">
                                <h3 className="text-lg sm:text-xl font-heading uppercase tracking-tight line-clamp-2 mb-4 group-hover:text-gold transition-colors leading-tight italic">{j.title}</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-8 font-serif italic opacity-70">
                                    {j.excerpt || t('no_excerpt')}
                                </p>
                                <div className="mt-auto flex justify-between items-center pt-8 border-t border-border/10">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-40 leading-none mb-1">{t('date_locale') === 'vi' ? 'Ngày đăng' : 'Published'}</span>
                                        <span className="text-[10px] font-mono italic opacity-60">
                                            {new Date(j.createdAt).toLocaleDateString(t('date_locale'))}
                                        </span>
                                    </div>
                                    <div className="flex gap-3">
                                        <Link href={`/dashboard/admin/manage-journal/${j.id}`} className="w-11 h-11 flex items-center justify-center bg-secondary/10 hover:bg-gold/10 rounded-2xl text-stone-400 hover:text-gold transition-all active:scale-90 shadow-sm border border-border/5">
                                            <Edit size={18} />
                                        </Link>
                                        <button onClick={() => handleDelete(j.id)} className="w-11 h-11 flex items-center justify-center bg-red-500/5 hover:bg-red-500/10 rounded-2xl text-stone-400 hover:text-red-500 transition-all active:scale-90 shadow-sm border border-border/5">
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
    );
}
