import { Module } from '@nestjs/common';
import { DailyClosingService } from './daily-closing.service';
import { DailyClosingController } from './daily-closing.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DailyClosingController],
  providers: [DailyClosingService],
})
export class DailyClosingModule {}
