"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { productService, type Product } from "@/services/product.service";
import { 
  ArrowLeft, 
  Save, 
  Search, 
  PackageSearch, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Wallet
} from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function CostSetupPage() {
  const locale = useLocale();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Local state for modified prices: { variantId: price }
  const [modifiedPrices, setModifiedPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productService.adminList({ take: 500 });
      setProducts(res.items);
      
      // Initialize modifiedPrices with current values
      const initialPrices: Record<string, number> = {};
      res.items.forEach(p => {
        p.variants?.forEach(v => {
          if (v.purchasePrice) {
            initialPrices[v.id] = v.purchasePrice;
          }
        });
      });
      setModifiedPrices(initialPrices);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const filteredVariants = useMemo(() => {
    const all = products.flatMap(p => (p.variants || []).map(v => ({
      ...v,
      productName: p.name,
      brandName: p.brand?.name,
      imageUrl: p.images?.[0]?.url
    })));

    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(v => 
      v.productName.toLowerCase().includes(q) || 
      v.sku?.toLowerCase().includes(q) ||
      v.brandName?.toLowerCase().includes(q)
    );
  }, [products, search]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const data = Object.entries(modifiedPrices).map(([variantId, purchasePrice]) => ({
        variantId,
        purchasePrice
      }));
      
      await productService.adminUpdatePurchasePrices(data);
      setSuccess("Cập nhật giá vốn hàng loạt thành công!");
      setTimeout(() => setSuccess(null), 3000);
      fetchProducts();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const updatePrice = (variantId: string, value: string) => {
    const price = value === "" ? 0 : parseInt(value, 10);
    setModifiedPrices(prev => ({ ...prev, [variantId]: price }));
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <main className="p-8 max-w-[1400px] mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-6">
            <button
              onClick={() => router.back()}
              className="group flex items-center gap-4 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-black hover:bg-gold hover:text-white transition-all active:scale-95 shadow-xl"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Quay lại
            </button>
            <div className="space-y-2">
              <h1 className="text-5xl font-heading gold-gradient uppercase tracking-tighter italic">
                Thiết lập Giá Vốn
              </h1>
              <p className="text-sm text-muted-foreground opacity-50 italic">
                Cập nhật giá nhập mặc định cho các sản phẩm cũ để báo cáo tài chính chính xác hơn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm sản phẩm..."
                className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm outline-none focus:border-gold/50 transition-all w-80 shadow-inner"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-3 bg-gold text-white px-8 py-4 rounded-2xl text-[10px] uppercase font-black tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-gold/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Lưu thay đổi
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-3">
              <AlertCircle className="w-4 h-4" /> {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4" /> {success}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="glass rounded-[3rem] border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="pl-10 pr-4 py-6 text-[10px] uppercase tracking-widest font-black opacity-40">Sản phẩm</th>
                  <th className="px-4 py-6 text-[10px] uppercase tracking-widest font-black opacity-40">SKU</th>
                  <th className="px-4 py-6 text-[10px] uppercase tracking-widest font-black opacity-40 text-center">Tồn hiện tại</th>
                  <th className="px-4 py-6 text-[10px] uppercase tracking-widest font-black opacity-40">Giá bán niêm yết</th>
                  <th className="px-10 py-6 text-[10px] uppercase tracking-widest font-black text-gold text-right w-64">Giá vốn mặc định (Cost)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="p-10"><div className="h-4 bg-white/5 rounded w-full" /></td>
                    </tr>
                  ))
                ) : filteredVariants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                      <div className="flex flex-col items-center justify-center opacity-20 italic">
                        <PackageSearch className="w-16 h-16 mb-4" />
                        <p className="text-xl font-heading uppercase tracking-widest">Không tìm thấy sản phẩm</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVariants.map((v) => (
                    <tr key={v.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="pl-10 pr-4 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/5 shrink-0">
                            {v.imageUrl ? (
                              <img src={v.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-white/5 flex items-center justify-center"><PackageSearch className="w-5 h-5 opacity-20" /></div>
                            )}
                          </div>
                          <div>
                            <p className="text-[8px] uppercase tracking-widest text-gold font-black mb-0.5">{v.brandName}</p>
                            <p className="text-sm font-bold uppercase tracking-tight">{v.productName}</p>
                            <span className="text-[9px] px-2 py-0.5 bg-white/5 rounded-md border border-white/5 text-muted-foreground uppercase tracking-tighter mt-1 inline-block">
                              {v.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <code className="text-[10px] text-muted-foreground font-mono bg-white/5 px-2 py-1 rounded">
                          {v.sku || "N/A"}
                        </code>
                      </td>
                      <td className="px-4 py-6 text-center">
                        <div className="flex flex-col items-center">
                          <span className={cn(
                            "font-heading text-lg italic",
                            v.stock === 0 ? "text-rose-500/50" : "text-foreground"
                          )}>
                            {v.stock}
                          </span>
                          <span className="text-[7px] uppercase font-black tracking-widest opacity-20">đơn vị</span>
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <div className="flex items-center gap-2 text-emerald-500/70">
                          <TrendingUp className="w-3 h-3" />
                          <span className="text-xs font-bold">{v.price.toLocaleString()}đ</span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="relative group/input inline-block w-full max-w-[200px]">
                          <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
                          <input
                            type="number"
                            value={modifiedPrices[v.id] || ""}
                            onChange={(e) => updatePrice(v.id, e.target.value)}
                            placeholder="Nhập giá vốn..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-right font-heading text-sm focus:border-emerald-500/50 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black opacity-20 group-focus-within/input:opacity-100 transition-opacity">đ</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
