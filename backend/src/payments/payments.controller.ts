import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('create-payment')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createPayment(@Req() req: any, @Body() body: { orderId: string }) {
    const order = await this.ordersService.getMyOrderById(
      req.user.userId,
      body.orderId,
    );

    // Generate order code (unique number) from order code string
    const orderCode = parseInt(order.code.replace(/\D/g, '')) || Date.now();

    return this.paymentsService.createPayOSPaymentLink(
      (order as any).id,
      orderCode,
      (order as any).finalAmount,
      (order as any).items,
    );
  }

  @Post('payos/webhook')
  @HttpCode(HttpStatus.OK)
  async handlePayOSWebhook(@Body() body: any) {
    try {
      const result = await this.paymentsService.handlePayOSWebhook(body);
      // Return success response as per PayOS documentation
      return {
        code: '00',
        desc: 'Webhook processed successfully',
      };
    } catch (error: any) {
      console.error('Webhook processing failed:', error.message);
      // Return error response as per PayOS documentation
      return {
        code: '99',
        desc: error.message || 'Unknown error',
      };
    }
  }

  @Get('payos/return')
  async handlePayOSReturn(
    @Query('orderId') orderId: string,
    @Query('orderCode') orderCode: string,
    @Query('status') status: string,
  ) {
    try {
      if (!orderId) {
        return {
          success: false,
          message: 'Missing orderId',
        };
      }

      // Get payment status
      const payment = await this.paymentsService.getPaymentByOrderId(orderId);

      return {
        success: true,
        orderId,
        orderCode,
        paymentStatus: payment?.status || 'UNKNOWN',
        message: 'Payment return received',
      };
    } catch (error: any) {
      console.error('PayOS return handling error:', error);
      return {
        success: false,
        message: error.message || 'Error processing return',
      };
    }
  }

  @Get('payos/cancel')
  async handlePayOSCancel(
    @Query('orderId') orderId: string,
    @Query('orderCode') orderCode: string,
    @Query('status') status: string,
  ) {
    try {
      return {
        success: true,
        orderId,
        orderCode,
        message: 'Payment cancelled by user',
      };
    } catch (error: any) {
      console.error('PayOS cancel handling error:', error);
      return {
        success: false,
        message: error.message || 'Error processing cancellation',
      };
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getPayment(@Req() req: any, @Param('id') id: string) {
    const payment = await this.paymentsService.getPaymentById(id);

    // Verify user owns the order
    if (payment.order.userId !== req.user.userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return payment;
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  async getPaymentByOrder(@Req() req: any, @Param('orderId') orderId: string) {
    const order = await this.ordersService.getMyOrderById(
      req.user.userId,
      orderId,
    );
    return this.paymentsService.getPaymentByOrderId(order.id);
  }

  @Get('verify-sync/:orderId')
  @UseGuards(JwtAuthGuard)
  async verifyAndSyncStatus(@Req() req: any, @Param('orderId') orderId: string) {
    const order = await this.ordersService.getMyOrderById(
      req.user.userId,
      orderId,
    );
    return this.paymentsService.verifyAndSyncPaymentStatus(order.id);
  }
}
