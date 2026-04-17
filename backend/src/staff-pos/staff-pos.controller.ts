import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { StoresService } from '../stores/stores.service';
import { StaffPosService } from './staff-pos.service';

@Controller('staff/pos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STAFF', 'ADMIN')
export class StaffPosController {
  constructor(
    private readonly staffPosService: StaffPosService,
    private readonly storesService: StoresService,
  ) { }

  @Get('products')
  async searchProducts(
    @Req() req: any,
    @Query('q') q?: string,
    @Query('barcode') barcode?: string,
    @Query('storeId') storeId?: string,
  ) {
    const user = req.user as { userId: string; role: string };
    if (storeId) {
      await this.storesService.ensureStaffCanAccessStore(
        user.userId,
        storeId,
        user.role,
      );
    }
    const b = barcode?.trim();
    if (b) {
      return this.staffPosService.searchProductsByBarcode(b, storeId);
    }
    return this.staffPosService.searchProducts(q ?? '', storeId);
  }

  @Get('loyalty')
  lookupLoyalty(@Query('phone') phone: string) {
    return this.staffPosService.lookupLoyaltyByPhone(phone);
  }

  @Get('search-customers')
  searchCustomers(@Query('phone') phone: string) {
    return this.staffPosService.searchCustomersByPhone(phone);
  }

  @Post('orders')
  createDraftOrder(
    @Req() req: any,
    @Body() body: { storeId?: string; customerPhone?: string },
  ) {
    const user = req.user as { userId: string; role: string };
    return this.staffPosService.createDraftOrder(
      user.userId,
      body?.storeId ?? null,
      user.role,
      body?.customerPhone,
    );
  }

  @Patch('orders/:id/customer')
  setCustomer(
    @Req() req: any,
    @Param('id') orderId: string,
    @Body() body: { customerPhone: string },
  ) {
    const user = req.user as { userId: string };
    return this.staffPosService.setCustomer(
      user.userId,
      orderId,
      body.customerPhone,
    );
  }

  @Patch('orders/:id/items')
  upsertItem(
    @Req() req: any,
    @Param('id') orderId: string,
    @Body()
    body: {
      variantId: string;
      quantity: number;
    },
  ) {
    const user = req.user as { userId: string };
    return this.staffPosService.upsertItem(
      user.userId,
      orderId,
      body.variantId,
      body.quantity,
    );
  }


  @Get('orders/:id')
  getOrder(@Req() req: any, @Param('id') orderId: string) {
    const user = req.user as { userId: string };
    return this.staffPosService.getOrder(user.userId, orderId);
  }

  @Post('orders/:id/pay/cash')
  payCash(@Req() req: any, @Param('id') orderId: string) {
    const user = req.user as { userId: string };
    return this.staffPosService.payCash(user.userId, orderId);
  }

  @Post('orders/:id/pay/qr')
  payQr(@Req() req: any, @Param('id') orderId: string) {
    const user = req.user as { userId: string };
    return this.staffPosService.createQrPayment(user.userId, orderId);
  }

  @Post('checkout')
  checkout(
    @Req() req: any,
    @Body()
    body: {
      storeId: string;
      items: { variantId: string; quantity: number }[];
      paymentMethod: 'CASH' | 'QR';
      customerPhone?: string;
    },
  ) {
    const user = req.user as { userId: string; role: string };
    return this.staffPosService.checkout(
      user.userId,
      user.role,
      body.storeId,
      body.items,
      body.paymentMethod,
      body.customerPhone,
    );
  }

  @Post('save-draft')
  saveDraft(
    @Req() req: any,
    @Body()
    body: {
      storeId: string;
      items: { variantId: string; quantity: number }[];
      customerPhone?: string;
    },
  ) {
    const user = req.user as { userId: string; role: string };
    return this.staffPosService.saveAsDraft(
      user.userId,
      user.role,
      body.storeId,
      body.items,
      body.customerPhone,
    );
  }

  @Delete('orders/:id')
  cancelOrder(@Req() req: any, @Param('id') orderId: string) {
    const user = req.user as { userId: string };
    return this.staffPosService.cancelOrder(user.userId, orderId);
  }
}
