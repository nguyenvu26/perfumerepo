'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

import { useTranslations } from 'next-intl';

interface ChannelDonutChartProps {
    online: number;
    pos: number;
    loading?: boolean;
}

const COLORS = ['#C5A059', '#6366f1'];

const CustomTooltip = ({ active, payload }: any) => {
    const t = useTranslations('admin_dashboard');
    if (!active || !payload?.length) return null;
    return (
        <div className="glass bg-background/90 border border-border rounded-2xl p-3 shadow-xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{payload[0].name}</p>
            <p className="text-sm font-heading text-foreground mt-1">{t('orders', { count: payload[0].value })}</p>
        </div>
    );
};

const CustomLabel = ({ cx, cy, total }: { cx: number; cy: number; total: number }) => {
    const t = useTranslations('admin_dashboard');
    return (
        <>
            <text x={cx} y={cy - 8} textAnchor="middle" fill="#fff" fontSize={22} fontWeight={700} fontFamily="inherit">
                {total}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" fill="#888" fontSize={9} fontFamily="inherit" textLength="50" letterSpacing="2">
                {t('total')}
            </text>
        </>
    );
};

export function ChannelDonutChart({ online, pos, loading }: ChannelDonutChartProps) {
    const t = useTranslations('admin_dashboard');
    const total = online + pos;
    const chartData = [
        { name: 'Online', value: online },
        { name: 'POS (In-store)', value: pos },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass bg-background/40 rounded-[2rem] border border-border p-6 md:p-8"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-secondary text-foreground">
                    <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-sm font-heading uppercase tracking-widest text-foreground">{t('sales_channel')}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{t('sales_channel_subtitle')}</p>
                </div>
            </div>

            {loading ? (
                <div className="h-[200px] flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                </div>
            ) : total === 0 ? (
                <div className="h-[200px] flex items-center justify-center">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">{t('no_data')}</p>
                </div>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={85}
                                paddingAngle={3}
                                dataKey="value"
                                labelLine={false}
                                label={(props) => (
                                    props.cx !== undefined && props.cy !== undefined
                                        ? <CustomLabel cx={props.cx} cy={props.cy} total={total} />
                                        : null
                                )}
                            >
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Stat rows */}
                    <div className="mt-4 space-y-2">
                        {chartData.map((item, i) => (
                            <div key={item.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-foreground">{item.value}</span>
                                    <span className="text-[9px] text-muted-foreground">
                                        ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </motion.div>
    );
}
