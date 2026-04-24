import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { ShippingModule } from '../shipping/shipping.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    PrismaModule,
    PromotionsModule,
    LoyaltyModule,
    ShippingModule,
    NotificationsModule,
    CloudinaryModule,
    MailModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
