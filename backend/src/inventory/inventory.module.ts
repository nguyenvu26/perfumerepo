import { Module, Global } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { TransferOrdersService } from './transfer-orders.service';
import { TransferOrdersController } from './transfer-orders.controller';
import { StocktakeService } from './stocktake.service';
import { StocktakeController } from './stocktake.controller';
import { InventoryAnalyticsService } from './inventory-analytics.service';
import { InventoryAnalyticsController } from './inventory-analytics.controller';

@Global()
@Module({
  providers: [InventoryService, TransferOrdersService, StocktakeService, InventoryAnalyticsService],
  controllers: [TransferOrdersController, StocktakeController, InventoryAnalyticsController],
  exports: [InventoryService, TransferOrdersService, StocktakeService, InventoryAnalyticsService],
})
export class InventoryModule {}
