import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StoresModule } from '../stores/stores.module';
import { StaffInventoryService } from './staff-inventory.service';
import { InventoryGateway } from './inventory.gateway';
import {
  StaffInventoryController,
  AdminInventoryRequestController,
} from './staff-inventory.controller';

@Module({
  imports: [PrismaModule, StoresModule],
  providers: [StaffInventoryService, InventoryGateway],
  controllers: [StaffInventoryController, AdminInventoryRequestController],
})
export class StaffInventoryModule {}
