import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { StaffOrdersService } from './staff-orders.service';

@Controller('staff/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STAFF', 'ADMIN')
export class StaffOrdersController {
  constructor(private readonly staffOrdersService: StaffOrdersService) {}

  @Get()
  list(
    @Req() req: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    const user = req.user as { userId: string; role: string };
    const s = Number.isFinite(Number(skip)) ? Number(skip) : 0;
    const t = Number.isFinite(Number(take)) ? Number(take) : 20;

    return this.staffOrdersService.listStaffPosOrders(
      user.userId,
      (user.role as 'STAFF' | 'ADMIN') || 'STAFF',
      s,
      t,
      search,
      startDate,
      endDate,
      status,
    );
  }

  @Get('by-code/:code')
  getByCode(@Req() req: any, @Param('code') code: string) {
    const user = req.user as { userId: string; role: string };
    return this.staffOrdersService.getOrderByCode(
      code,
      user.userId,
      (user.role as 'STAFF' | 'ADMIN') || 'STAFF',
    );
  }

  @Get(':id')
  getDetail(@Req() req: any, @Param('id') orderId: string) {
    const user = req.user as { userId: string; role: string };
    return this.staffOrdersService.getOrderDetail(
      orderId,
      user.userId,
      (user.role as 'STAFF' | 'ADMIN') || 'STAFF',
    );
  }
}
