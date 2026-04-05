import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
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
  ) {
    return this.staffInventoryService.listAllRequests({
      status,
      storeId,
      staffId,
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
