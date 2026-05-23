import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /** Dashboard overview stats (revenue, orders, customers, AI consultations) */
  @Get('overview')
  async getOverview(
    @Query('period') period?: 'today' | 'week' | 'month' | 'year' | 'quarter',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.analyticsService.getOverview(period || 'month', startDate, endDate, storeId);
  }

  /** Sales trend data for charting – ?period=week|month|year|quarter */
  @Get('sales-trend')
  async getSalesTrend(
    @Query('period') period?: 'today' | 'week' | 'month' | 'year' | 'quarter',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.analyticsService.getSalesTrend(period || 'month', startDate, endDate, storeId);
  }

  /** Top selling products – ?limit=5 */
  @Get('top-products')
  async getTopProducts(
    @Query('limit') limit?: string,
    @Query('storeId') storeId?: string,
  ) {
    const parsedLimit = Number(limit ?? 5);
    return this.analyticsService.getTopProducts(
      Number.isFinite(parsedLimit) ? parsedLimit : 5,
      storeId,
    );
  }

  /** Channel breakdown: online vs POS */
  @Get('channel-breakdown')
  async getChannelBreakdown() {
    return this.analyticsService.getChannelBreakdown();
  }

  /** Low stock alerts – ?threshold=10 */
  @Get('low-stock')
  async getLowStock(@Query('threshold') threshold?: string) {
    const parsed = Number(threshold ?? 10);
    return this.analyticsService.getLowStockItems(
      Number.isFinite(parsed) ? parsed : 10,
    );
  }

  /** Recent orders feed */
  @Get('recent-orders')
  async getRecentOrders(@Query('limit') limit?: string) {
    const parsed = Number(limit ?? 8);
    return this.analyticsService.getRecentOrders(
      Number.isFinite(parsed) ? parsed : 8,
    );
  }

  @Get('store-revenue')
  async getStoreRevenue(@Query('storeId') storeId: string) {
    return this.analyticsService.getStoreRevenue(storeId);
  }

  @Get('ai-conversion')
  async getAiConversionRate(
    @Query('period') period?: 'today' | 'week' | 'month' | 'year' | 'quarter' | 'custom',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getAiConversionRate(period || 'month', startDate, endDate);
  }

  @Get('financial')
  @Roles('ADMIN')
  async getFinancialAnalytics() {
    return this.analyticsService.getFinancialAnalytics();
  }

  @Get('inventory-health')
  @Roles('ADMIN')
  async getInventoryHealth(@Query('storeId') storeId?: string) {
    return this.analyticsService.getInventoryHealth(storeId);
  }

  @Get('stock-heatmap')
  @Roles('ADMIN')
  async getStockMovementHeatmap() {
    return this.analyticsService.getStockMovementHeatmap();
  }

  @Get('expiry-alerts')
  @Roles('ADMIN')
  async getExpiryAlerts(@Query('storeId') storeId?: string) {
    return this.analyticsService.getExpiryAlerts(storeId);
  }
}
