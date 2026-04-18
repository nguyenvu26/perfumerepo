import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [AnalyticsModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
