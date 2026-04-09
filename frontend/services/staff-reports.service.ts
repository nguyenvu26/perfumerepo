import api from '@/lib/axios';

export type DailyReport = {
    date: string;
    totalRevenue: number;
    totalOrders: number;
    completedOrders: number;
    avgOrderValue: number;
    topProducts: {
        productName: string;
        variantName: string;
        totalQuantity: number;
        totalRevenue: number;
    }[];
};

export const staffReportsService = {
    getDailyReport(date?: string): Promise<DailyReport> {
        return api
            .get<DailyReport>('/staff/reports/daily', { params: date ? { date } : {} })
            .then((r) => r.data);
    },
};
