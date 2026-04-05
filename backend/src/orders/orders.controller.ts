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

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.createFromCart(req.user.userId, dto);
  }

  @Get()
  async listMy(@Req() req: any) {
    return this.ordersService.listMyOrders(req.user.userId);
  }

  @Get('admin/all')
  async listAll(@Query('skip') skip?: number, @Query('take') take?: number) {
    return this.ordersService.listAllOrders(skip || 0, take || 10);
  }

  @Get(':id')
  async getMyById(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.getMyOrderById(req.user.userId, id);
  }

  @Get('admin/:id')
  async getById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Post('admin/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: { status?: any; paymentStatus?: any },
  ) {
    return this.ordersService.updateStatus(id, dto.status, dto.paymentStatus);
  }
}
