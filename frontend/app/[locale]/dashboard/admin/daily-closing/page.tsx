'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    History, Store, User, Calendar, 
    Banknote, CreditCard, ArrowRightLeft, FileText,
    Search, Filter
} from 'lucide-react';
import api from '@/lib/axios';
import { AuthGuard } from '@/components/auth/auth-guard';
import { cn } from '@/lib/utils';
import { ClosingDetailPanel } from '@/components/dashboard/admin/ClosingDetailPanel';
import { Eye, X } from 'lucide-react';
import { storesService } from '@/services/stores.service';
import { staffReportsService } from '@/services/staff-reports.service';
import { useTranslations } from 'next-intl';

interface DailyClosingDto {
    id: string;
    closingDate: string;
    systemTotal: number;
    systemCash: number;
    systemTransfer: number;
    actualCash: number;
    actualTransfer: number | null;
    difference: number;
    note: string | null;
    orderCount: number;
    staff: { fullName: string };
    store: { name: string };
}

export default function DailyClosingHistoryPage() {
    const [closings, setClosings] = useState<DailyClosingDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [stores, setStores] = useState<any[]>([]);
    const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
    const [filterDate, setFilterDate] = useState('');

    const fetchClosings = async () => {
        try {
            setLoading(true);
            const data = await staffReportsService.getClosingHistory(
                selectedStoreId,
                filterDate ? filterDate : undefined,
                filterDate ? filterDate : undefined // For single day, start = end or just handling on backend
            );
            setClosings(data as any);
        } catch (e) {
            console.error('Failed to fetch closings', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        storesService.list().then(res => setStores(res.filter((s: any) => s.type !== 'CENTRAL'))).catch(console.error);
    }, []);

    useEffect(() => {
        fetchClosings();
    }, [selectedStoreId, filterDate]);

    const formatVND = (v: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
    };

    const filteredClosings = closings.filter(c => 
        c.store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.staff.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AuthGuard allowedRoles={['admin']}>
            <div className="flex flex-col gap-8 py-10 px-10 max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <header className="space-y-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-gold/10 text-gold">
                                <History className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-gold uppercase tracking-[.3em]">Accounting Audit</span>
                        </div>
                        <h1 className="text-4xl font-heading gold-gradient uppercase tracking-tighter">
                            Lịch sử chốt doanh thu
                        </h1>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium opacity-60">
                            Đối soát tiền mặt và doanh thu thực tế tại các quầy
                        </p>
                    </header>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Store Selector */}
                        <div className="relative group">
                            <Store className="w-3.5 h-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-gold/60" />
                            <select 
                                value={selectedStoreId}
                                onChange={(e) => setSelectedStoreId(e.target.value)}
                                className="bg-background/40 border border-border rounded-2xl pl-10 pr-8 py-3 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-gold/40 transition-all appearance-none cursor-pointer min-w-[200px]"
                            >
                                <option value="all">Tất cả cửa hàng</option>
                                {stores.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date Picker */}
                        <div className="relative group">
                            <Calendar className="w-3.5 h-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-gold/60" />
                            <input 
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="bg-background/40 border border-border rounded-2xl pl-10 pr-6 py-3 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-gold/40 transition-all cursor-pointer invert dark:invert-0"
                            />
                        </div>

                        {/* Search Term */}
                        <div className="relative group">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-gold transition-colors" />
                            <input 
                                type="text"
                                placeholder="Tìm kiếm nhân viên..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-background/40 border border-border rounded-2xl pl-11 pr-6 py-3 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-gold/40 w-[240px] transition-all"
                            />
                        </div>

                        {/* Reset Button */}
                        <button 
                            onClick={() => { setSelectedStoreId('all'); setFilterDate(''); setSearchTerm(''); }}
                            className="p-3 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:border-gold transition-all shadow-sm"
                            title="Làm mới"
                        >
                            <X size={16} className="text-stone-500" />
                        </button>
                    </div>
                </div>

                {/* Main Table */}
                <div className="glass bg-background/40 rounded-[2.5rem] border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-bottom border-border bg-white/5">
                                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Thời gian / Quầy</th>
                                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Hệ thống</th>
                                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Thực tế bàn giao</th>
                                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Chênh lệch</th>
                                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Tình trạng</th>
                                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nhân viên chốt</th>
                                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Thao tác</th>
                                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ghi chú</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={6} className="px-8 py-6"><div className="h-12 bg-white/5 rounded-2xl" /></td>
                                        </tr>
                                    ))
                                ) : filteredClosings.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center text-muted-foreground uppercase text-[10px] tracking-widest">
                                            Không tìm thấy dữ liệu chốt doanh thu
                                        </td>
                                    </tr>
                                ) : (
                                    filteredClosings.map((closing) => (
                                        <motion.tr 
                                            key={closing.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-white/[0.02] transition-colors group"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-bold text-foreground">{new Date(closing.closingDate).toLocaleDateString('vi-VN')}</span>
                                                    <div className="flex items-center gap-1.5 opacity-60">
                                                        <Store className="w-3 h-3 text-gold" />
                                                        <span className="text-[10px] uppercase font-bold tracking-wider">{closing.store.name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-bold font-heading">{formatVND(closing.systemTotal)}</span>
                                                    <div className="flex items-center justify-end gap-3 text-[9px] font-medium opacity-50 uppercase">
                                                        <span>Cash: {formatVND(closing.systemCash)}</span>
                                                        <span>Bank: {formatVND(closing.systemTransfer)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-bold text-white font-heading">
                                                        {formatVND(closing.actualCash + (closing.actualTransfer || 0))}
                                                    </span>
                                                    <div className="flex items-center justify-end gap-3 text-[9px] font-medium opacity-50 uppercase">
                                                        <span className="flex items-center gap-1"><Banknote className="w-2.5 h-2.5 text-emerald-400" /> {formatVND(closing.actualCash)}</span>
                                                        <span className="flex items-center gap-1"><CreditCard className="w-2.5 h-2.5 text-blue-400" /> {formatVND(closing.actualTransfer || 0)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={cn(
                                                        "text-xs font-black font-heading",
                                                        closing.difference === 0 ? "text-white/40" : 
                                                        closing.difference > 0 ? "text-emerald-400" : "text-red-400"
                                                    )}>
                                                        {closing.difference > 0 ? '+' : ''}{formatVND(closing.difference)}
                                                    </span>
                                                    <div className="w-12 h-0.5 rounded-full bg-white/5 overflow-hidden">
                                                        <div 
                                                            className={cn(
                                                                "h-full transition-all duration-500",
                                                                closing.difference === 0 ? "bg-white/20 w-full" : 
                                                                closing.difference > 0 ? "bg-emerald-500 w-full" : "bg-red-500 w-full"
                                                            )} 
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                                    closing.difference === 0 
                                                        ? "bg-gold/10 text-gold border-gold/30"
                                                        : closing.difference > 0
                                                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                            : "bg-red-500/20 text-red-500 border-red-500/30 animate-pulse"
                                                )}>
                                                    {closing.difference === 0 ? 'Khớp 100%' : closing.difference > 0 ? 'Thừa tiền' : 'Thất thoát'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold text-[10px] font-bold">
                                                        {closing.staff.fullName[0]}
                                                    </div>
                                                    <span className="text-xs font-medium text-foreground/80">{closing.staff.fullName}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <button 
                                                    onClick={() => setSelectedId(closing.id)}
                                                    className="p-3 rounded-2xl bg-white/5 text-white/40 hover:text-gold hover:bg-gold/10 hover:border-gold/20 border border-transparent transition-all group/btn"
                                                >
                                                    <Eye className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                                                </button>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[200px] italic">
                                                    {closing.note || 'Không có ghi chú'}
                                                </p>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <ClosingDetailPanel 
                    id={selectedId}
                    onClose={() => setSelectedId(null)}
                />
            </div>
        </AuthGuard>
    );
}
