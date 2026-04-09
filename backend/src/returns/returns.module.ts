import { Module } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { ReturnsController } from './returns.controller';
import { ReturnsAdminController } from './returns-admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ReturnsController, ReturnsAdminController],
  providers: [ReturnsService],
  exports: [ReturnsService],
})
export class ReturnsModule {}
