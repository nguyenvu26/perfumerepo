import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Body,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRoleEnum } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleEnum.ADMIN)
export class AdminReviewsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviewsService: ReviewsService,
  ) {}

  @Get()
  async findAll(
    @Query('productId') productId?: string,
    @Query('userId') userId?: string,
    @Query('rating') rating?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const where = {
      productId,
      userId,
      rating: rating ? parseInt(rating, 10) : undefined,
    };

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          product: { select: { id: true, name: true } },
          images: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: skip ? parseInt(skip, 10) : 0,
        take: take ? parseInt(take, 10) : 20,
      }),
      this.prisma.review.count({ where }),
    ]);

    return { items, total };
  }

  @Patch(':id/hide')
  hide(@Param('id') id: string) {
    return this.prisma.review.update({
      where: { id },
      data: { isHidden: true },
    });
  }

  @Patch(':id/show')
  show(@Param('id') id: string) {
    return this.prisma.review.update({
      where: { id },
      data: { isHidden: false },
    });
  }

  @Patch(':id/pin')
  pin(@Param('id') id: string) {
    return this.prisma.review.update({
      where: { id },
      data: { isPinned: true },
    });
  }

  @Patch(':id/unpin')
  unpin(@Param('id') id: string) {
    return this.prisma.review.update({
      where: { id },
      data: { isPinned: false },
    });
  }

  @Patch(':id/flag')
  flag(@Param('id') id: string) {
    return this.prisma.review.update({
      where: { id },
      data: { flagged: true },
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prisma.review.delete({
      where: { id },
    });
  }

  @Get('reports')
  async getReports() {
    return this.prisma.reviewReport.findMany({
      include: {
        review: {
          include: {
            user: { select: { fullName: true } },
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
