import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from '@/lib/i18n';

export default function FavoritesPage() {
    return (
        <div className="min-h-screen bg-background pt-32 px-6 pb-20">
            <div className="max-w-7xl mx-auto">
                <header className="mb-16 text-center">
                    <Heart className="w-12 h-12 text-gold mx-auto mb-6 fill-gold/10" />
                    <h1 className="text-5xl font-heading gold-gradient mb-4 uppercase tracking-tighter">Your Sanctuary</h1>
                    <p className="text-muted-foreground font-body text-sm uppercase tracking-widest">A curated archive of your desired essences.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="glass rounded-[3rem] border-border overflow-hidden hover:border-gold/30 transition-all group">
                            <div className="aspect-[4/5] bg-secondary/30 relative overflow-hidden">
                                <div className="absolute top-6 right-6 z-10">
                                    <button className="w-10 h-10 rounded-full glass border-border flex items-center justify-center text-red-400 hover:bg-red-400/10 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
                            </div>
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <p className="text-[10px] text-gold uppercase tracking-[0.2em] font-bold mb-1">Elite Series</p>
                                        <h3 className="font-heading text-2xl uppercase tracking-widest text-foreground">Velvet Oud</h3>
                                    </div>
                                    <p className="font-heading text-xl">$320</p>
                                </div>
                                <button className="w-full bg-foreground text-background py-4 rounded-2xl font-heading text-[10px] uppercase font-bold tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-gold hover:text-primary-foreground transition-all">
                                    <ShoppingBag className="w-4 h-4" /> Add to Bag
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State
                <div className="py-40 text-center">
                    <div className="w-20 h-20 rounded-full glass border-border mx-auto mb-8 flex items-center justify-center">
                        <Heart className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                    <h2 className="font-heading text-xl uppercase tracking-widest text-muted-foreground mb-6">Your sanctuary is empty</h2>
                    <Link href="/collection">
                        <button className="bg-gold text-primary-foreground px-10 py-4 rounded-full font-heading text-[10px] uppercase font-bold tracking-widest hover:scale-105 transition-all">
                            Explore Catalog
                        </button>
                    </Link>
                </div>
                */}
            </div>
        </div>
    );
}
