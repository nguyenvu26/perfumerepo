'use client';

import { useEffect, useState } from 'react';
import { bannerService, Banner } from '@/services/banner.service';
import { Trash2, Plus, ImageIcon, Edit3, X, Save } from 'lucide-react';
import Image from 'next/image';

export default function ManageBannerPage() {
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
        if (!confirm('Bạn có chắc xoá banner này?')) return;
        try {
            await bannerService.delete(id);
            loadBanners();
        } catch (e) {
            console.error(e);
            alert('Lỗi xoá banner');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId && !file) return alert('Vui lòng chọn ảnh');

        setIsSubmitting(true);
        try {
            if (editingId) {
                await bannerService.update(editingId, { title, subtitle, linkUrl, ...(file ? { image: file } : {}) });
                alert('Cập nhật banner thành công');
            } else {
                await bannerService.create({ title, subtitle, linkUrl, image: file! });
                alert('Thêm banner thành công');
            }
            resetForm();
            loadBanners();
        } catch (err) {
            console.error(err);
            alert('Thao tác thất bại');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-serif text-foreground mb-8">Quản lý Banners</h1>

            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
                {/* Form */}
                <div className="bg-background border border-border rounded-2xl p-6 h-fit sticky top-24 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold">{editingId ? 'Cập Nhật Banner' : 'Thêm Banner Mới'}</h2>
                        {editingId && (
                            <button type="button" onClick={resetForm} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground">
                                <X size={14} /> Hủy sửa
                            </button>
                        )}
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                                Ảnh Banner {editingId && '(Bỏ trống nếu không muốn đổi ảnh)'}
                            </label>
                            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm border border-dashed border-border p-3 rounded-xl" accept="image/*" />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Tiêu đề chính</label>
                            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-transparent text-sm" placeholder="VD: Khám phá mùa xuân" />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Tiêu đề phụ</label>
                            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-transparent text-sm" placeholder="VD: Bộ sưu tập mới..." />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Link URL (nếu có)</label>
                            <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-transparent text-sm" placeholder="VD: /collection/..." />
                        </div>

                        <button disabled={isSubmitting} className="w-full mt-6 flex items-center justify-center gap-2 bg-gold text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-gold-light transition-all shadow-lg shadow-gold/20 disabled:opacity-50">
                            {isSubmitting ? 'ĐANG LƯU...' : editingId ? <><Save size={16} /> LƯU THAY ĐỔI</> : <><Plus size={16} /> THÊM MỚI</>}
                        </button>
                    </form>
                </div>

                {/* List */}
                <div>
                    <h2 className="text-lg font-bold mb-4">Banners Hiện Có</h2>
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Đang tải...</p>
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
                                        <h3 className="text-sm font-bold truncate">{b.title || 'Không có tiêu đề'}</h3>
                                        <p className="text-xs text-muted-foreground truncate">{b.subtitle || '—'}</p>
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
