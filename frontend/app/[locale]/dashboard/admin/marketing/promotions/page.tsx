'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { promotionService } from '@/services/promotion.service';
import { Tag, Plus, Loader2, Trash2, ShieldCheck, Zap, TrendingUp, X } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useFormatter } from 'next-intl';

export default function PromotionsAdmin() {
  const t = useTranslations('dashboard.admin.promotions');
  const tFeatured = useTranslations('featured');
  const format = useFormatter();
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      <main className="p-8 pb-20 max-w-7xl mx-auto">
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 text-gold mb-4">
              <Zap size={18} />
              <span className="text-[10px] font-bold tracking-[.4em] uppercase italic">{t('title')}</span>
            </div>
            <h1 className="text-5xl font-heading gold-gradient uppercase tracking-tighter mb-2">
              {t('subtitle')}
            </h1>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-4 bg-foreground dark:bg-gold text-background dark:text-foreground px-10 py-5 rounded-full font-heading text-[10px] uppercase tracking-[.3em] font-bold hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-gold/20"
          >
            <Plus size={16} strokeWidth={3} />
            {t('modals.create_title', { type: t('promotion_singular') })}
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            { label: t('stats.total'), value: promos.length, icon: Tag, color: 'text-stone-400' },
            { label: t('stats.active'), value: promos.filter(p => !isExpired(p.endDate)).length, icon: ShieldCheck, color: 'text-emerald-500' },
            { label: t('stats.redemptions'), value: promos.reduce((acc, p) => acc + (p.redemptionsCount || 0), 0), icon: TrendingUp, color: 'text-gold' },
          ].map((stat, i) => (
             <div key={i} className="glass p-10 rounded-[3rem] border-border relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-[60px] pointer-events-none" />
                <div className="flex items-center justify-between mb-4">
                  <stat.icon size={20} className={stat.color} />
                  <span className="text-3xl font-serif text-foreground">{stat.value}</span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
             </div>
          ))}
        </div>

        <div className="glass rounded-[3.5rem] border-border overflow-hidden shadow-2xl bg-background/30">
          <table className="w-full text-left font-body text-sm border-collapse">
            <thead className="bg-secondary/30 text-muted-foreground border-b border-border">
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
                    <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto" />
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-4">Syncing Ledger...</p>
                  </td>
                </tr>
              ) : promos.map((p) => (
                <tr key={p.id} className="hover:bg-white/2 transition-colors group">
                  <td className="px-10 py-10">
                    <span className="font-heading text-lg tracking-wider text-foreground group-hover:text-gold transition-colors">{p.code}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${p.isPublic ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-gold/10 text-gold border-gold/20'}`}>
                        {p.isPublic ? 'Public' : `Private (${p.pointsCost} pts)`}
                      </span>
                    </div>
                    <p className="text-[9px] text-muted-foreground font-mono mt-2 opacity-60 truncate max-w-[150px]">{p.description}</p>
                  </td>
                  <td className="px-10 py-10">
                    <span className="text-xl font-serif text-gold">
                      {p.discountType === 'PERCENTAGE' ? `${p.discountValue}%` : `-${format.number(p.discountValue, { style: 'currency', currency: tFeatured('currency_code') || 'VND' })}`}
                    </span>
                  </td>
                  <td className="px-10 py-10">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                       {p.usedCount} / {p.usageLimit ?? '∞'}
                    </span>
                  </td>
                  <td className="px-10 py-10">
                    <div className="w-full max-w-[80px] h-1.5 bg-secondary rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-gold transition-all duration-1000 ease-out" 
                         style={{
                           width: `${p.usageLimit ? Math.min((p.usedCount / p.usageLimit) * 100, 100) : 0}%`,
                         }}
                       />
                    </div>
                  </td>
                  <td className="px-10 py-10">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-foreground">
                        {format.dateTime(new Date(p.startDate))}
                      </span>
                      <span className="text-[9px] text-muted-foreground">→ {format.dateTime(new Date(p.endDate))}</span>
                    </div>
                  </td>
                  <td className="px-10 py-10">
                    <span className={`px-4 py-1.5 rounded-full text-[8px] uppercase tracking-[.2em] font-bold border transition-colors ${
                      isExpired(p.endDate) 
                        ? 'bg-stone-500/10 text-stone-500 border-border' 
                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    }`}>
                      {isExpired(p.endDate) ? t('status.expired') : t('status.active')}
                    </span>
                  </td>
                  <td className="px-10 py-10 text-right">
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-3 text-muted-foreground hover:text-red-500 hover:glass rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CREATE MODAL */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-6"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="glass rounded-[2rem] md:rounded-[3rem] border border-white/10 w-full max-w-3xl bg-background/50 relative flex flex-col max-h-[90vh] overflow-hidden shadow-2xl"
              >
                 <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 blur-[120px] pointer-events-none" />
                 
                 {/* MODAL HEADER - FIXED */}
                 <div className="px-8 py-6 md:px-12 md:py-8 flex justify-between items-center border-b border-white/5 bg-background/20 backdrop-blur-md z-10 shrink-0">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-heading gold-gradient uppercase tracking-tighter italic leading-none">
                        {t('modals.create_title', { type: t('promotion_singular') })}
                      </h2>
                      <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-[.4em] font-bold mt-2">{t('modals.create_subtitle')}</p>
                    </div>
                    <button 
                      onClick={() => setIsModalOpen(false)} 
                      className="p-2 md:p-3 hover:bg-white/10 rounded-full text-muted-foreground transition-all flex items-center justify-center border border-white/5"
                    >
                        <X size={20} className="md:w-6 md:h-6" />
                    </button>
                 </div>

                 {/* MODAL BODY - SCROLLABLE */}
                 <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground ml-1">{t('modals.code')}</label>
                          <input
                            required
                            value={form.code}
                            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                            className="w-full h-14 bg-white/5 border border-white/5 rounded-[1.2rem] px-6 text-xs font-bold uppercase tracking-widest outline-none focus:border-gold/50 transition-all font-mono"
                            placeholder="e.g. PERFUME GPT20"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground ml-1">{t('modals.type')}</label>
                          <select
                            value={form.discountType}
                            onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                            className="w-full h-14 bg-white/5 border border-white/5 rounded-[1.2rem] px-6 text-xs font-bold uppercase tracking-widest outline-none focus:border-gold/50 transition-all appearance-none"
                          >
                            <option value="PERCENTAGE">{t('types.percentage')}</option>
                            <option value="FIXED_AMOUNT">{t('types.fixed')}</option>
                          </select>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground ml-1">{t('modals.value')}</label>
                          <input
                            type="number"
                            required
                            value={form.discountValue}
                            onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                            className="w-full h-14 bg-white/5 border border-white/5 rounded-[1.2rem] px-6 text-xs font-bold uppercase tracking-widest outline-none focus:border-gold/50 transition-all"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground ml-1">{t('modals.limit')}</label>
                          <input
                            type="number"
                            required
                            value={form.usageLimit}
                            onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })}
                            className="w-full h-14 bg-white/5 border border-white/5 rounded-[1.2rem] px-6 text-xs font-bold uppercase tracking-widest outline-none focus:border-gold/50 transition-all"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground ml-1">{t('modals.start')}</label>
                          <input
                            type="date"
                            required
                            value={form.startDate}
                            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                            className="w-full h-14 bg-white/5 border border-white/5 rounded-[1.2rem] px-6 text-xs font-bold uppercase tracking-widest outline-none focus:border-gold/50 transition-all invert dark:invert-0"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground ml-1">{t('modals.end')}</label>
                          <input
                            type="date"
                            required
                            value={form.endDate}
                            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                            className="w-full h-14 bg-white/5 border border-white/5 rounded-[1.2rem] px-6 text-xs font-bold uppercase tracking-widest outline-none focus:border-gold/50 transition-all invert dark:invert-0"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground ml-1">{t('modals.is_public')}</label>
                          <div className="flex items-center gap-3 h-14">
                            <button
                              type="button"
                              onClick={() => setForm({ ...form, isPublic: true })}
                              className={`flex-1 h-full rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest ${form.isPublic ? 'bg-gold text-black border-gold' : 'border-white/5 text-muted-foreground hover:border-gold/30'}`}
                            >
                              {t('types.public')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setForm({ ...form, isPublic: false })}
                              className={`flex-1 h-full rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest ${!form.isPublic ? 'bg-gold text-black border-gold' : 'border-white/5 text-muted-foreground hover:border-gold/30'}`}
                            >
                              {t('types.private')}
                            </button>
                          </div>
                        </div>

                        {!form.isPublic && (
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground ml-1">{t('modals.points_cost')}</label>
                            <input
                              type="number"
                              required
                              value={form.pointsCost}
                              onChange={(e) => setForm({ ...form, pointsCost: Number(e.target.value) })}
                              className="w-full h-14 bg-white/5 border border-white/5 rounded-[1.2rem] px-6 text-xs font-bold uppercase tracking-widest outline-none focus:border-gold/50 transition-all"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground ml-1">{t('modals.desc')}</label>
                        <textarea
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                          className="w-full h-28 bg-white/5 border border-white/5 rounded-[1.2rem] p-6 text-xs font-medium outline-none focus:border-gold/50 transition-all resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full h-16 md:h-20 rounded-[1.5rem] md:rounded-[2rem] bg-gold text-black font-heading text-[11px] uppercase tracking-[.4em] font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-gold/20 disabled:opacity-50"
                      >
                        {submitting ? t('modals.submitting') : t('modals.submit')}
                      </button>
                    </form>
                 </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </AuthGuard>
  );
}
