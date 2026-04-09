import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ShippingService } from './shipping.service';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shipping: ShippingService) {}

  @Post('orders/:orderId/create-ghn')
  @UseGuards(JwtAuthGuard)
  async createGhnShipment(@Param('orderId') orderId: string, @Req() req: any) {
    const userId = req.user?.userId ?? req.user?.sub;
    return this.shipping.createGhnShipmentForUser(userId, orderId);
  }

  @Post('ghn/webhook')
  async ghnWebhook(@Body() body: any) {
    await this.shipping.handleGhnWebhook(body);
    return { code: 200, message: 'Success' };
  }

  @Get('orders/:orderId')
  @UseGuards(JwtAuthGuard)
  async getByOrderId(@Param('orderId') orderId: string, @Req() req: any) {
    const userId = req.user?.userId ?? req.user?.sub;
    return this.shipping.getShipmentsForUserOrder(userId, orderId);
  }

  // ── Admin endpoints ──────────────────────────────────────

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  async listAll(@Query('skip') skip?: number, @Query('take') take?: number) {
    return this.shipping.listAllShipments(skip || 0, take || 10);
  }

  @Post('admin/:orderId/create-ghn')
  @UseGuards(JwtAuthGuard)
  async adminCreateGhn(@Param('orderId') orderId: string) {
    return this.shipping.createGhnShipmentAdmin(orderId);
  }

  @Post('admin/:orderId/cancel')
  @UseGuards(JwtAuthGuard)
  async adminCancel(@Param('orderId') orderId: string) {
    return this.shipping.cancelGhnShipment(orderId);
  }

  @Post('admin/:shipmentId/sync')
  @UseGuards(JwtAuthGuard)
  async adminSync(@Param('shipmentId') shipmentId: string) {
    return this.shipping.syncShipmentStatus(shipmentId);
  }

  @Get('admin/:orderId/detail')
  @UseGuards(JwtAuthGuard)
  async adminDetail(@Param('orderId') orderId: string) {
    return this.shipping.getShipmentDetailAdmin(orderId);
  }
}

