import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto, ValidatePromotionDto } from './dto/promotion.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  async validate(@Body() dto: ValidatePromotionDto, @Request() req) {
    return this.promotionsService.validate(dto, req.user.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(@Body() dto: CreatePromotionDto) {
    return this.promotionsService.create(dto);
  }

  @Get('active')
  @UseGuards(JwtAuthGuard)
  async findActive(@Request() req) {
    return this.promotionsService.findActive(req.user.userId);
  }

  @Get('public')
  async findPublic() {
    return this.promotionsService.findPublic();
  }

  @Get('redeemable')
  @UseGuards(JwtAuthGuard)
  async findRedeemable(@Request() req) {
    return this.promotionsService.findRedeemable(req.user.userId);
  }

  @Get('my-promotions')
  @UseGuards(JwtAuthGuard)
  async getMyPromotions(@Request() req) {
    return this.promotionsService.getMyPromotions(req.user.userId);
  }

  @Post('claim/:id')
  @UseGuards(JwtAuthGuard)
  async claim(@Param('id') id: string, @Request() req) {
    return this.promotionsService.claim(req.user.userId, id);
  }

  @Post('redeem/:id')
  @UseGuards(JwtAuthGuard)
  async redeem(@Param('id') id: string, @Request() req) {
    return this.promotionsService.redeem(req.user.userId, id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async findAll() {
    return this.promotionsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }
}
