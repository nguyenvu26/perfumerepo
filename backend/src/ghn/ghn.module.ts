import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { GHNService } from './ghn.service';
import { GHNController } from './ghn.controller';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [GHNController],
  providers: [GHNService],
  exports: [GHNService],
})
export class GHNModule {}
