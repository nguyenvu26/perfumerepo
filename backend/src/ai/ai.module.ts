import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiLogController } from './ai-log.controller';
import { AnalyticsModule } from '../analytics/analytics.module';

import { AiScoringService } from './ai-scoring.service';

@Module({
  imports: [AnalyticsModule],
  controllers: [AiLogController],
  providers: [AiService, AiScoringService],
  exports: [AiService, AiScoringService],
})
export class AiModule {}
