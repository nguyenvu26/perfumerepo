import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { StaffReportsService } from './staff-reports.service';

@Controller('staff/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STAFF', 'ADMIN')
export class StaffReportsController {
    constructor(private readonly staffReportsService: StaffReportsService) { }

    @Get('daily')
    getDailyReport(
        @Req() req: any, 
        @Query('date') date?: string,
        @Query('storeId') storeId?: string,
    ) {
        const user = req.user as { userId: string; role: string };
        return this.staffReportsService.getDailyReport(
            user.userId,
            (user.role as 'STAFF' | 'ADMIN') || 'STAFF',
            date,
            storeId,
        );
    }

    // --- NEW STAFF ANALYTICS ENDPOINTS ---

    @Get('analytics/overview')
    getStaffOverview(@Req() req: any) {
        const user = req.user as { userId: string; role: string };
        return this.staffReportsService.getStaffOverview(user.userId, user.role);
    }

    @Get('analytics/sales-trend')
    getStaffSalesTrend(@Req() req: any, @Query('period') period?: 'week' | 'month' | 'year') {
        const user = req.user as { userId: string; role: string };
        return this.staffReportsService.getStaffSalesTrend(user.userId, user.role, period || 'month');
    }

    @Get('analytics/top-products')
    getStaffTopProducts(@Req() req: any, @Query('limit') limit?: string) {
        const user = req.user as { userId: string; role: string };
        const parsedLimit = Number(limit ?? 5);
        return this.staffReportsService.getStaffTopProducts(user.userId, user.role, Number.isFinite(parsedLimit) ? parsedLimit : 5);
    }

    @Get('analytics/low-stock')
    getStaffLowStockItems(@Req() req: any, @Query('threshold') threshold?: string) {
        const user = req.user as { userId: string; role: string };
        const parsed = Number(threshold ?? 5);
        return this.staffReportsService.getStaffLowStockItems(user.userId, user.role, Number.isFinite(parsed) ? parsed : 5);
    }

    @Get('analytics/recent-orders')
    getStaffRecentOrders(@Req() req: any, @Query('limit') limit?: string) {
        const user = req.user as { userId: string; role: string };
        const parsed = Number(limit ?? 8);
        return this.staffReportsService.getStaffRecentOrders(user.userId, user.role, Number.isFinite(parsed) ? parsed : 8);
    }
}
