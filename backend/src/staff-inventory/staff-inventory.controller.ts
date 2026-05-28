import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { StaffInventoryService } from './staff-inventory.service';

@Controller('staff/inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STAFF', 'ADMIN')
export class StaffInventoryController {
  constructor(private readonly staffInventoryService: StaffInventoryService) {}

  @Get()
  listOverview(@Req() req: any, @Query('storeId') storeId?: string) {
    const user = req.user as { userId: string; role: string };
    if (!storeId) {
      throw new BadRequestException('storeId is required');
    }
    return this.staffInventoryService.listOverview(
      storeId,
      user.userId,
      user.role,
    );
  }

  @Post('import')
  importStock(
    @Req() req: any,
    @Body()
    body: {
      storeId: string;
      variantId: string;
      quantity: number;
      reason?: string;
    },
  ) {
    const user = req.user as { userId: string; role: string };
    return this.staffInventoryService.importStock(
      body.storeId,
      user.userId,
      body.variantId,
      body.quantity,
      user.userId,
      user.role,
      body.reason,
    );
  }

  @Post('adjust')
  adjustStock(
    @Req() req: any,
    @Body()
    body: {
      storeId: string;
      variantId: string;
      delta: number;
      reason: string;
    },
  ) {
    const user = req.user as { userId: string; role: string };
    return this.staffInventoryService.adjustStock(
      body.storeId,
      user.userId,
      body.variantId,
      body.delta,
      user.userId,
      user.role,
      body.reason,
    );
  }

  /** Staff: list my own inventory requests */
  @Get('requests')
  listMyRequests(@Req() req: any, @Query('storeId') storeId?: string) {
    const user = req.user as { userId: string; role: string };
    return this.staffInventoryService.listMyRequests(
      user.userId,
      user.role,
      storeId,
    );
  }

  /** Search all system products/variants for import */
  @Get('search-products')
  searchAllProducts(@Query('q') q?: string) {
    return this.staffInventoryService.searchAllVariants(q);
  }

  @Get('logs')
  getLogs(
    @Req() req: any,
    @Query()
    query: {
      storeId?: string;
      variantId?: string;
      from?: string;
      to?: string;
    },
  ) {
    const user = req.user as { userId: string; role: string };
    return this.staffInventoryService.getLogs(query, user.userId, user.role);
  }

  // --- STAFF STOCKTAKE ENDPOINTS ---

  @Get('stocktakes')
  listStocktakes(
    @Req() req: any,
    @Query('storeId') storeId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const user = req.user as { userId: string; role: string };
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.staffInventoryService.listStocktakes(storeId, user.userId, user.role, skip ? parseInt(skip) : 0, take ? parseInt(take) : 20);
  }

  @Get('stocktakes/:id')
  getStocktakeById(
    @Req() req: any,
    @Param('id') id: string,
    @Query('storeId') storeId: string,
  ) {
    const user = req.user as { userId: string; role: string };
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.staffInventoryService.getStocktakeById(id, storeId, user.userId, user.role);
  }

  @Patch('stocktakes/:id/items/:itemId')
  updateStocktakeItem(
    @Req() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: { storeId: string; countedQty: number; reason?: string },
  ) {
    const user = req.user as { userId: string; role: string };
    if (!body.storeId) throw new BadRequestException('storeId is required in body');
    return this.staffInventoryService.updateStocktakeItem(id, body.storeId, itemId, body.countedQty, body.reason, user.userId, user.role);
  }

  @Patch('stocktakes/:id/complete')
  completeStocktake(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { storeId: string },
  ) {
    const user = req.user as { userId: string; role: string };
    if (!body.storeId) throw new BadRequestException('storeId is required in body');
    return this.staffInventoryService.completeStocktake(id, body.storeId, user.userId, user.role);
  }
}

/** Admin-only endpoints for reviewing inventory requests */
@Controller('admin/inventory/requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminInventoryRequestController {
  constructor(private readonly staffInventoryService: StaffInventoryService) {}

  @Get()
  listAll(
    @Query('status') status?: string,
    @Query('storeId') storeId?: string,
    @Query('staffId') staffId?: string,
    @Query('q') q?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.staffInventoryService.listAllRequests({
      status,
      storeId,
      staffId,
      q,
      skip: skip ? parseInt(skip) : 0,
      take: take ? parseInt(take) : 50,
    });
  }

  @Post(':id/approve')
  approve(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { note?: string },
  ) {
    const user = req.user as { userId: string };
    return this.staffInventoryService.approveRequest(
      id,
      user.userId,
      body.note,
    );
  }

  @Post(':id/reject')
  reject(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { note: string },
  ) {
    const user = req.user as { userId: string };
    if (!body.note?.trim()) {
      throw new BadRequestException('Rejection reason is required');
    }
    return this.staffInventoryService.rejectRequest(id, user.userId, body.note);
  }
}
