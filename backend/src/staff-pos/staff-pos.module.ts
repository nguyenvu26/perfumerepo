import { Module } from '@nestjs/common';
import { StaffPosController } from './staff-pos.controller';
import { StaffPosService } from './staff-pos.service';
import { StaffAiController } from './staff-ai.controller';
import { StaffAiService } from './staff-ai.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';
import { StoresModule } from '../stores/stores.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { OrdersModule } from '../orders/orders.module';
import { PromotionsModule } from '../promotions/promotions.module';

@Module({
  imports: [
    PrismaModule,
    PaymentsModule,
    StoresModule,
    LoyaltyModule,
    OrdersModule,
    PromotionsModule,
  ],
  controllers: [StaffPosController, StaffAiController],
  providers: [StaffPosService, StaffAiService],
})
export class StaffPosModule { }
