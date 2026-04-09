'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { journalService, UploadSectionData } from '@/services/journal.service';
import { productService, Product } from '@/services/product.service';
import { ArrowLeft, Save, Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import { Link, useRouter } from '@/lib/i18n';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function EditJournalPage() {
    const t = useTranslations('dashboard.admin.manageJournal');
    const router = useRouter();
    const { id } = useParams() as { id: string };
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        title: '',
        excerpt: '',
        category: 'all',
        priority: 0,
    });
    
    const [currentMainImage, setCurrentMainImage] = useState<string>('');
    const [mainImage, setMainImage] = useState<File | null>(null);
    const [sections, setSections] = useState<UploadSectionData[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        productService.list({ take: 500 }).then(res => setProducts(res.items)).catch(console.error);

        journalService.getById(id).then(res => {
            setForm({
                title: res.title,
                excerpt: res.excerpt || '',
                category: res.category || 'all',
                priority: res.priority || 0,
            });
            setCurrentMainImage(res.mainImage);
            
            if (res.sections && res.sections.length > 0) {
                setSections(res.sections.map(s => ({
                    subtitle: s.subtitle || '',
                    content: s.content,
                    existingImageUrl: s.imageUrl,
                    productId: s.productId || undefined,
                    imageFile: null
                })));
            } else {
                // Tương thích với data cũ không có sections
                setSections([{ subtitle: '', content: '', imageFile: null }]);
            }
            setLoading(false);
        }).catch(err => {
            alert(t('edit.error_load'));
            console.error(err);
        });
    }, [id]);

    const handleSectionChange = (idx: number, field: keyof UploadSectionData, value: any) => {
        const newSections = [...sections];
        newSections[idx] = { ...newSections[idx], [field]: value };
        setSections(newSections);
    };

    const addSection = () => {
        setSections([...sections, { subtitle: '', content: '', imageFile: null }]);
    };

    const removeSection = (idx: number) => {
        setSections(sections.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (sections.some(s => !s.content.trim())) return alert(t('create.error_content'));

        setSubmitting(true);
        try {
            await journalService.update(id, {
                ...form,
                mainImage: mainImage ? mainImage : null,
                sections
            });
            alert(t('edit.success'));
            router.push('/dashboard/admin/manage-journal');
        } catch (err) {
            console.error(err);
            alert(t('edit.error_failed'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse tracking-widest text-[10px] uppercase">{t('edit.loading')}</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/admin/manage-journal" className="p-3 bg-secondary/50 rounded-full hover:bg-secondary transition-colors">
                    <ArrowLeft size={16} />
                </Link>
                <h1 className="text-3xl font-serif text-foreground">{t('edit.title')}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-background border border-border p-8 rounded-3xl shadow-sm">
                
                {/* Meta Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 font-bold">{t('fields.title')}</label>
                        <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-border bg-transparent text-sm" placeholder={t('fields.title_placeholder')} />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 font-bold">{t('fields.category')}</label>
                        <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-border bg-transparent text-sm" placeholder={t('fields.category_placeholder')} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 font-bold">{t('fields.main_image')} {t('fields.main_image_hint')}</label>
                        {currentMainImage && !mainImage && (
                            <Image src={currentMainImage} alt="Current main" width={200} height={100} className="mb-4 rounded-xl object-cover aspect-video" />
                        )}
                        <input type="file" accept="image/*" onChange={e => setMainImage(e.target.files?.[0] || null)} className="w-full border border-dashed border-border p-4 rounded-xl text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 font-bold">{t('fields.priority')}</label>
                        <input type="number" required value={form.priority} onChange={e => setForm({...form, priority: parseInt(e.target.value)||0})} className="w-full px-4 py-3 rounded-xl border border-border bg-transparent text-sm" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 font-bold">{t('fields.excerpt')}</label>
                    <textarea rows={2} value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-border bg-transparent text-sm leading-relaxed" placeholder={t('fields.excerpt_placeholder')} />
                </div>

                <div className="border-t border-border pt-8 mt-8">
                    <h2 className="text-xl font-serif mb-6 flex items-center justify-between">
                        <span>{t('fields.sections')}</span>
                        <button type="button" onClick={addSection} className="text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-lg hover:bg-secondary">
                            <Plus size={14} /> {t('fields.add_section')}
                        </button>
                    </h2>

                    <div className="space-y-8">
                        {sections.map((section, idx) => (
                            <div key={idx} className="relative p-6 border border-border rounded-2xl bg-secondary/5 group">
                                <button type="button" onClick={() => removeSection(idx)} className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 size={16} />
                                </button>
                                
                                <div className="mb-4">
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{t('fields.section_index', { index: idx + 1 })}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 font-bold">{t('fields.subtitle')}</label>
                                            <input value={section.subtitle || ''} onChange={e => handleSectionChange(idx, 'subtitle', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-transparent text-sm" placeholder={t('fields.subtitle_placeholder')} />
                                        </div>
                                        <div>
                                            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-bold flex items-center gap-2"><LinkIcon size={14}/> {t('fields.product_link')}</label>
                                            <select value={section.productId || ''} onChange={e => handleSectionChange(idx, 'productId', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-transparent text-sm">
                                                <option value="">{t('fields.no_product_link')}</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 font-bold flex gap-2">
                                            {t('fields.section_image')}
                                            {section.existingImageUrl && !section.imageFile && <span className="text-gold">({t('fields.existing_image')})</span>}
                                        </label>
                                        <input type="file" accept="image/*" onChange={e => handleSectionChange(idx, 'imageFile', e.target.files?.[0] || null)} className="w-full border border-dashed border-border p-3 rounded-xl text-sm bg-background h-full max-h-32" />
                                        {section.existingImageUrl && !section.imageFile && (
                                            <div className="mt-2 text-[10px] text-muted-foreground">
                                                {t('fields.current_image')}: {section.existingImageUrl.substring(0, 30)}...
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 font-bold">{t('fields.content')}</label>
                                    <textarea required rows={5} value={section.content} onChange={e => handleSectionChange(idx, 'content', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-transparent text-sm leading-relaxed bg-background" placeholder={t('fields.content_placeholder')} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button disabled={submitting} className="flex items-center gap-2 bg-gold text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-gold-light transition-all shadow-lg shadow-gold/20 disabled:opacity-50">
                        {submitting ? t('edit.submitting') : <><Save size={16} /> {t('edit.submit_btn')}</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
