import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ReturnsService } from './returns.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { CreateReturnShipmentDto } from './dto/create-shipment.dto';

@Controller('returns')
@UseGuards(JwtAuthGuard)
export class ReturnsController {
  constructor(
    private readonly returnsService: ReturnsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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

  /** Customer: xác nhận đã bàn giao hàng cho shipper */
  @Patch(':id/handover')
  async handover(@Req() req: any, @Param('id') id: string) {
    return this.returnsService.handoverReturn(req.user.userId, id);
  }

  /** Customer: upload video minh chứng (resource_type: video) */
  @Post('upload-video')
  @UseInterceptors(FileInterceptor('video'))
  async uploadVideo(
    @Req() _req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return { url: null };
    }
    const result = await this.cloudinaryService.uploadVideo(
      file.buffer,
      'perfume-gpt/returns/videos',
    );
    return { url: result.url };
  }

  /** Customer: upload hình ảnh minh chứng (lên đến 5 ảnh) */
  @Post('upload-images')
  @UseInterceptors(FilesInterceptor('images', 5))
  async uploadImages(
    @Req() _req: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      return { urls: [] };
    }
    const uploadPromises = files.map((file) =>
      this.cloudinaryService.uploadImage(
        file.buffer,
        'perfume-gpt/returns/images',
      ),
    );
    const results = await Promise.all(uploadPromises);
    return { urls: results.map((r) => r.url) };
  }
}
