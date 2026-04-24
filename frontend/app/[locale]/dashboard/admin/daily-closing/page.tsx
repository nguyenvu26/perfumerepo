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

interface DailyClosingDto {
    id: string;
    closingDate: string;
    systemTotal: number;
    systemCash: number;
    systemTransfer: number;
    actualCash: number;
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

    useEffect(() => {
        const fetchClosings = async () => {
            try {
                const { data } = await api.get<DailyClosingDto[]>('/daily-closing');
                setClosings(data);
            } catch (e) {
                console.error('Failed to fetch closings', e);
            } finally {
                setLoading(false);
            }
        };
        fetchClosings();
    }, []);

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

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-gold transition-colors" />
                            <input 
                                type="text"
                                placeholder="Tìm kiếm quầy hoặc nhân viên..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-background/40 border border-border rounded-full pl-11 pr-6 py-3 text-xs font-medium focus:outline-none focus:border-gold/40 w-[300px] transition-all"
                            />
                        </div>
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
                                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Thực tế (Tiền mặt)</th>
                                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Chênh lệch</th>
                                    <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nhân viên chốt</th>
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
                                                <span className="text-sm font-bold text-emerald-400 font-heading">
                                                    {formatVND(closing.actualCash)}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                                    closing.difference === 0 
                                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                        : "bg-red-500/10 text-red-500 border-red-500/20"
                                                )}>
                                                    {closing.difference > 0 ? '+' : ''}{formatVND(closing.difference)}
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
            </div>
        </AuthGuard>
    );
}
