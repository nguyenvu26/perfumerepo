'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { promotionService } from '@/services/promotion.service';
import { Tag, Plus, Loader2, Trash2, ShieldCheck, Zap, TrendingUp, X } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui.store';

export default function PromotionsAdmin() {
  const t = useTranslations('dashboard.admin.promotions');
  const { isSidebarCollapsed: isCollapsed, setModalOpen } = useUIStore();
  const tFeatured = useTranslations('featured');
  const format = useFormatter();
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpenState] = useState(false);

  const setIsModalOpen = (open: boolean) => {
    setIsModalOpenState(open);
    setModalOpen(open);
  };

  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    usageLimit: 100,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isPublic: true,
    pointsCost: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    try {
      const list = await promotionService.findAll();
      setPromos(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await promotionService.create({
        ...form,
        discountValue: Number(form.discountValue),
        usageLimit: Number(form.usageLimit),
        pointsCost: Number(form.pointsCost),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      });
      setIsModalOpen(false);
      fetchPromos();
    } catch (e) {
      alert(t('modals.error_create'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('delete_confirm', { type: t('promotion_singular') }))) return;
    try {
      await promotionService.remove(id);
      fetchPromos();
    } catch (e) {
      console.error(e);
    }
  };

  const isExpired = (endDate: string) => new Date(endDate) < new Date();

  return (
    <AuthGuard allowedRoles={['admin']}>
      <main className="p-4 sm:p-6 md:p-8 pb-20 max-w-[1600px] mx-auto">
        <header className="mb-8 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-heading gold-gradient mb-1 uppercase tracking-tighter italic leading-tight">{t('title')}</h1>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-[.4em] font-black opacity-60 italic leading-none">
              {t('subtitle')}
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto flex items-center justify-center gap-4 bg-gold text-primary-foreground px-8 py-4 sm:px-10 sm:py-5 rounded-full font-heading text-[10px] uppercase tracking-[.3em] font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-gold/20"
          >
            <Plus size={16} strokeWidth={3} />
            {t('modals.create_title', { type: t('promotion_singular') })}
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-8 mb-8 md:mb-16">
          {[
            { label: t('stats.total'), value: promos.length, icon: Tag, color: 'text-stone-400' },
            { label: t('stats.active'), value: promos.filter(p => !isExpired(p.endDate)).length, icon: ShieldCheck, color: 'text-emerald-500' },
            { label: t('stats.redemptions'), value: promos.reduce((acc, p) => acc + (p.redemptionsCount || 0), 0), icon: TrendingUp, color: 'text-gold' },
          ].map((stat, i) => (
             <div key={i} className={`glass p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-stone-200 dark:border-white/5 relative overflow-hidden group shadow-sm ${i === 2 ? 'col-span-2 md:col-span-1' : ''}`}>
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gold/5 blur-[40px] sm:blur-[60px] pointer-events-none" />
                <div className="flex items-center justify-between mb-4">
                  <stat.icon size={18} className={`${stat.color} sm:w-5 sm:h-5`} />
                  <span className="text-xl sm:text-3xl font-serif text-foreground italic">{stat.value}</span>
                </div>
                <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">{stat.label}</p>
             </div>
          ))}
        </div>

        <div className="hidden md:block glass rounded-[3.5rem] border border-stone-200 dark:border-white/5 overflow-hidden shadow-2xl bg-background/30">
          <table className="w-full text-left font-body text-sm border-collapse">
            <thead className="bg-secondary/10 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-10 py-8 text-[10px] uppercase tracking-widest font-heading">{t('table.code')}</th>
                <th className="px-10 py-8 text-[10px] uppercase tracking-widest font-heading">{t('table.discount')}</th>
                <th className="px-10 py-8 text-[10px] uppercase tracking-widest font-heading">{t('table.conditions')}</th>
                <th className="px-10 py-8 text-[10px] uppercase tracking-widest font-heading">{t('table.redeemed')}</th>
                <th className="px-10 py-8 text-[10px] uppercase tracking-widest font-heading">{t('table.validity')}</th>
                <th className="px-10 py-8 text-[10px] uppercase tracking-widest font-heading">{t('table.status')}</th>
                <th className="px-10 py-8 text-[10px] uppercase tracking-widest font-heading text-right">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-10 py-24 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto" strokeWidth={1} />
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-4 italic opacity-40">Syncing Ledger...</p>
                  </td>
                </tr>
              ) : promos.map((p) => (
                <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-10 py-10">
                    <span className="font-heading text-lg tracking-wider text-foreground group-hover:text-gold transition-colors">{p.code}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${p.isPublic ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-gold/10 text-gold border-gold/20'}`}>
                        {p.isPublic ? 'Public' : `Private (${p.pointsCost} pts)`}
                      </span>
                    </div>
                    <p className="text-[9px] text-muted-foreground font-mono mt-2 opacity-60 truncate max-w-[150px] italic">{p.description}</p>
                  </td>
                  <td className="px-10 py-10">
                    <span className="text-xl font-serif text-gold italic">
                      {p.discountType === 'PERCENTAGE' ? `${p.discountValue}%` : `-${format.number(p.discountValue, { style: 'currency', currency: tFeatured('currency_code') || 'VND', maximumFractionDigits: 0 })}`}
                    </span>
                  </td>
                  <td className="px-10 py-10">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                       {p.usedCount} / {p.usageLimit ?? '∞'}
                    </span>
                  </td>
                  <td className="px-10 py-10">
                    <div className="w-full max-w-[80px] h-1.5 bg-secondary/50 rounded-full overflow-hidden shadow-inner">
                       <div 
                         className="h-full bg-gold shadow-[0_0_10px_rgba(212,175,55,0.5)] transition-all duration-1000 ease-out" 
                         style={{
                           width: `${p.usageLimit ? Math.min((p.usedCount / p.usageLimit) * 100, 100) : 0}%`,
                         }}
                       />
                    </div>
                  </td>
                  <td className="px-10 py-10">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-foreground font-mono">
                        {format.dateTime(new Date(p.startDate), { dateStyle: 'medium' })}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-mono opacity-60">→ {format.dateTime(new Date(p.endDate), { dateStyle: 'medium' })}</span>
                    </div>
                  </td>
                  <td className="px-10 py-10">
                    <span className={`px-4 py-1.5 rounded-full text-[8px] uppercase tracking-[.2em] font-bold border transition-colors ${
                      isExpired(p.endDate) 
                        ? 'bg-stone-500/10 text-stone-500 border-border' 
                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                    }`}>
                      {isExpired(p.endDate) ? t('status.expired') : t('status.active')}
                    </span>
                  </td>
                  <td className="px-10 py-10 text-right">
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-3 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD LIST */}
        <div className="md:hidden space-y-4">
          {loading ? (
             <div className="py-20 flex flex-col items-center gap-4">
               <Loader2 className="w-10 h-10 animate-spin text-gold opacity-40" strokeWidth={1} />
               <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Syncing Ledger...</p>
             </div>
          ) : promos.map((p) => (
             <div key={p.id} className="glass p-6 rounded-[2.5rem] border border-stone-200 dark:border-white/5 space-y-6 relative overflow-hidden group active:scale-[0.98] transition-all">
                <div className="flex justify-between items-start">
                   <div>
                      <span className="font-heading text-xl text-gold group-hover:tracking-wider transition-all">{p.code}</span>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-[7px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded border ${p.isPublic ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-gold/10 text-gold border-gold/20'}`}>
                          {p.isPublic ? 'Public' : `Private (${p.pointsCost} pts)`}
                        </span>
                        <span className={`text-[7px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded border ${
                            isExpired(p.endDate) 
                              ? 'bg-stone-500/10 text-stone-500 border-border' 
                              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          }`}>
                            {isExpired(p.endDate) ? 'Expired' : 'Active'}
                        </span>
                      </div>
                   </div>
                   <button
                      onClick={() => handleDelete(p.id)}
                      className="p-3 text-muted-foreground hover:text-red-500 bg-secondary/10 rounded-full transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                   <div className="space-y-1">
                      <p className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold">Giảm giá</p>
                      <p className="text-lg font-serif italic text-foreground">
                        {p.discountType === 'PERCENTAGE' ? `${p.discountValue}%` : `-${format.number(p.discountValue, { style: 'currency', currency: tFeatured('currency_code') || 'VND', maximumFractionDigits: 0 })}`}
                      </p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold">Lượt dùng</p>
                      <p className="text-[10px] font-bold text-foreground">{p.usedCount} / {p.usageLimit ?? '∞'}</p>
                      <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mt-1 shadow-inner">
                        <div 
                          className="h-full bg-gold opacity-80" 
                          style={{ width: `${p.usageLimit ? Math.min((p.usedCount / p.usageLimit) * 100, 100) : 0}%` }}
                        />
                      </div>
                   </div>
                </div>

                <div className="pt-2">
                   <p className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Thời hạn</p>
                   <p className="text-[9px] font-mono opacity-80">
                      {format.dateTime(new Date(p.startDate), { dateStyle: 'medium' })} → {format.dateTime(new Date(p.endDate), { dateStyle: 'medium' })}
                   </p>
                </div>

                {p.description && (
                  <p className="text-[9px] italic text-muted-foreground opacity-60 line-clamp-1 border-t border-white/5 pt-4">
                    {p.description}
                  </p>
                )}
             </div>
          ))}
        </div>

        <AnimatePresence>
          {isModalOpen && (
            <div className={cn(
                "fixed top-0 bottom-0 right-0 z-[150] flex items-center justify-center p-0 sm:p-6 font-body transition-all duration-500 bg-white/10 dark:bg-zinc-950/80 backdrop-blur-2xl",
                "left-0 md:left-20",
                !isCollapsed && "lg:left-72"
            )} onClick={() => setIsModalOpen(false)}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 30 }}
                    className="relative w-full max-w-3xl h-full sm:h-auto sm:max-h-[85vh] bg-background border-t sm:border border-white/20 rounded-t-[3rem] sm:rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col glass"
                    onClick={(e) => e.stopPropagation()}
                >
                 <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[120px] pointer-events-none" />
                 
                 {/* MODAL HEADER - FIXED */}
                 <div className="px-8 py-8 md:px-12 md:py-10 flex justify-between items-center border-b border-white/10 bg-white/90 dark:bg-zinc-900/50 backdrop-blur-xl z-20 shrink-0">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-heading gold-gradient uppercase tracking-tighter italic leading-none mb-1">
                        {t('modals.create_title', { type: t('promotion_singular') })}
                      </h2>
                      <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-[.4em] font-bold opacity-60">{t('modals.create_subtitle')}</p>
                    </div>
                    <button 
                      onClick={() => setIsModalOpen(false)} 
                      className="p-3 bg-secondary/10 hover:bg-white/20 rounded-full text-muted-foreground transition-all flex items-center justify-center border border-border"
                    >
                        <X size={20} />
                    </button>
                 </div>

                 {/* MODAL BODY - SCROLLABLE */}
                 <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
                       <form onSubmit={handleSubmit} className="space-y-8 pb-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-[.3em] uppercase text-muted-foreground ml-1">{t('modals.code')}</label>
                            <input
                              required
                              value={form.code}
                              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                              className="w-full h-14 bg-zinc-50 dark:bg-white/5 border border-border/50 rounded-2xl px-6 text-sm font-bold outline-none focus:border-gold/50 transition-all font-mono"
                              placeholder="e.g. VIP20"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-[.3em] uppercase text-muted-foreground ml-1">{t('modals.type')}</label>
                            <select
                              value={form.discountType}
                              onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                              className="w-full h-14 bg-zinc-50 dark:bg-white/5 border border-border/50 rounded-2xl px-6 text-xs font-bold uppercase tracking-widest outline-none focus:border-gold/50 transition-all cursor-pointer appearance-none"
                            >
                              <option value="PERCENTAGE">{t('types.percentage')}</option>
                              <option value="FIXED_AMOUNT">{t('types.fixed')}</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-[.3em] uppercase text-muted-foreground ml-1">{t('modals.value')}</label>
                            <input
                              type="number"
                              required
                              value={form.discountValue}
                              onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                              className="w-full h-14 bg-zinc-50 dark:bg-white/5 border border-border/50 rounded-2xl px-6 text-sm font-bold outline-none focus:border-gold/50 transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-[.3em] uppercase text-muted-foreground ml-1">{t('modals.limit')}</label>
                            <input
                              type="number"
                              required
                              value={form.usageLimit}
                              onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })}
                              className="w-full h-14 bg-zinc-50 dark:bg-white/5 border border-border/50 rounded-2xl px-6 text-sm font-bold outline-none focus:border-gold/50 transition-all"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-[.3em] uppercase text-muted-foreground ml-1">{t('modals.start')}</label>
                            <input
                              type="date"
                              required
                              value={form.startDate}
                              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                              className="w-full h-14 bg-zinc-50 dark:bg-white/5 border border-border/50 rounded-2xl px-6 text-sm font-bold outline-none focus:border-gold/50 transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-[.3em] uppercase text-muted-foreground ml-1">{t('modals.end')}</label>
                            <input
                              type="date"
                              required
                              value={form.endDate}
                              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                              className="w-full h-14 bg-zinc-50 dark:bg-white/5 border border-border/50 rounded-2xl px-6 text-sm font-bold outline-none focus:border-gold/50 transition-all"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-[.3em] uppercase text-muted-foreground ml-1">{t('modals.is_public')}</label>
                            <div className="flex items-center gap-3 h-14">
                              <button
                                type="button"
                                onClick={() => setForm({ ...form, isPublic: true })}
                                className={`flex-1 h-full rounded-2xl border transition-all text-[10px] font-bold uppercase tracking-widest ${form.isPublic ? 'bg-gold text-black border-gold' : 'border-border/50 dark:border-white/5 text-muted-foreground hover:border-gold/30'}`}
                              >
                                {t('types.public')}
                              </button>
                              <button
                                type="button"
                                onClick={() => setForm({ ...form, isPublic: false })}
                                className={`flex-1 h-full rounded-2xl border transition-all text-[10px] font-bold uppercase tracking-widest ${!form.isPublic ? 'bg-gold text-black border-gold' : 'border-border/50 dark:border-white/5 text-muted-foreground hover:border-gold/30'}`}
                              >
                                {t('types.private')}
                              </button>
                            </div>
                          </div>

                          {!form.isPublic && (
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold tracking-[.3em] uppercase text-muted-foreground ml-1">{t('modals.points_cost')}</label>
                              <input
                                type="number"
                                required
                                value={form.pointsCost}
                                onChange={(e) => setForm({ ...form, pointsCost: Number(e.target.value) })}
                                className="w-full h-14 bg-zinc-50 dark:bg-white/5 border border-border/50 rounded-2xl px-6 text-sm font-bold outline-none focus:border-gold/50 transition-all"
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold tracking-[.3em] uppercase text-muted-foreground ml-1">{t('modals.desc')}</label>
                          <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full h-28 bg-zinc-50 dark:bg-white/5 border border-border/50 rounded-2xl p-6 text-sm font-light leading-relaxed outline-none focus:border-gold/50 transition-all resize-none"
                            placeholder="Nhập mô tả cho chương trình ưu đãi này..."
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full h-16 sm:h-20 rounded-[2rem] bg-gold text-black font-heading text-[11px] uppercase tracking-[.4em] font-extrabold hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gold/20 disabled:opacity-50 mt-4"
                        >
                          {submitting ? (
                            <div className="flex items-center justify-center gap-3">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {t('modals.submitting')}
                            </div>
                          ) : t('modals.submit')}
                        </button>
                      </form>
                 </div>
                </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </AuthGuard>
  );
}
