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
  ChevronLast,
  Trash2,
  RefreshCcw,
  Pencil
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
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
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ExpiryAlert | null>(null);
  const [editForm, setEditForm] = useState({
    batchCode: "",
    mfgDate: "",
    expiryDate: "",
    purchasePrice: 0
  });

  const fetchData = useCallback(async (pageNo: number, keyword: string, currentStatus: string) => {
    setLoading(true);
    try {
      const response = await analyticsService.getExpiryAlerts({
        page: pageNo,
        limit: pagination.limit,
        search: keyword || undefined,
        status: currentStatus !== "ALL" ? currentStatus : undefined,
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
      fetchData(1, search, filter);
    }, 400); // Simple debounce for search and filter
    return () => clearTimeout(timer);
  }, [search, filter, fetchData]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchData(newPage, search, filter);
    }
  };
  
  const handleDispose = async (batchId: string, batchCode: string) => {
    if (!confirm(`Bạn có chắc chắn muốn hủy lô hàng [${batchCode}] không? Hành động này sẽ trừ toàn bộ tồn kho của lô và không thể hoàn tác.`)) {
      return;
    }

    setProcessingId(batchId);
    try {
      await analyticsService.disposeBatch(batchId);
      toast.success(`Đã hủy thành công lô hàng ${batchCode}.`);
      fetchData(pagination.page, search, filter);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không thể hủy lô hàng.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    setProcessingId(editingItem.batchId);
    try {
      await analyticsService.updateBatch(editingItem.batchId, {
        batchCode: editForm.batchCode,
        mfgDate: editForm.mfgDate || undefined,
        expiryDate: editForm.expiryDate,
        purchasePrice: editForm.purchasePrice
      });
      toast.success("Đã cập nhật thông tin lô hàng.");
      setEditingItem(null);
      fetchData(pagination.page, search, filter);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không thể cập nhật lô hàng.");
    } finally {
      setProcessingId(null);
    }
  };

  const openEdit = (item: ExpiryAlert) => {
    setEditingItem(item);
    setEditForm({
      batchCode: item.batchCode,
      mfgDate: item.mfgDate ? new Date(item.mfgDate).toISOString().split('T')[0] : "",
      expiryDate: new Date(item.expiryDate).toISOString().split('T')[0],
      purchasePrice: item.purchasePrice
    });
  };

  return (
    <>
      <AuthGuard allowedRoles={['admin']}>
        <main className="p-4 sm:p-8 md:p-10 max-w-[1600px] mx-auto min-h-screen">
        <header className="mb-8 sm:mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-6 lg:gap-8">
          <div className="space-y-6">
            <button 
              onClick={() => router.back()}
              className="p-4 rounded-full bg-white/5 border border-white/10 text-muted-foreground hover:bg-gold hover:text-white transition-all active:scale-95 shadow-xl w-fit group"
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            </button>
            <div>
              <h1 className="text-4xl sm:text-6xl font-heading gold-gradient mb-4 uppercase tracking-tighter italic leading-tight">
                Chi Tiết Lô Hàng & HSD
              </h1>
            </div>
          </div>

          <div className="flex gap-4">
             <div className="glass px-5 sm:px-8 py-4 sm:py-5 rounded-[2rem] border-white/10 bg-red-500/5 flex flex-col items-start sm:items-end shadow-2xl">
                <span className="text-[9px] uppercase font-black tracking-widest text-red-500 opacity-60 italic mb-1">Lô cần xử lý</span>
                <span className="text-3xl font-heading italic text-red-400">
                  {pagination.total} Tổng số
                </span>
             </div>
          </div>
        </header>

        {/* Toolbar */}
        <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 mb-8 sm:mb-12">
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
  <div className="grid grid-cols-2 sm:grid-cols-3 xl:flex bg-secondary/20 p-2 rounded-3xl gap-2 border border-white/5 xl:overflow-x-auto">
    {(["ALL", "CRITICAL", "WARNING", "HEALTHY", "SOLD_OUT"] as const).map((f) => (
      <button
        key={f}
        onClick={() => setFilter(f)}
        className={cn(
          "px-4 xl:px-7 py-2.5 sm:py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
          filter === f ? "bg-white text-black shadow-xl" : "text-muted-foreground hover:bg-white/5"
        )}
      >
        {f === "ALL" ? "Tất cả" : f === "CRITICAL" ? "Khẩn cấp" : f === "WARNING" ? "Cảnh báo" : f === "HEALTHY" ? "An toàn" : "Đã bán hết"}
      </button>
    ))}
  </div>
        </div>

        {/* Inventory Table - Desktop */}
        <div className="hidden xl:block glass rounded-[2rem] 2xl:rounded-[3.5rem] border-white/5 overflow-hidden shadow-2xl relative mb-6">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[1260px] text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-secondary/10">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic whitespace-nowrap min-w-[350px]">Thông tin sản phẩm</th>
                  <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic text-center whitespace-nowrap min-w-[140px]">Mã Lô</th>
                  <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic text-center whitespace-nowrap min-w-[120px]">Số lượng</th>
                  <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic text-center whitespace-nowrap min-w-[150px]">Đơn giá vốn</th>
                  <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic text-center whitespace-nowrap min-w-[180px]">Hạn sử dụng</th>
                  <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic text-center whitespace-nowrap min-w-[140px]">Trạng thái</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic text-right whitespace-nowrap min-w-[130px]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {data.map((item, idx) => (
                    <motion.tr 
                      key={item.batchId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="group bg-transparent hover:bg-white/[0.03] transition-all border-b border-white/[0.02] last:border-0"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-secondary border border-white/5 relative group-hover:scale-110 transition-transform duration-500 shrink-0 shadow-lg">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-heading italic uppercase text-lg leading-tight mb-1 truncate group-hover:text-gold transition-colors">{item.productName}</p>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-black uppercase tracking-widest text-gold/60">{item.variantName}</span>
                               <span className="w-1 h-1 rounded-full bg-white/10" />
                               <span className="text-[9px] font-medium text-muted-foreground/40 italic">{item.warehouseName}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <span className="text-xs font-mono font-bold px-4 py-2 rounded-xl bg-luxury-black text-gold border border-gold/10 shadow-inner">
                          {item.batchCode}
                        </span>
                      </td>
                      <td className="px-4 py-6">
                        <div className="flex items-baseline gap-1 justify-center">
                          <span className={cn(
                            "text-2xl font-heading italic",
                            item.currentQuantity === 0 ? "text-red-500/50" : "text-foreground"
                          )}>{item.currentQuantity}</span>
                          <span className="text-xs text-muted-foreground/30 font-medium italic">/ {item.initialQuantity}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="inline-flex flex-col items-center">
                           <span className="text-xl font-heading italic text-gold tabular-nums">
                             {format.number(item.purchasePrice, { style: 'currency', currency: 'VND' })}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col items-center justify-center space-y-1.5">
                          <div className="flex flex-col items-center gap-0.5">
                             <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/40 italic">
                                <span>NSX:</span>
                                <span>{item.mfgDate ? new Date(item.mfgDate).toLocaleDateString(locale, { year: 'numeric', month: 'numeric', day: 'numeric' }) : '---'}</span>
                             </div>
                             <div className="flex items-center gap-2 text-xs font-bold text-foreground/80">
                               <Calendar className="w-4 h-4 text-gold/40" />
                               <span className="opacity-40 font-medium text-[10px] mr-1">HSD:</span>
                               {new Date(item.expiryDate).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
                             </div>
                          </div>
                          <div className={cn(
                            "px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest italic border",
                            item.status === 'CRITICAL' ? "text-red-500 border-red-500/10 bg-red-500/5" : 
                            item.status === 'WARNING' ? "text-amber-500 border-amber-500/10 bg-amber-500/5" : 
                            "text-emerald-500 border-emerald-500/10 bg-emerald-500/5"
                          )}>
                            Còn {item.daysUntilExpiry} ngày
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex justify-center">
                          <div className={cn(
                            "px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-xl flex items-center gap-2.5",
                            item.status === 'SOLD_OUT' ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/10" :
                            item.status === 'CRITICAL' ? "bg-red-500/10 text-red-500 border-red-500/10" :
                            item.status === 'WARNING' ? "bg-amber-500/10 text-amber-500 border-amber-500/10" :
                            "bg-emerald-500/10 text-emerald-400 border-emerald-500/10"
                          )}>
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full animate-pulse",
                              item.status === 'SOLD_OUT' ? "bg-zinc-500" :
                              item.status === 'CRITICAL' ? "bg-red-500" :
                              item.status === 'WARNING' ? "bg-amber-500" :
                              "bg-emerald-500"
                            )} />
                            {item.status === 'SOLD_OUT' ? 'Đã hết hàng' : item.status === 'CRITICAL' ? 'Hết hạn ngay' : item.status === 'WARNING' ? 'Cần chú ý' : 'An toàn tuyệt đối'}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => openEdit(item)}
                            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-gold/5 text-gold border border-gold/10 hover:bg-gold hover:text-white transition-all active:scale-90 group/btn relative"
                            title="Sửa thông tin"
                          >
                            <Pencil className="w-4 h-4" />
                            <span className="absolute bottom-full right-0 mb-3 px-3 py-1.5 bg-luxury-black border border-white/10 text-[8px] font-black uppercase tracking-widest text-white opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap rounded-lg shadow-2xl z-50">
                              Cập nhật dữ liệu
                            </span>
                          </button>

                          <button
                            onClick={() => handleDispose(item.batchId, item.batchCode)}
                            disabled={processingId === item.batchId}
                            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-red-500/5 text-red-500 border border-red-500/10 hover:bg-red-500 hover:text-white transition-all active:scale-90 group/btn relative"
                            title="Xóa / Hủy"
                          >
                            {processingId === item.batchId ? (
                              <RefreshCcw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            <span className="absolute bottom-full right-0 mb-3 px-3 py-1.5 bg-luxury-black border border-white/10 text-[8px] font-black uppercase tracking-widest text-white opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap rounded-lg shadow-2xl z-50">
                              Xuất hủy lô hàng
                            </span>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {loading && (
                   <tr>
                     <td colSpan={8} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-40 italic">
                           <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Đang tải dữ liệu...</span>
                        </div>
                     </td>
                   </tr>
                )}
                {!loading && data.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-32 text-center">
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
        </div>

        {/* Mobile Cards List - Mobile */}
        <div className="xl:hidden space-y-4 mb-6">
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass rounded-[2rem] border border-white/5 p-5 space-y-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-secondary/50" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-secondary/50 rounded w-2/3" />
                      <div className="h-3 bg-secondary/50 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-10 bg-secondary/30 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {!loading && data.length === 0 && (
            <div className="flex flex-col items-center justify-center opacity-20 italic py-16 space-y-4">
              <Package className="w-12 h-12" />
              <p className="text-base font-heading uppercase tracking-widest">Không tìm thấy lô hàng nào</p>
            </div>
          )}

          {!loading && data.map((item, idx) => (
            <motion.div
              key={item.batchId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={cn(
                "glass rounded-[2rem] border p-5 flex flex-col gap-4 shadow-xl hover:border-gold/30 transition-all",
                item.status === 'CRITICAL' ? "border-red-500/10 bg-red-500/[0.02]" :
                item.status === 'WARNING' ? "border-amber-500/10 bg-amber-500/[0.02]" :
                "border-white/5 bg-secondary/5"
              )}
            >
              {/* Product Info Row */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-secondary border border-white/5 relative shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading italic uppercase text-base leading-tight mb-1 group-hover:text-gold transition-colors truncate">
                    {item.productName}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 truncate">
                    {item.variantName}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-luxury-black text-gold/80 border border-gold/10 whitespace-nowrap">
                      {item.batchCode}
                    </span>
                    <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest opacity-40">
                      <Store className="w-2.5 h-2.5" />
                      {item.warehouseName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-4">
                <div className="space-y-1">
                  <span className="block text-[8px] uppercase font-black opacity-30">Tồn kho / Nhập đầu</span>
                  <p className="text-base font-heading italic">
                    <span className={cn(
                      "font-black text-lg",
                      item.currentQuantity === 0 ? "text-red-500/50" : "text-foreground/80"
                    )}>{item.currentQuantity}</span>
                    <span className="text-foreground/30 mx-1">/</span>
                    <span className="text-foreground/45">{item.initialQuantity} SP</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="block text-[8px] uppercase font-black opacity-30">Đơn giá vốn</span>
                  <p className="text-base font-heading italic text-gold font-black">
                    {format.number(item.purchasePrice, { style: 'currency', currency: 'VND' })}
                  </p>
                </div>
              </div>

              {/* Status and Action Row */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-heading">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>HSD: {new Date(item.expiryDate).toLocaleDateString(locale, { year: 'numeric', month: 'numeric', day: 'numeric' })}</span>
                  </div>
                  <p className={cn(
                    "text-[9px] font-black uppercase tracking-widest italic",
                    item.status === 'CRITICAL' ? "text-red-500" : item.status === 'WARNING' ? "text-amber-500" : "text-emerald-500"
                  )}>
                    Còn {item.daysUntilExpiry} ngày
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-lg flex items-center gap-1.5",
                    item.status === 'SOLD_OUT' ? "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" :
                    item.status === 'CRITICAL' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                    item.status === 'WARNING' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  )}>
                    {item.status === 'SOLD_OUT' ? <Package className="w-2.5 h-2.5" /> :
                     item.status === 'CRITICAL' ? <AlertTriangle className="w-2.5 h-2.5" /> : 
                     item.status === 'HEALTHY' ? <CheckCircle2 className="w-2.5 h-2.5" /> : null}
                    {item.status === 'SOLD_OUT' ? 'Đã hết' : item.status === 'CRITICAL' ? 'Khẩn cấp' : item.status === 'WARNING' ? 'Cảnh báo' : 'An toàn'}
                  </div>

                  <button
                    onClick={() => openEdit(item)}
                    className="p-2.5 rounded-xl bg-gold/10 text-gold border border-gold/20 hover:bg-gold hover:text-white transition-all active:scale-90"
                    title="Sửa thông tin"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDispose(item.batchId, item.batchCode)}
                    disabled={processingId === item.batchId}
                    className="p-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all active:scale-90"
                    title="Xuất hủy hàng"
                  >
                    {processingId === item.batchId ? (
                      <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination Controls - Shared */}
        {pagination.totalPages > 1 && (
          <div className="glass rounded-[1.5rem] sm:rounded-full border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 sm:px-10 py-6 sm:py-8 bg-secondary/10 shadow-xl mb-12">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
                 Trang {pagination.page} / {pagination.totalPages}
               </span>
               <div className="hidden sm:block w-1 h-1 rounded-full bg-white/20" />
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                 Tổng số {pagination.total} kết quả
               </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
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

        {/* Footer info */}
        <footer className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-8 py-8 border-t border-white/5 opacity-40">
           <p className="text-[10px] font-black uppercase tracking-widest italic text-center sm:text-left">
             Hệ thống tự động đồng bộ hóa FEFO · Cập nhật thời gian thực
           </p>
           <div className="flex flex-row flex-wrap items-center justify-center gap-6">
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
        {/* Edit Modal */}
        <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
          <DialogContent className="glass border-white/10 p-8 rounded-[2rem] max-w-md">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-heading italic gold-gradient uppercase">Cập nhật Lô Hàng</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 italic">Mã lô</Label>
                <Input 
                  value={editForm.batchCode}
                  onChange={(e) => setEditForm({...editForm, batchCode: e.target.value})}
                  className="bg-white/5 border-white/10 rounded-xl focus:border-gold/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 italic">Ngày sản xuất</Label>
                  <Input 
                    type="date"
                    value={editForm.mfgDate}
                    onChange={(e) => setEditForm({...editForm, mfgDate: e.target.value})}
                    className="bg-white/5 border-white/10 rounded-xl focus:border-gold/50 block w-full text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 italic">Hạn sử dụng</Label>
                  <Input 
                    type="date"
                    value={editForm.expiryDate}
                    onChange={(e) => setEditForm({...editForm, expiryDate: e.target.value})}
                    className="bg-white/5 border-white/10 rounded-xl focus:border-gold/50 block w-full text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 italic">Giá nhập (VNĐ)</Label>
                <Input 
                  type="number"
                  value={editForm.purchasePrice}
                  onChange={(e) => setEditForm({...editForm, purchasePrice: Number(e.target.value)})}
                  className="bg-white/5 border-white/10 rounded-xl focus:border-gold/50 text-white"
                />
                <p className="text-[8px] opacity-40 italic">Lưu ý: Thay đổi giá nhập sẽ tính lại Giá Vốn Bình Quân (WAC) của sản phẩm.</p>
              </div>
            </div>
            <DialogFooter className="mt-8 flex gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setEditingItem(null)}
                className="rounded-xl border border-white/5 uppercase text-[10px] font-black"
              >
                Hủy
              </Button>
              <Button 
                onClick={handleUpdate}
                disabled={processingId === editingItem?.batchId}
                className="bg-gold hover:bg-gold/80 text-white rounded-xl uppercase text-[10px] font-black px-8"
              >
                {processingId === editingItem?.batchId ? "Đang lưu..." : "Cập nhật"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      </AuthGuard>
    </>
  );
}
