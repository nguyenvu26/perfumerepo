import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StaffOrdersService } from './staff-orders.service';
import { StaffOrdersController } from './staff-orders.controller';
import { StaffReportsService } from './staff-reports.service';
import { StaffReportsController } from './staff-reports.controller';

@Module({
  imports: [PrismaModule],
  providers: [StaffOrdersService, StaffReportsService],
  controllers: [StaffOrdersController, StaffReportsController],
})
export class StaffOrdersModule { }
