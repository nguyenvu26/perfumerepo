'use client';

import { useEffect, useState } from 'react';
import { journalService, Journal } from '@/services/journal.service';
import { Plus, Trash2, Edit } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import JournalFormModal from '@/components/journal/JournalFormModal';

export default function ManageJournalPage() {
    const t = useTranslations('dashboard.admin.manageJournal.list');
    const [journals, setJournals] = useState<Journal[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    const loadData = () => {
        setLoading(true);
        journalService.list()
            .then(setJournals)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Xóa bài viết "${title}"?`)) return;
        try {
            await journalService.delete(id);
            loadData();
        } catch (e) {
            console.error(e);
            alert(t('delete_error'));
        }
    };

    const openCreate = () => {
        setEditId(null);
        setIsModalOpen(true);
    };

    const openEdit = (id: string) => {
        setEditId(id);
        setIsModalOpen(true);
    };

    return (
        <div className="p-4 sm:p-6 md:p-10 space-y-8 md:space-y-12 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-8">
                <div className="space-y-4">
                    <h1 className="text-4xl sm:text-5xl font-heading gold-gradient mb-1 uppercase tracking-tighter italic leading-tight">{t('title')}</h1>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-[.4em] font-black opacity-60 italic leading-none">
                       {t('subtitle')}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gold text-primary-foreground h-14 sm:h-16 px-10 rounded-full font-black uppercase tracking-[.2em] text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gold/20"
                >
                    <Plus size={18} /> {t('create_btn')}
                </button>
            </header>

            {loading ? (
                <div className="py-32 flex flex-col items-center justify-center gap-8">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-2 border-gold/10 rounded-full" />
                        <div className="absolute inset-0 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-[10px] uppercase font-black tracking-[.5em] text-muted-foreground animate-pulse italic leading-none">{t('loading')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-10">
                    {journals.map(j => (
                        <div key={j.id} className="glass bg-white dark:bg-black/20 border border-stone-200 dark:border-white/5 rounded-[3rem] overflow-hidden flex flex-col group hover:border-gold/30 hover:scale-[1.01] transition-all duration-700 shadow-xl backdrop-blur-xl group/card">
                            <div className="relative aspect-[16/10] bg-secondary/10 overflow-hidden">
                                {j.mainImage ? (
                                    <Image src={j.mainImage} alt={j.title} fill className="object-cover grayscale group-hover/card:grayscale-0 group-hover/card:scale-110 transition-all duration-1000" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gold/10 italic font-serif text-xl underline decoration-gold/10">Essence Missing</div>
                                )}
                                <div className="absolute top-8 left-8 bg-black/80 text-gold text-[9px] uppercase tracking-widest px-5 py-2 rounded-full font-black backdrop-blur-md border border-white/10 shadow-2xl transition-all group-hover/card:border-gold/30">
                                    PRIORITY {j.priority}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />
                                
                                <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover/card:opacity-100 transition-all duration-500 translate-y-4 group-hover/card:translate-y-0">
                                    <button 
                                        onClick={() => openEdit(j.id)}
                                        className="w-14 h-14 bg-white text-zinc-950 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
                                    >
                                        <Edit size={22} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(j.id, j.title)}
                                        className="w-14 h-14 bg-zinc-950 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all border border-white/10"
                                    >
                                        <Trash2 size={22} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-10 flex-1 flex flex-col">
                                <div className="mb-4 flex items-center gap-3">
                                    <span className="text-[9px] uppercase tracking-[.3em] font-black text-gold/60">{j.category || 'GENERAL'}</span>
                                    <div className="w-1 h-1 rounded-full bg-border" />
                                    <span className="text-[9px] font-mono opacity-40 uppercase tracking-widest">{new Date(j.createdAt).toLocaleDateString(t('date_locale'))}</span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-heading uppercase tracking-tight line-clamp-2 mb-6 group-hover/card:text-gold transition-colors leading-tight italic">{j.title}</h3>
                                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 line-clamp-3 leading-relaxed font-serif italic mb-10 opacity-80">
                                    {j.excerpt || t('no_excerpt')}
                                </p>
                                
                                <button
                                    onClick={() => openEdit(j.id)}
                                    className="mt-auto group/btn flex items-center gap-4 text-[10px] uppercase font-black tracking-[.4em] text-muted-foreground hover:text-gold transition-all duration-500"
                                >
                                    REFINE STORY 
                                    <div className="w-10 h-px bg-border group-hover/btn:w-16 group-hover/btn:bg-gold transition-all duration-500" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <JournalFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editId={editId}
                onSuccess={loadData}
            />
        </div>
    );
}
