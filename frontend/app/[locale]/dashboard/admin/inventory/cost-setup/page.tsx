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
      <main className="px-0 py-4 sm:px-6 sm:py-8 max-w-[1400px] mx-auto space-y-6 sm:space-y-10 lg:space-y-12">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 sm:gap-8">
          <div className="space-y-5 sm:space-y-6">
            <button
              onClick={() => router.back()}
              className="flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-white/65 dark:bg-white/5 border border-gold/10 text-muted-foreground hover:bg-gold hover:text-luxury-black transition-all active:scale-95 shadow-xl group"
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            </button>
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl font-heading gold-gradient italic leading-tight">
                Thiết lập Giá Vốn
              </h1>
            </div>
          </div>

          <div className="flex w-full lg:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="relative group w-full sm:flex-1 lg:w-80 lg:flex-none">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm sản phẩm..."
                className="w-full bg-white/65 dark:bg-white/5 border border-gold/10 rounded-2xl pl-12 pr-4 sm:pr-6 py-3.5 sm:py-4 text-sm outline-none focus:border-gold/50 transition-all shadow-inner"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex min-h-12 items-center justify-center gap-3 bg-gradient-to-r from-[#d7b96d] via-gold to-[#b58f44] text-luxury-black px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl [font-size:0.82rem] font-black hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-gold/20 disabled:opacity-50"
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

        <div className="glass rounded-3xl lg:rounded-[3rem] border-white/5 overflow-hidden shadow-2xl">
          <div className="lg:hidden p-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-48 animate-pulse rounded-3xl bg-secondary/30 dark:bg-white/5" />
                ))}
              </div>
            ) : filteredVariants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground/40">
                <PackageSearch className="w-14 h-14 mb-4" />
                <p className="text-xl font-heading italic">Không tìm thấy sản phẩm</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredVariants.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-3xl border border-gold/10 bg-white/80 p-4 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.8)] dark:bg-white/[0.04]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-border bg-secondary/40">
                        {v.imageUrl ? (
                          <img src={v.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <PackageSearch className="w-5 h-5 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="[font-size:0.76rem] font-bold text-gold">{v.brandName || "Không rõ thương hiệu"}</p>
                        <h3 className="mt-1 text-base font-semibold leading-snug text-foreground">{v.productName}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-border bg-background px-3 py-1 [font-size:0.78rem] font-semibold text-foreground">
                            {v.name}
                          </span>
                          <span className="rounded-full bg-stone-100 px-3 py-1 font-mono [font-size:0.72rem] text-stone-500 dark:bg-white/5 dark:text-white/45">
                            {v.sku || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
                        <p className="[font-size:0.72rem] font-bold text-muted-foreground">Tồn hiện tại</p>
                        <p className={cn("mt-1 text-2xl font-heading italic leading-none", v.stock === 0 ? "text-rose-500/60" : "text-foreground")}>
                          {v.stock}
                        </p>
                        <p className="[font-size:0.68rem] font-semibold text-muted-foreground/60">đơn vị</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/10 p-3">
                        <p className="[font-size:0.72rem] font-bold text-muted-foreground">Giá bán</p>
                        <p className="mt-1 text-sm font-bold text-emerald-600">
                          {v.price.toLocaleString()}đ
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="mb-1.5 block [font-size:0.76rem] font-semibold text-muted-foreground">
                        Giá vốn mặc định
                      </label>
                      <div className="relative group/input">
                        <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
                        <input
                          type="number"
                          value={modifiedPrices[v.id] || ""}
                          onChange={(e) => updatePrice(v.id, e.target.value)}
                          placeholder="Nhập giá vốn..."
                          className="w-full bg-background/70 border border-border rounded-2xl pl-11 pr-10 py-3.5 text-right font-semibold text-sm focus:border-emerald-500/50 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 [font-size:0.78rem] font-black opacity-35 group-focus-within/input:opacity-100 transition-opacity">đ</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full min-w-[980px] text-left border-collapse">
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
