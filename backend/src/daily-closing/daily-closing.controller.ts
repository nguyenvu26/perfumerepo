import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { DailyClosingService } from './daily-closing.service';
import { CreateDailyClosingDto } from './dto/create-daily-closing.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('daily-closing')
@UseGuards(JwtAuthGuard)
export class DailyClosingController {
  constructor(private readonly dailyClosingService: DailyClosingService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateDailyClosingDto) {
    const userId = req.user?.userId ?? req.user?.sub;
    return this.dailyClosingService.create(userId, dto);
  }

  @Get()
  findAll(@Query('storeId') storeId?: string) {
    return this.dailyClosingService.findAll(storeId);
  }

  @Get('check-today')
  checkToday(@Query('storeId') storeId: string) {
    return this.dailyClosingService.checkTodayClosing(storeId);
  }

  @Get(':id/details')
  getDetails(@Param('id') id: string) {
    return this.dailyClosingService.getClosingDetails(id);
  }
}
