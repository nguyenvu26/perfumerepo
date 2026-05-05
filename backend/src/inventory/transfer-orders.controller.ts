import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TransferOrdersService } from './transfer-orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TransferStatus } from '@prisma/client';

@Controller('admin/inventory/transfers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
export class TransferOrdersController {
  constructor(private readonly transferService: TransferOrdersService) {}

  @Get()
  list(
    @Req() req: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: TransferStatus,
    @Query('fromStoreId') fromStoreId?: string,
    @Query('toStoreId') toStoreId?: string,
  ) {
    const user = req.user as { userId: string; role: string };
    
    // If staff, strictly filter by their assigned stores if they didn't provide specific storeIds,
    // or validate they can access the provided storeIds.
    return this.transferService.list({
      skip: skip ? parseInt(skip) : 0,
      take: take ? parseInt(take) : 20,
      status,
      fromStoreId,
      toStoreId,
      userId: user.userId,
      userRole: user.role,
    });
  }

  @Post()
  create(@Req() req: any, @Body() dto: any) {
    return this.transferService.create({
      ...dto,
      userId: req.user.userId
    });
  }

  @Patch(':id/ship')
  ship(@Req() req: any, @Param('id') id: string) {
    const user = req.user as { userId: string; role: string };
    return this.transferService.ship(id, user.userId, user.role);
  }

  @Patch(':id/receive')
  receive(@Req() req: any, @Param('id') id: string, @Body() dto: { items: { variantId: string; actualQuantity: number; note?: string }[] }) {
    const user = req.user as { userId: string; role: string };
    return this.transferService.receive(id, dto, user.userId, user.role);
  }

  @Patch(':id/cancel')
  cancel(@Req() req: any, @Param('id') id: string) {
    const user = req.user as { userId: string; role: string };
    return this.transferService.cancel(id, user.userId, user.role);
  }
}
