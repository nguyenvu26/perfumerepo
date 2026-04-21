import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { UserRoleEnum } from '@prisma/client';

@Controller('ai-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleEnum.ADMIN)
export class AiLogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getLogs(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    const skip = (page - 1) * limit;
    const where = {
      ...(type && { type }),
      ...(status && { status }),
    };

    const [logs, total] = await Promise.all([
      this.prisma.aiRequestLog.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true, email: true } } },
      }),
      this.prisma.aiRequestLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  @Get('stats')
  async getStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await this.prisma.aiRequestLog.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: {
        status: true,
        duration: true,
        type: true,
        createdAt: true,
      },
    });

    const total = logs.length;
    const success = logs.filter((l) => l.status === 'SUCCESS').length;
    const failed = total - success;
    const avgDuration =
      logs.filter((l) => l.duration).reduce((acc, l) => acc + (l.duration || 0), 0) /
        logs.filter((l) => l.duration).length || 0;

    // Group by day for chart
    const dailyStats = new Map<string, { total: number; success: number }>();
    logs.forEach((l) => {
      const date = l.createdAt.toISOString().split('T')[0];
      const current = dailyStats.get(date) || { total: 0, success: 0 };
      current.total++;
      if (l.status === 'SUCCESS') current.success++;
      dailyStats.set(date, current);
    });

    const chartData = Array.from(dailyStats.entries())
      .map(([date, stats]) => ({
        date,
        total: stats.total,
        success: stats.success,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Usage by type
    const typeBreakdown = logs.reduce((acc, l) => {
      acc[l.type] = (acc[l.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      successRate: total > 0 ? (success / total) * 100 : 0,
      avgDuration: Math.round(avgDuration),
      chartData,
      typeBreakdown,
    };
  }

  @Get(':id')
  async getLogDetail(@Param('id') id: string) {
    return this.prisma.aiRequestLog.findUnique({
      where: { id },
      include: { user: { select: { fullName: true, email: true, role: true } } },
    });
  }
}
