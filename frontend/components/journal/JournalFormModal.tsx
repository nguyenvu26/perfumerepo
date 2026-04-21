'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Link as LinkIcon, Save, ImagePlus, Loader2 } from 'lucide-react';
import { journalService, UploadSectionData, Journal } from '@/services/journal.service';
import { productService, Product } from '@/services/product.service';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui.store';

interface JournalFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess: () => void;
}

export default function JournalFormModal({ isOpen, onClose, editId, onSuccess }: JournalFormModalProps) {
    const t = useTranslations('dashboard.admin.manageJournal');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const { isSidebarCollapsed: isCollapsed, setModalOpen } = useUIStore();

    useEffect(() => {
        setModalOpen(isOpen);
    }, [isOpen, setModalOpen]);
    
    const [form, setForm] = useState({
        title: '',
        excerpt: '',
        category: 'all',
        priority: 0,
    });
    
    const [currentMainImage, setCurrentMainImage] = useState<string>('');
    const [mainImage, setMainImage] = useState<File | null>(null);
    const [sections, setSections] = useState<UploadSectionData[]>([
        { subtitle: '', content: '', imageFile: null }
    ]);
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        if (isOpen) {
            productService.list({ take: 500 }).then(res => setProducts(res.items)).catch(console.error);
            
            if (editId) {
                setLoading(true);
                journalService.getById(editId).then(res => {
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
                        setSections([{ subtitle: '', content: '', imageFile: null }]);
                    }
                }).catch(err => {
                    toast.error(t('edit.error_load'));
                }).finally(() => setLoading(false));
            } else {
                setForm({ title: '', excerpt: '', category: 'all', priority: 0 });
                setMainImage(null);
                setCurrentMainImage('');
                setSections([{ subtitle: '', content: '', imageFile: null }]);
            }
        }
    }, [isOpen, editId, t]);

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
        if (!editId && !mainImage) return toast.error(t('create.error_main_image'));
        if (sections.some(s => !s.content.trim())) return toast.error(t('create.error_content'));

        setSubmitting(true);
        try {
            if (editId) {
                await journalService.update(editId, {
                    ...form,
                    mainImage: mainImage ? mainImage : null,
                    sections
                });
                toast.success(t('edit.success'));
            } else {
                await journalService.create({
                    ...form,
                    mainImage: mainImage!,
                    sections
                });
                toast.success(t('create.success'));
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error(editId ? t('edit.error_failed') : t('create.error_failed'));
        } finally {
            setSubmitting(false);
        }
    };

    const [activeTab, setActiveTab] = useState('identity');

    return (
        <AnimatePresence>
            {isOpen && (
                <div className={cn(
                    "fixed top-0 bottom-0 right-0 z-[150] flex items-center justify-center p-0 sm:p-6 font-body transition-all duration-500 bg-white/40 dark:bg-zinc-950/80 backdrop-blur-2xl",
                    "left-0 md:left-20",
                    !isCollapsed && "lg:left-72"
                )} onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        className="relative w-full max-w-7xl h-full sm:h-auto sm:max-h-[90vh] bg-background border-t sm:border border-white/20 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col glass"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="shrink-0 p-8 sm:px-14 sm:py-10 border-b border-white/10 flex justify-between items-center bg-white/90 dark:bg-zinc-900/50 backdrop-blur-xl z-20">
                            <div className="flex items-center gap-10">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-6 h-px bg-gold" />
                                        <span className="text-[9px] uppercase tracking-[.4em] font-black text-gold/80">{editId ? "Biên Tập Nội Dung" : "Khởi Tạo Câu Chuyện"}</span>
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-heading gold-gradient uppercase tracking-tighter italic leading-none">
                                        {editId ? form.title || t('edit.title') : t('create.title')}
                                    </h2>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-12 h-12 rounded-full bg-secondary/10 border border-white/10 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-90"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            {/* Sidebar Navigation */}
                            <aside className="w-72 border-r border-white/10 bg-white/80 dark:bg-zinc-900/60 overflow-y-auto hidden md:block">
                                <nav className="p-10 space-y-3">
                                    {[
                                        { id: 'identity', icon: Save, label: 'Thông Tin Chính' },
                                        { id: 'sections', icon: Plus, label: 'Chương Bài Viết' },
                                    ].map((tab) => (
                                         <button
                                             key={tab.id}
                                             onClick={() => setActiveTab(tab.id)}
                                             className={cn(
                                                 "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] relative overflow-hidden group",
                                                 activeTab === tab.id
                                                     ? "bg-gold text-primary shadow-lg shadow-gold/20 translate-x-1"
                                                     : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                             )}
                                         >
                                             {activeTab === tab.id && (
                                                 <motion.div 
                                                     layoutId="modal-tab-indicator"
                                                     className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/30"
                                                 />
                                             )}
                                             <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-primary" : "text-gold/80")} />
                                            {tab.label}
                                        </button>
                                    ))}
                                </nav>
                                <div className="p-10 mt-10">
                                    <div className="p-6 rounded-3xl bg-gold/5 border border-gold/10">
                                        <p className="text-[9px] uppercase tracking-widest font-black text-gold/60 leading-relaxed italic">
                                            Lưu ý: Bạn cần có ít nhất một chương nội dung để phát hành bản tin.
                                        </p>
                                    </div>
                                </div>
                            </aside>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 sm:p-14 pb-32 sm:pb-14">
                                {loading ? (
                                    <div className="h-full flex flex-col items-center justify-center space-y-8">
                                        <div className="w-16 h-16 border-4 border-gold/10 border-t-gold rounded-full animate-spin" />
                                        <p className="text-[10px] uppercase font-black tracking-[.6em] text-muted-foreground animate-pulse leading-none italic">Đang chuẩn bị bản thảo...</p>
                                    </div>
                                ) : (
                                    <form id="journalForm" onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-16 pb-20">
                                        {activeTab === 'identity' && (
                                            <section className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-12">
                                                <div className="space-y-2 border-l-4 border-gold pl-6">
                                                    <h3 className="text-3xl font-heading uppercase tracking-tighter italic">Bản Sắc Câu Chuyện</h3>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-[.3em] font-black">Xác định tiêu đề và phong cách hiển thị.</p>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">{t('fields.title')} *</label>
                                                        <input
                                                            required
                                                            value={form.title}
                                                            onChange={e => setForm({...form, title: e.target.value})}
                                                            className="w-full h-16 bg-secondary/5 border border-border rounded-2xl px-8 text-sm font-bold outline-none focus:border-gold transition-all"
                                                            placeholder={t('fields.title_placeholder')}
                                                        />
                                                    </div>
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">{t('fields.category')}</label>
                                                        <input
                                                            value={form.category}
                                                            onChange={e => setForm({...form, category: e.target.value})}
                                                            className="w-full h-16 bg-secondary/5 border border-border rounded-2xl px-8 text-sm font-bold outline-none focus:border-gold transition-all"
                                                            placeholder={t('fields.category_placeholder')}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1 text-gold">{t('fields.main_image')} (*)</label>
                                                        <div className="relative group aspect-video rounded-[3rem] overflow-hidden border-4 border-dashed border-gold/10 hover:border-gold/30 transition-all bg-secondary/5">
                                                            {(mainImage || currentMainImage) ? (
                                                                <>
                                                                    <div className="relative w-full h-full"> 
                                                                        <Image
                                                                            src={mainImage ? URL.createObjectURL(mainImage) : currentMainImage}
                                                                            fill
                                                                            alt="Main Cover"
                                                                            className="object-cover"
                                                                            unoptimized={!!mainImage}
                                                                        />
                                                                    </div>
                                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                                                                        <label className="w-16 h-16 bg-white text-zinc-950 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-2xl">
                                                                            <ImagePlus size={28} />
                                                                            <input type="file" accept="image/*" className="hidden" onChange={e => setMainImage(e.target.files?.[0] || null)} />
                                                                        </label>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-gold/5 transition-colors">
                                                                    <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mb-4">
                                                                        <ImagePlus size={32} className="text-gold" />
                                                                    </div>
                                                                    <span className="text-[10px] uppercase font-black text-gold/60 tracking-widest italic">Tải lên hình bìa nghệ thuật</span>
                                                                    <input type="file" required accept="image/*" className="hidden" onChange={e => setMainImage(e.target.files?.[0] || null)} />
                                                                </label>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-8">
                                                        <div className="space-y-4">
                                                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">{t('fields.priority')} (Sắp xếp)</label>
                                                            <input
                                                                type="number"
                                                                required
                                                                value={form.priority}
                                                                onChange={e => setForm({...form, priority: parseInt(e.target.value)||0})}
                                                                className="w-full h-16 bg-secondary/5 border border-border rounded-2xl px-8 text-sm font-bold outline-none focus:border-gold transition-all"
                                                            />
                                                            <p className="text-[9px] text-muted-foreground italic px-2 leading-none uppercase tracking-[.2em] opacity-50 font-extrabold font-heading">Giá trị cao sẽ đưa bài viết lên ưu tiên hàng đầu.</p>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">{t('fields.excerpt')}</label>
                                                            <textarea
                                                                rows={4}
                                                                value={form.excerpt}
                                                                onChange={e => setForm({...form, excerpt: e.target.value})}
                                                                className="w-full bg-secondary/5 border border-border rounded-[2rem] p-8 text-sm font-medium outline-none focus:border-gold transition-all resize-none leading-relaxed italic"
                                                                placeholder={t('fields.excerpt_placeholder')}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>
                                        )}

                                        {activeTab === 'sections' && (
                                            <section className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-12">
                                                <div className="flex justify-between items-end border-l-4 border-gold pl-6">
                                                    <div className="space-y-2">
                                                        <h3 className="text-3xl font-heading uppercase tracking-tighter italic">Dòng Chảy Câu Chuyện</h3>
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-[.3em] font-black italic">Kiến tác từng chương nội dung.</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={addSection}
                                                        className="bg-gold text-primary-foreground text-[10px] uppercase tracking-[.2em] font-black px-10 py-5 rounded-full shadow-2xl shadow-gold/30 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-3"
                                                    >
                                                        <Plus size={18} /> {t('fields.add_section')}
                                                    </button>
                                                </div>

                                                <div className="space-y-10">
                                                    {sections.map((section, idx) => (
                                                        <div key={idx} className="relative p-10 sm:p-14 border border-white/5 rounded-[3.5rem] bg-zinc-50 dark:bg-white/[0.02] shadow-sm group hover:border-gold/30 transition-all">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSection(idx)}
                                                                className="absolute top-10 right-10 w-12 h-12 text-red-500 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-xl border border-border"
                                                            >
                                                                <Trash2 size={20} />
                                                            </button>
                                                            
                                                            <div className="mb-12 flex items-center gap-4">
                                                                <div className="w-14 h-14 rounded-full glass border border-gold/20 flex items-center justify-center font-heading italic text-xl text-gold">
                                                                    {idx + 1}
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <span className="text-[10px] font-black tracking-[.4em] uppercase text-gold leading-none">Chương Tiết</span>
                                                                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-extrabold opacity-40">Mạch truyện tiếp diễn</p>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 mb-10">
                                                                <div className="space-y-10">
                                                                    <div className="space-y-4">
                                                                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">Tiêu Đề Chương</label>
                                                                        <input
                                                                            value={section.subtitle || ''}
                                                                            onChange={e => handleSectionChange(idx, 'subtitle', e.target.value)}
                                                                            className="w-full h-14 bg-background border border-border/50 rounded-xl px-7 text-sm font-bold outline-none focus:border-gold transition-all shadow-inner"
                                                                            placeholder={t('fields.subtitle_placeholder')}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-4">
                                                                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1 flex items-center gap-2"><LinkIcon size={12} className="text-gold"/>{t('fields.product_link')}</label>
                                                                        <select
                                                                            value={section.productId || ''}
                                                                            onChange={e => handleSectionChange(idx, 'productId', e.target.value)}
                                                                            className="w-full h-14 bg-background border border-border/50 rounded-xl px-7 text-[10px] font-black uppercase tracking-widest outline-none focus:border-gold transition-all cursor-pointer shadow-sm appearance-none"
                                                                        >
                                                                            <option value="">{t('fields.no_product_link')}</option>
                                                                            {products.map(p => (
                                                                                <option key={p.id} value={p.id}>{p.name}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">Ảnh Minh Hoạ Chương</label>
                                                                    <div className="relative group aspect-video rounded-[2rem] overflow-hidden border-2 border-dashed border-border/40 hover:border-gold/30 transition-all bg-background/50">
                                                                        {(section.imageFile || section.existingImageUrl) ? (
                                                                            <>
                                                                                <div className="relative w-full h-full">
                                                                                    <Image
                                                                                        src={section.imageFile ? URL.createObjectURL(section.imageFile) : section.existingImageUrl!}
                                                                                        fill
                                                                                        alt="Section image"
                                                                                        className="object-cover"
                                                                                        unoptimized={!!section.imageFile}
                                                                                    />
                                                                                </div>
                                                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                                                                                    <label className="w-14 h-14 bg-white text-zinc-950 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-xl">
                                                                                        <Plus size={24} />
                                                                                        <input type="file" accept="image/*" className="hidden" onChange={e => handleSectionChange(idx, 'imageFile', e.target.files?.[0] || null)} />
                                                                                    </label>
                                                                                </div>
                                                                            </>
                                                                        ) : (
                                                                            <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-gold/5 transition-colors">
                                                                                <ImagePlus size={28} className="text-gold mb-3 opacity-30" />
                                                                                <span className="text-[9px] uppercase font-black text-gold/40 tracking-widest italic">CHỌN ẢNH NGHỆ THUẬT</span>
                                                                                <input type="file" accept="image/*" className="hidden" onChange={e => handleSectionChange(idx, 'imageFile', e.target.files?.[0] || null)} />
                                                                            </label>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1 italic text-gold">Nội Dung Chương *</label>
                                                                <textarea
                                                                    required
                                                                    rows={8}
                                                                    value={section.content}
                                                                    onChange={e => handleSectionChange(idx, 'content', e.target.value)}
                                                                    className="w-full bg-background border border-border/50 rounded-[2.5rem] p-10 text-base font-medium outline-none focus:border-gold transition-all resize-none leading-relaxed italic font-serif shadow-inner"
                                                                    placeholder={t('fields.content_placeholder')}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {sections.length === 0 && (
                                                        <div className="py-32 flex flex-col items-center justify-center glass rounded-[4rem] border border-dashed border-white/10 opacity-30 italic font-heading">
                                                            <Plus size={48} className="mb-6 opacity-20" />
                                                            <p className="text-xl tracking-widest uppercase">Hãy bắt đầu chương đầu tiên</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </section>
                                        )}
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="shrink-0 h-28 border-t border-white/10 px-12 flex items-center justify-end gap-6 bg-zinc-50 dark:bg-black/20 backdrop-blur-xl z-20">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-10 py-4 rounded-full text-[10px] uppercase tracking-widest font-black text-muted-foreground hover:text-foreground transition-all active:scale-95 font-heading"
                            >
                                {t('edit.cancel') || 'HUỶ BỎ'}
                            </button>
                            <button
                                type="submit"
                                form="journalForm"
                                disabled={submitting || loading}
                                className="px-16 py-5 rounded-full bg-gold text-primary-foreground font-heading text-[11px] uppercase tracking-[.3em] font-black disabled:opacity-50 shadow-2xl shadow-gold/30 hover:scale-[1.05] active:scale-[0.98] transition-all flex items-center gap-3"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {t('edit.submitting') || 'ĐANG LƯU...'}
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        {editId ? (t('edit.submit_btn') || 'CẬP NHẬT CÂU CHUYỆN') : (t('create.submit_btn') || 'PHÁT HÀNH BẢN TIN')}
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
