import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiLogController } from './ai-log.controller';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [AnalyticsModule],
  controllers: [AiLogController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
