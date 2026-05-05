import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { StocktakeService } from './stocktake.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/inventory/stocktakes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class StocktakeController {
  constructor(private readonly stocktakeService: StocktakeService) {}

  @Get()
  list(
    @Query('warehouseId') warehouseId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.stocktakeService.list({
      warehouseId,
      skip: skip ? parseInt(skip) : 0,
      take: take ? parseInt(take) : 20,
    });
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.stocktakeService.getById(id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: { warehouseId: string; variantIds?: string[] }) {
    return this.stocktakeService.create({
      ...dto,
      userId: req.user.userId
    });
  }

  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: { countedQty: number; reason?: string },
  ) {
    return this.stocktakeService.updateItem(id, itemId, dto.countedQty, dto.reason);
  }

  @Patch(':id/complete')
  complete(@Req() req: any, @Param('id') id: string) {
    return this.stocktakeService.complete(id, req.user.userId);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.stocktakeService.cancel(id);
  }
}
