import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('status')
  async getStatus(@Request() req) {
    return this.loyaltyService.getLoyaltyInfo(req.user.userId);
  }

  @Post('validate-points')
  async validatePoints(@Request() req, @Body('points') points: number) {
    return this.loyaltyService.validateRedemption(req.user.userId, points);
  }
}
