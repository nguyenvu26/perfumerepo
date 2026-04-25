import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDailyClosingDto } from './dto/create-daily-closing.dto';

@Injectable()
export class DailyClosingService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateDailyClosingDto) {
    return this.prisma.dailyClosing.create({
      data: {
        ...dto,
        staffId: userId,
      },
    });
  }

  async findAll(storeId?: string) {
    return this.prisma.dailyClosing.findMany({
      where: storeId ? { storeId } : {},
      include: {
        staff: {
          select: {
            fullName: true,
          },
        },
        store: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async checkTodayClosing(storeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const closing = await this.prisma.dailyClosing.findFirst({
      where: {
        storeId,
        closingDate: {
          gte: today,
        },
      },
    });

    return !!closing;
  }
}
