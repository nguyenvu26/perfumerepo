import { Module } from '@nestjs/common';
import { AiPreferencesController } from './ai-preferences.controller';
import { AiPreferencesService } from './ai-preferences.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiPreferencesController],
  providers: [AiPreferencesService],
  exports: [AiPreferencesService],
})
export class AiPreferencesModule {}
