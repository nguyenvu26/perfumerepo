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
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-serif text-foreground">{t('title')}</h1>
                <Link
                    href="/dashboard/admin/manage-journal/create"
                    className="flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-gold transition-colors"
                >
                    <Plus size={16} /> {t('create_btn')}
                </Link>
            </div>

            {loading ? (
                <p>{t('loading')}</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {journals.map(j => (
                        <div key={j.id} className="bg-background border border-border rounded-3xl overflow-hidden shadow-sm group">
                            <div className="relative aspect-video bg-secondary/20">
                                {j.mainImage && (
                                    <Image src={j.mainImage} alt={j.title} fill className="object-cover" />
                                )}
                                <div className="absolute top-4 left-4 bg-black/60 text-white text-[9px] uppercase tracking-widest px-3 py-1 rounded-full font-bold backdrop-blur-md">
                                    {t('priority_label', { value: j.priority })}
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-lg font-serif font-bold truncate mb-2">{j.title}</h3>
                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                                    {j.excerpt || t('no_excerpt')}
                                </p>
                                <div className="flex justify-between items-center pt-4 border-t border-border">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                        {new Date(j.createdAt).toLocaleDateString(t('date_locale'))}
                                    </span>
                                    <div className="flex gap-2">
                                        <Link href={`/dashboard/admin/manage-journal/${j.id}`} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors">
                                            <Edit size={16} />
                                        </Link>
                                        <button onClick={() => handleDelete(j.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors">
                                            <Trash2 size={16} />
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
