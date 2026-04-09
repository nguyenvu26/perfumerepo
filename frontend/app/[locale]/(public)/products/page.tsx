import { Filter, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Link } from '@/lib/i18n';

export default function ProductsPage() {
    return (
        <div className="min-h-screen bg-background pt-32 px-6 pb-20">
            <div className="max-w-7xl mx-auto">
                <header className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <h1 className="text-6xl font-heading gold-gradient mb-4 uppercase tracking-tighter">The Catalog</h1>
                        <p className="text-muted-foreground font-body text-sm uppercase tracking-widest">Architected for the modern olfactory experience.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="glass px-8 py-3 rounded-full border-border flex items-center gap-3 text-[10px] uppercase tracking-widest font-heading hover:border-gold transition-all">
                            <SlidersHorizontal className="w-3 h-3" /> Filter
                        </button>
                        <button className="glass px-8 py-3 rounded-full border-border flex items-center gap-3 text-[10px] uppercase tracking-widest font-heading hover:border-gold transition-all">
                            Sort: Featured
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                        <Link key={i} href={`/collection/${i}`} className="group cursor-pointer">
                            <div className="aspect-[3/4] glass rounded-[3rem] border-border overflow-hidden mb-8 relative group-hover:border-gold/40 transition-all duration-700">
                                <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-background via-background/20 to-transparent opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                    <button className="w-full bg-gold text-primary-foreground py-4 rounded-2xl font-heading text-[10px] uppercase font-bold tracking-[0.2em] shadow-xl shadow-gold/20">
                                        Quick Synthesis
                                    </button>
                                </div>
                                <div className="absolute top-8 left-8">
                                    <div className="px-3 py-1 rounded-full glass border-gold/20 text-gold text-[8px] uppercase tracking-widest font-bold">New Arrival</div>
                                </div>
                            </div>
                            <div className="space-y-2 px-2">
                                <p className="text-[10px] text-gold uppercase tracking-[0.3em] font-bold">Aura Premiere</p>
                                <h3 className="font-heading text-xl uppercase tracking-widest group-hover:text-gold transition-colors">Obsidian Mist {i}</h3>
                                <div className="flex justify-between items-center pt-2">
                                    <p className="font-heading text-lg">$240.00</p>
                                    <p className="text-[8px] text-muted-foreground uppercase tracking-[0.2em]">Eau de Parfum</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-20 pt-12 border-t border-border/50 text-center">
                    <button className="glass px-12 py-5 rounded-full border-border text-[10px] uppercase tracking-[0.3em] font-heading font-bold hover:border-gold transition-all">
                        Synchronize More
                    </button>
                </div>
            </div>
        </div>
    );
}
