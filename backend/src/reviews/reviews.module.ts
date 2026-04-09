import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { AdminReviewsController } from './admin-reviews.controller';
import { AiModule } from '../ai/ai.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [AiModule, CloudinaryModule],
  controllers: [ReviewsController, AdminReviewsController],
  providers: [ReviewsService]
})
export class ReviewsModule {}
