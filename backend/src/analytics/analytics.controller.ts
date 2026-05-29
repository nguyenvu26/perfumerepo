import { Controller, Get, Post, Patch, Body, Query, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { InventoryService } from '../inventory/inventory.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly inventoryService: InventoryService,
  ) {}

  /** Dashboard overview stats (revenue, orders, customers, AI consultations) */
  @Get('overview')
  async getOverview(
    @Query('period') period?: 'today' | 'week' | 'month' | 'year' | 'quarter',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('storeId') storeId?: string,
    @Query('channel') channel?: 'ONLINE' | 'POS',
  ) {
    return this.analyticsService.getOverview(period || 'month', startDate, endDate, storeId, channel);
  }

  /** Sales trend data for charting – ?period=week|month|year|quarter */
  @Get('sales-trend')
  async getSalesTrend(
    @Query('period') period?: 'today' | 'week' | 'month' | 'year' | 'quarter',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('storeId') storeId?: string,
    @Query('channel') channel?: 'ONLINE' | 'POS',
  ) {
    return this.analyticsService.getSalesTrend(period || 'month', startDate, endDate, storeId, channel);
  }

  /** Top selling products – ?limit=5 */
  @Get('top-products')
  async getTopProducts(
    @Query('limit') limit?: string,
    @Query('period') period?: 'today' | 'week' | 'month' | 'year' | 'quarter' | 'custom',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('storeId') storeId?: string,
    @Query('channel') channel?: 'ONLINE' | 'POS',
  ) {
    const parsedLimit = Number(limit ?? 5);
    return this.analyticsService.getTopProducts(
      Number.isFinite(parsedLimit) ? parsedLimit : 5,
      period || 'month',
      startDate,
      endDate,
      storeId,
      channel
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
  async getRecentOrders(
    @Query('limit') limit?: string,
    @Query('period') period?: 'today' | 'week' | 'month' | 'year' | 'quarter' | 'custom',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('storeId') storeId?: string,
    @Query('channel') channel?: 'ONLINE' | 'POS',
  ) {
    const parsed = Number(limit ?? 8);
    return this.analyticsService.getRecentOrders(
      Number.isFinite(parsed) ? parsed : 8,
      period || 'month',
      startDate,
      endDate,
      storeId,
      channel
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
  async getExpiryAlerts(
    @Query('storeId') storeId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const p = Number(page ?? 1);
    const l = Number(limit ?? 20);
    return this.analyticsService.getExpiryAlerts(
      storeId,
      Number.isFinite(p) ? p : 1,
      Number.isFinite(l) ? l : 20,
      search,
      status,
    );
  }

  @Post('batch/:batchId/dispose')
  @Roles('ADMIN')
  async disposeBatch(@Param('batchId') batchId: string) {
    return this.inventoryService.disposeBatch(batchId);
  }

  @Patch('batch/:batchId')
  @Roles('ADMIN')
  async updateBatch(
    @Param('batchId') batchId: string,
    @Body() data: { batchCode?: string; mfgDate?: string; expiryDate?: string; purchasePrice?: number },
  ) {
    return this.inventoryService.updateBatch(batchId, {
      ...data,
      mfgDate: data.mfgDate ? new Date(data.mfgDate) : undefined,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
    });
  }
}
