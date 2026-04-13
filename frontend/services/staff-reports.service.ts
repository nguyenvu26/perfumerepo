import api from '@/lib/axios';

export type DailyReport = {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  successfulOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  avgOrderValue: number;
  completionRate: number;
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
