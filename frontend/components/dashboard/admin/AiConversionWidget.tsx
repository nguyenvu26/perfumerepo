'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AiConversionWidgetProps {
    data: {
        totalConsultations: number;
        totalItemsSold: number;
        aiRecommendedItemsSold: number;
        conversionRate: number;
    } | null;
    loading?: boolean;
}

const COLORS = ['#8b5cf6', '#334155'];

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass bg-background/90 border border-border rounded-2xl p-3 shadow-xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{payload[0].name}</p>
            <p className="text-sm font-heading text-foreground mt-1">{payload[0].value} items</p>
        </div>
    );
};

const CustomLabel = ({ cx, cy, rate }: { cx: number; cy: number; rate: number }) => {
    return (
        <>
            <text x={cx} y={cy - 4} textAnchor="middle" fill="#fff" fontSize={24} fontWeight={700} fontFamily="inherit">
                {rate}%
            </text>
            <text x={cx} y={cy + 16} textAnchor="middle" fill="#8b5cf6" fontSize={9} fontFamily="inherit" fontWeight={700} letterSpacing="2">
                WIN RATE
            </text>
        </>
    );
};

export function AiConversionWidget({ data, loading }: AiConversionWidgetProps) {
    const t = useTranslations('dashboard.admin');

    const total = data?.totalItemsSold || 0;
    const aiItems = data?.aiRecommendedItemsSold || 0;
    const otherItems = total - aiItems;
    const rate = data?.conversionRate || 0;

    const chartData = [
        { name: 'AI Recommended', value: aiItems },
        { name: 'Organic/Other', value: otherItems },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="glass bg-background/40 rounded-[2rem] border border-border p-6 md:p-8"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400">
                    <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-sm font-heading uppercase tracking-widest text-foreground">AI Conversion</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Impact of AI Recommendations</p>
                </div>
            </div>

            {loading ? (
                <div className="h-[200px] flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                </div>
            ) : total === 0 ? (
                <div className="h-[200px] flex items-center justify-center">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">No Data Available</p>
                </div>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={65}
                                outerRadius={85}
                                paddingAngle={3}
                                dataKey="value"
                                labelLine={false}
                                label={(props) => (
                                    props.cx !== undefined && props.cy !== undefined
                                        ? <CustomLabel cx={props.cx} cy={props.cy} rate={rate} />
                                        : null
                                )}
                            >
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Stat rows */}
                    <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">AI Driven Items</span>
                            </div>
                            <span className="text-[11px] font-bold text-foreground">{aiItems}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#334155]" />
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Organic/Other Items</span>
                            </div>
                            <span className="text-[11px] font-bold text-foreground">{otherItems}</span>
                        </div>
                        <div className="pt-3 mt-1 border-t border-border/50 flex items-center justify-between">
                             <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Consultations</span>
                             <span className="text-[11px] font-bold text-violet-400">{data?.totalConsultations || 0} sessions</span>
                        </div>
                    </div>
                </>
            )}
        </motion.div>
    );
}
