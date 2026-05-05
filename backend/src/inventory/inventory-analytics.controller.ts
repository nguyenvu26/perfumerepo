import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InventoryAnalyticsService } from './inventory-analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/inventory/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class InventoryAnalyticsController {
  constructor(private readonly analyticsService: InventoryAnalyticsService) {}

  @Get('low-stock')
  getLowStock(@Query('threshold') threshold?: string) {
    return this.analyticsService.getLowStockReport(threshold ? parseInt(threshold) : 10);
  }

  @Get('value')
  getValue() {
    return this.analyticsService.getInventoryValueReport();
  }
}
