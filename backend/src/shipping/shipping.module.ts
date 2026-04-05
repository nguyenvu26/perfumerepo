import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GHNModule } from '../ghn/ghn.module';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, GHNModule, NotificationsModule],
  controllers: [ShippingController],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}
