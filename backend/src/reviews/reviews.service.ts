import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { OrderStatus, ReactionType } from '@prisma/client';
import { AiService } from '../ai/ai.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  async create(userId: string, dto: CreateReviewDto) {
    const orderItem = await this.prisma.orderItem.findUnique({
      where: { id: dto.orderItemId },
      include: {
        order: true,
        variant: true,
        review: true,
      },
    }) as any;

    if (!orderItem) {
      throw new NotFoundException('Order item not found');
    }

    if (orderItem.order.userId !== userId) {
      throw new ForbiddenException('You can only review your own purchases');
    }

    if (orderItem.order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException('You can only review completed orders');
    }

    if (orderItem.variant.productId !== dto.productId) {
      throw new BadRequestException('Product ID does not match the order item');
    }

    if (orderItem.review) {
      throw new BadRequestException('You have already reviewed this item');
    }

    const review = await this.prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          userId,
          productId: dto.productId,
          orderItemId: dto.orderItemId,
          rating: dto.rating,
          content: dto.content,
          images: dto.images
            ? {
              create: dto.images.map((url) => ({ imageUrl: url })),
            }
            : undefined,
        },
        include: {
          images: true,
        },
      });

      return newReview;
    });

    // Trigger AI summary update asynchronously
    this.aiService.summarizeProductReviews(dto.productId).catch((err) => {
      console.error('AI Summary failed:', err);
    });

    return review;
  }

  async findAll(productId: string, skip = 0, take = 20) {
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where: {
          productId,
          isHidden: false,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          images: true,
          _count: {
            select: {
              reactions: {
                where: { type: ReactionType.HELPFUL },
              },
            },
          },
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.review.count({
        where: {
          productId,
          isHidden: false,
        },
      }),
    ]);

    return { items, total };
  }

  async getProductStats(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId, isHidden: false },
      select: { rating: true },
    });

    const total = reviews.length;
    if (total === 0) {
      return {
        average: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    reviews.forEach((r) => {
      sum += r.rating;
      distribution[r.rating as keyof typeof distribution]++;
    });

    return {
      average: parseFloat((sum / total).toFixed(1)),
      total,
      distribution,
    };
  }

  async uploadReviewImages(userId: string, files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const results = await this.cloudinaryService.uploadImages(
      files.map((f) => f.buffer),
      `perfume-gpt/reviews/${userId}`,
    );

    return results.map((r) => r.url);
  }

  async update(userId: string, id: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        rating: dto.rating,
        content: dto.content,
        images: dto.images
          ? {
            deleteMany: {},
            create: dto.images.map((url) => ({ imageUrl: url })),
          }
          : undefined,
      },
      include: {
        images: true,
      },
    });

    // Re-trigger AI summary
    this.aiService.summarizeProductReviews(updated.productId).catch((err) => {
      console.error('AI Summary failed:', err);
    });

    return updated;
  }

  async remove(userId: string, id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    const deleted = await this.prisma.review.update({
      where: { id },
      data: { isHidden: true },
    });

    // Re-trigger AI summary
    this.aiService.summarizeProductReviews(deleted.productId).catch((err) => {
      console.error('AI Summary failed:', err);
    });

    return deleted;
  }

  async react(userId: string, id: string, type: ReactionType) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.prisma.reviewReaction.upsert({
      where: {
        reviewId_userId: {
          reviewId: id,
          userId,
        },
      },
      update: { type },
      create: {
        reviewId: id,
        userId,
        type,
      },
    });
  }

  async report(userId: string, id: string, reason: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.prisma.reviewReport.create({
      data: {
        reviewId: id,
        userId,
        reason,
      },
    });
  }

  async getSummary(productId: string) {
    return this.prisma.reviewSummary.findUnique({
      where: { productId },
    });
  }
}
