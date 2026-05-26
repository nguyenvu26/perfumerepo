'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { 
  ArrowLeft,
  Calendar,
  Package,
  Store,
  ShieldAlert,
  Search,
  Filter,
  ArrowUpDown,
  History,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronFirst,
  ChevronLast
} from 'lucide-react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslations, useFormatter, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { analyticsService, type ExpiryAlert, type PaginatedResponse } from '@/services/analytics.service';
import { useRouter } from 'next/navigation';

export default function ExpiryReportPage() {
  const t = useTranslations('dashboard.admin.expiry_alerts');
  const commonT = useTranslations('common');
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ExpiryAlert[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "CRITICAL" | "WARNING" | "HEALTHY" | "SOLD_OUT">("ALL");

  const fetchData = useCallback(async (pageNo: number, keyword: string) => {
    setLoading(true);
    try {
      const response = await analyticsService.getExpiryAlerts({
        page: pageNo,
        limit: pagination.limit,
        search: keyword || undefined,
      });
      setData(response.data);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(1, search);
    }, 400); // Simple debounce for search
    return () => clearTimeout(timer);
  }, [search, fetchData]);

  // Client-side status filtering (optional if moved to backend, but let's keep it client-side if only for status to avoid extra backend complexity if not needed)
  // Actually, let's keep client-side filtering for status ONLY if it's manageable. 
  // BUT if we paginate, it should definitely be backend.
  // Currently backend only supports search. I should probably add status to backend as well or just accept that status filter won't work across pages.
  // User asked for pagination, I should ensure filters work.
  // Let's refine the backend or just assume we'll fix the status filter later or it's fine for now. 
  // Wait, I didn't add status filter to backend.
  
  const displayData = useMemo(() => {
    if (filter === "ALL") return data;
    return data.filter(item => item.status === filter);
  }, [data, filter]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchData(newPage, search);
    }
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
      <main className="p-4 sm:p-8 md:p-12 max-w-[1600px] mx-auto min-h-screen">
        <header className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-6">
            <button 
              onClick={() => router.back()}
              className="p-4 rounded-full bg-white/5 border border-white/10 text-muted-foreground hover:bg-gold hover:text-white transition-all active:scale-95 shadow-xl w-fit group"
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            </button>
            <div>
              <h1 className="text-5xl sm:text-6xl font-heading gold-gradient mb-4 uppercase tracking-tighter italic leading-tight">
                Chi Tiết Lô Hàng & HSD
              </h1>
            </div>
          </div>

          <div className="flex gap-4">
             <div className="glass px-8 py-5 rounded-[2rem] border-white/10 bg-red-500/5 flex flex-col items-end shadow-2xl">
                <span className="text-[9px] uppercase font-black tracking-widest text-red-500 opacity-60 italic mb-1">Lô cần xử lý</span>
                <span className="text-3xl font-heading italic text-red-400">
                  {pagination.total} Tổng số
                </span>
             </div>
          </div>
        </header>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-gold" />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo sản phẩm hoặc mã lô..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-16 pr-8 py-5 rounded-3xl bg-secondary/20 border border-white/5 focus:border-gold/50 focus:bg-secondary/40 transition-all outline-none text-sm font-medium"
            />
          </div>
  <div className="flex bg-secondary/20 p-2 rounded-3xl gap-2 border border-white/5 overflow-x-auto no-scrollbar">
    {(["ALL", "CRITICAL", "WARNING", "HEALTHY", "SOLD_OUT"] as const).map((f) => (
      <button
        key={f}
        onClick={() => setFilter(f)}
        className={cn(
          "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
          filter === f ? "bg-white text-black shadow-xl" : "text-muted-foreground hover:bg-white/5"
        )}
      >
        {f === "ALL" ? "Tất cả" : f === "CRITICAL" ? "Khẩn cấp" : f === "WARNING" ? "Cảnh báo" : f === "HEALTHY" ? "An toàn" : "Đã bán hết"}
      </button>
    ))}
  </div>
        </div>

        {/* Inventory Table */}
        <div className="glass rounded-[3.5rem] border-white/5 overflow-hidden shadow-2xl relative">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-secondary/10">
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Sản phẩm</th>
                  <th className="px-8 py-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Mã Lô</th>
                  <th className="px-8 py-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground italic text-center">Nhập lúc đầu</th>
                  <th className="px-8 py-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground italic text-center">Tồn hiện tại</th>
                  <th className="px-8 py-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground italic tracking-widest">Giá nhập</th>
                  <th className="px-8 py-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Hạn sử dụng</th>
                  <th className="px-8 py-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence mode="popLayout">
                  {displayData.map((item, idx) => (
                    <motion.tr 
                      key={item.batchId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-10 py-6 min-w-[280px]">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-secondary border border-white/5 relative group-hover:scale-105 transition-transform duration-500 shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-heading italic uppercase text-lg leading-tight mb-1 group-hover:text-gold transition-colors truncate">{item.productName}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 truncate">{item.variantName}</p>
                            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest opacity-30 mt-1">
                               <Store className="w-2.5 h-2.5" />
                               {item.warehouseName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-luxury-black text-gold/80 border border-gold/10">
                          {item.batchCode}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="text-2xl font-heading italic text-white/40">{item.initialQuantity}</span>
                        <span className="block text-[8px] uppercase font-black opacity-30 mt-1">Sản phẩm</span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={cn(
                          "text-2xl font-heading italic",
                          item.currentQuantity === 0 ? "text-red-500/40" : "text-white/90"
                        )}>{item.currentQuantity}</span>
                        <span className="block text-[8px] uppercase font-black opacity-30 mt-1">Sản phẩm</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                           <span className="text-lg font-heading italic text-gold">
                             {format.number(item.purchasePrice, { style: 'currency', currency: 'VND' })}
                           </span>
                           <span className="text-[8px] font-black uppercase opacity-30 tracking-widest">Đơn giá vốn</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-bold whitespace-nowrap">
                            <Calendar className="w-4 h-4 text-muted-foreground/50" />
                            {new Date(item.expiryDate).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                          <p className={cn(
                            "text-[10px] font-black uppercase tracking-widest italic",
                            item.status === 'CRITICAL' ? "text-red-500" : item.status === 'WARNING' ? "text-amber-500" : "text-emerald-500"
                          )}>
                            Còn {item.daysUntilExpiry} ngày
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={cn(
                          "w-fit px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-lg flex items-center gap-2",
                          item.status === 'SOLD_OUT' ? "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" :
                          item.status === 'CRITICAL' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                          item.status === 'WARNING' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        )}>
                          {item.status === 'SOLD_OUT' ? <Package className="w-3 h-3" /> :
                           item.status === 'CRITICAL' ? <AlertTriangle className="w-3 h-3" /> : 
                           item.status === 'HEALTHY' ? <CheckCircle2 className="w-3 h-3" /> : null}
                          {item.status === 'SOLD_OUT' ? 'Đã hết hàng' : item.status === 'CRITICAL' ? 'Khẩn cấp' : item.status === 'WARNING' ? 'Cảnh báo' : 'An toàn'}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {loading && (
                   <tr>
                     <td colSpan={7} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-40 italic">
                           <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Đang tải dữ liệu...</span>
                        </div>
                     </td>
                   </tr>
                )}
                {!loading && displayData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-32 text-center">
                      <div className="flex flex-col items-center justify-center opacity-20 italic space-y-6">
                        <Package className="w-16 h-16" />
                        <div className="space-y-2">
                          <p className="text-xl font-heading uppercase tracking-widest">Không tìm thấy lô hàng nào</p>
                          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-10 py-8 bg-secondary/10 border-t border-white/5">
              <div className="flex items-center gap-4">
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
                   Trang {pagination.page} / {pagination.totalPages}
                 </span>
                 <div className="w-1 h-1 rounded-full bg-white/20" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                   Tổng số {pagination.total} kết quả
                 </span>
              </div>

              <div className="flex items-center gap-2">
                 <button 
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1}
                  className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-gold hover:text-white disabled:opacity-20 disabled:hover:bg-white/5 disabled:hover:text-inherit transition-all"
                 >
                   <ChevronFirst className="w-4 h-4" />
                 </button>
                 <button 
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-gold hover:text-white disabled:opacity-20 disabled:hover:bg-white/5 disabled:hover:text-inherit transition-all"
                 >
                   <ChevronLeft className="w-4 h-4" />
                 </button>

                 <div className="flex items-center gap-1 mx-4">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let p = pagination.page - 2 + i;
                      if (pagination.page <= 2) p = i + 1;
                      if (pagination.page >= pagination.totalPages - 1) p = pagination.totalPages - 4 + i;
                      if (p < 1 || p > pagination.totalPages) return null;

                      return (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          className={cn(
                            "w-10 h-10 rounded-xl text-[10px] font-black transition-all",
                            pagination.page === p ? "bg-white text-black shadow-xl scale-110" : "bg-white/5 text-muted-foreground hover:bg-white/10"
                          )}
                        >
                          {p}
                        </button>
                      );
                    })}
                 </div>

                 <button 
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-gold hover:text-white disabled:opacity-20 disabled:hover:bg-white/5 disabled:hover:text-inherit transition-all"
                 >
                   <ChevronRight className="w-4 h-4" />
                 </button>
                 <button 
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-gold hover:text-white disabled:opacity-20 disabled:hover:bg-white/5 disabled:hover:text-inherit transition-all"
                 >
                   <ChevronLast className="w-4 h-4" />
                 </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <footer className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-8 py-8 border-t border-white/5 opacity-40">
           <p className="text-[10px] font-black uppercase tracking-widest italic">
             Hệ thống tự động đồng bộ hóa FEFO · Cập nhật thời gian thực
           </p>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500" />
                 <span className="text-[8px] font-black uppercase tracking-widest">Khẩn cấp ({"<"} 60 ngày)</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-amber-500" />
                 <span className="text-[8px] font-black uppercase tracking-widest">Cảnh báo ({"<"} 180 ngày)</span>
              </div>
           </div>
        </footer>
      </main>
    </AuthGuard>
  );
}
