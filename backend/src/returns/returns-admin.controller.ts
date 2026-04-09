import {
  Body,
  Controller,
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
import { ReturnsService } from './returns.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { ReviewReturnDto, RequestMoreInfoDto } from './dto/review-return.dto';
import { ReceiveReturnDto } from './dto/receive-return.dto';
import { TriggerRefundDto } from './dto/trigger-refund.dto';

@Controller('returns/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
export class ReturnsAdminController {
  constructor(private readonly returnsService: ReturnsService) {}

  /** Admin/Staff: danh sách tất cả yêu cầu trả hàng */
  @Get('all')
  async listAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('status') status?: string,
    @Query('orderId') orderId?: string,
  ) {
    return this.returnsService.listAllReturns(
      Number(skip) || 0,
      Number(take) || 20,
      status,
      orderId,
    );
  }

  /** Admin/Staff: chi tiết yêu cầu trả hàng */
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.returnsService.getReturnById(id);
  }

  /** Admin/Staff: xem audit logs */
  @Get(':id/audits')
  async getAudits(@Param('id') id: string) {
    return this.returnsService.listAudits(id);
  }

  /** Admin/Staff: xem refund history */
  @Get(':id/refunds')
  async getRefunds(@Param('id') id: string) {
    return this.returnsService.listRefunds(id);
  }

  /** Admin: review (approve / reject) */
  @Patch(':id/review')
  async review(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ReviewReturnDto,
  ) {
    return this.returnsService.reviewReturn(req.user.userId, id, dto);
  }

  /** Admin: yêu cầu thêm bằng chứng */
  @Patch(':id/request-info')
  async requestInfo(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: RequestMoreInfoDto,
  ) {
    return this.returnsService.requestMoreInfo(req.user.userId, id, dto);
  }

  /** Admin/Staff: xác nhận nhận hàng trả */
  @Patch(':id/receive')
  async receive(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ReceiveReturnDto,
  ) {
    return this.returnsService.receiveReturn(req.user.userId, id, dto);
  }

  /** Admin/Staff: trigger hoàn tiền */
  @Post(':id/refund')
  async refund(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: TriggerRefundDto,
  ) {
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    return this.returnsService.triggerRefund(
      req.user.userId,
      id,
      dto,
      idempotencyKey,
      req.user.role,
    );
  }

  /** Admin: hủy yêu cầu trả hàng */
  @Patch(':id/cancel')
  async cancel(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.returnsService.adminCancelReturn(
      req.user.userId,
      id,
      body?.reason,
    );
  }

  /** Staff (POS): tạo return cho khách tại quầy */
  @Post('pos/create')
  async posCreate(@Req() req: any, @Body() dto: CreateReturnDto) {
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    return this.returnsService.createReturn(
      req.user.userId,
      { ...dto, origin: 'POS' },
      req.user.userId, // staffId
      idempotencyKey,
    );
  }
}
