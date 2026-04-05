import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  async list(@Req() req: any) {
    return this.favoritesService.list(req.user.userId);
  }

  @Get(':productId/status')
  async status(@Req() req: any, @Param('productId') productId: string) {
    return this.favoritesService.isFavorite(req.user.userId, productId);
  }

  @Post(':productId')
  async add(
    @Req() req: any,
    @Param('productId') productId: string,
    @Body() dto: { variantId?: string },
  ) {
    return this.favoritesService.add(req.user.userId, productId, dto?.variantId);
  }

  @Delete(':productId')
  async remove(@Req() req: any, @Param('productId') productId: string) {
    return this.favoritesService.remove(req.user.userId, productId);
  }
}
