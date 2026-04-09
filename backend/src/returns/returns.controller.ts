import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReturnsService } from './returns.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { CreateReturnShipmentDto } from './dto/create-shipment.dto';

@Controller('returns')
@UseGuards(JwtAuthGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  /** Customer: tạo yêu cầu trả hàng */
  @Post()
  async create(@Req() req: any, @Body() dto: CreateReturnDto) {
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    return this.returnsService.createReturn(
      req.user.userId,
      dto,
      undefined,
      idempotencyKey,
    );
  }

  /** Customer: danh sách yêu cầu trả hàng của mình */
  @Get()
  async listMy(@Req() req: any) {
    return this.returnsService.listMyReturns(req.user.userId);
  }

  /** Customer: chi tiết yêu cầu trả hàng */
  @Get(':id')
  async getById(@Req() req: any, @Param('id') id: string) {
    return this.returnsService.getMyReturnById(req.user.userId, id);
  }

  /** Customer: gắn tracking khi gửi hàng trả */
  @Post(':id/shipment')
  async addShipment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateReturnShipmentDto,
  ) {
    return this.returnsService.addShipment(req.user.userId, id, dto);
  }

  /** Customer: hủy yêu cầu trả hàng */
  @Patch(':id/cancel')
  async cancel(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.returnsService.cancelReturn(
      req.user.userId,
      id,
      body?.reason,
    );
  }
}
