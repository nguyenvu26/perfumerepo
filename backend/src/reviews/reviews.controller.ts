import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReactionType } from '@prisma/client';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-images')
  @UseInterceptors(FilesInterceptor('images', 5))
  uploadImages(
    @Req() req: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.reviewsService.uploadReviewImages(req.user.userId, files);
  }

  @Get('product/:productId')
  findAll(
    @Param('productId') productId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.reviewsService.findAll(
      productId,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 20,
    );
  }

  @Get('product/:productId/stats')
  getStats(@Param('productId') productId: string) {
    return this.reviewsService.getProductStats(productId);
  }

  @Get('product/:productId/summary')
  getSummary(@Param('productId') productId: string) {
    return this.reviewsService.getSummary(productId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(req.user.userId, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.reviewsService.remove(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/react')
  react(
    @Req() req: any,
    @Param('id') id: string,
    @Body('type') type: ReactionType,
  ) {
    return this.reviewsService.react(req.user.userId, id, type);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/report')
  report(
    @Req() req: any,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.reviewsService.report(req.user.userId, id, reason);
  }
}
