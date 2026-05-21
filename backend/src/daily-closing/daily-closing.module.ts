import { Module } from '@nestjs/common';
import { DailyClosingService } from './daily-closing.service';
import { DailyClosingController } from './daily-closing.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AutoDailyClosingService } from './auto-daily-closing.service';

@Module({
  imports: [PrismaModule],
  controllers: [DailyClosingController],
  providers: [DailyClosingService, AutoDailyClosingService],
})
export class DailyClosingModule {}
