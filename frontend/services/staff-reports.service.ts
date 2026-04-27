import api from '@/lib/axios';

export type DailyReport = {
  date: string;
  totalRevenue: number;
  cashRevenue: number;
  transferRevenue: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  totalRefundedAmount: number;
  avgOrderValue: number;
  completionRate: number;
  cancelRate: number;
  topProducts: {
    productName: string;
    variantName: string;
    imageUrl?: string;
    totalQuantity: number;
    totalRevenue: number;
  }[];
};

export type DailyClosingHistory = {
    id: string;
    storeId: string;
    staffId: string;
    closingDate: string;
    systemTotal: number;
    systemCash: number;
    systemTransfer: number;
    actualCash: number;
    difference: number;
    note?: string;
    orderCount: number;
    createdAt: string;
    staff: { fullName: string };
    store: { name: string };
};

export const staffReportsService = {
    getDailyReport(date?: string, storeId?: string): Promise<DailyReport> {
        return api
            .get<DailyReport>('/staff/reports/daily', { 
                params: { 
                    ...(date ? { date } : {}),
                    ...(storeId ? { storeId } : {}),
                } 
            })
            .then((r) => r.data);
    },

    getClosingHistory(storeId?: string): Promise<DailyClosingHistory[]> {
        return api
            .get<DailyClosingHistory[]>('/daily-closing', {
                params: storeId ? { storeId } : {},
            })
            .then((r) => r.data);
    },
};
