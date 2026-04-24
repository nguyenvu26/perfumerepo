import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile, UseInterceptors } from '@nestjs/common';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.createFromCart(req.user.userId, dto);
  }

  @Get()
  async listMy(
    @Req() req: any,
    @Query('skip') skip?: string | number,
    @Query('take') take?: string | number,
  ) {
    const parsedSkip = Number(skip ?? 0);
    const parsedTake = Number(take ?? 10);
    return this.ordersService.listMyOrders(
      req.user.userId,
      Number.isFinite(parsedSkip) ? parsedSkip : 0,
      Number.isFinite(parsedTake) ? parsedTake : 10,
    );
  }

  @Get('admin/all')
  async listAll(
    @Query('skip') skip?: string | number,
    @Query('take') take?: string | number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const parsedSkip = Number(skip ?? 0);
    const parsedTake = Number(take ?? 10);
    return this.ordersService.listAllOrders(
      Number.isFinite(parsedSkip) ? parsedSkip : 0,
      Number.isFinite(parsedTake) ? parsedTake : 10,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  async getMyById(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.getMyOrderById(req.user.userId, id);
  }

  @Post(':id/refund-bank-info')
  async submitRefundBankInfo(
    @Req() req: any,
    @Param('id') id: string,
    @Body()
    body: {
      bankName: string;
      accountNumber: string;
      accountHolder: string;
      note?: string;
    },
  ) {
    return this.ordersService.submitRefundBankInfo(req.user.userId, id, body);
  }

  @Get(':id/refund-bank-info')
  async getMyRefundBankInfo(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.getRefundBankInfo(id, req.user.userId);
  }

  @Get('admin/:id')
  async getById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Get('admin/:id/refund-bank-info')
  async getRefundBankInfoAdmin(@Param('id') id: string) {
    return this.ordersService.getRefundBankInfo(id);
  }

  @Post('admin/:id/refund-evidence')
  @UseInterceptors(FileInterceptor('file'))
  async submitRefundEvidence(
    @Req() req: any,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.ordersService.submitRefundEvidence(req.user.userId, id, file);
  }

  @Post('admin/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: { status?: any; paymentStatus?: any },
  ) {
    return this.ordersService.updateStatus(id, dto.status, dto.paymentStatus);
  }

  @Post(':id/cancel')
  async cancel(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.cancelMyOrder(req.user.userId, id);
  }
}
