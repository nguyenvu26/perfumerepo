import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiPreferencesService } from './ai-preferences.service';
import { UpdateAiPreferencesDto } from './dto/update-ai-preferences.dto';

@Controller('ai-preferences')
@UseGuards(JwtAuthGuard)
export class AiPreferencesController {
  constructor(private readonly aiPreferencesService: AiPreferencesService) {}

  @Get()
  async getMyPreferences(@Req() req: any) {
    return this.aiPreferencesService.findByUser(req.user.userId);
  }

  @Patch()
  async updateMyPreferences(@Req() req: any, @Body() dto: UpdateAiPreferencesDto) {
    return this.aiPreferencesService.update(req.user.userId, dto);
  }

  @Patch('reset')
  async resetMyPreferences(@Req() req: any) {
    return this.aiPreferencesService.reset(req.user.userId);
  }
}
