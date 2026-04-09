import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Req() req: any) {
    return this.cartService.getCart(req.user.userId);
  }

  @Post('items')
  async addItem(@Req() req: any, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(req.user.userId, dto);
  }

  @Patch('items/:id')
  async updateItem(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQuantity(
      req.user.userId,
      Number(id),
      dto,
    );
  }

  @Delete('items/:id')
  async removeItem(@Req() req: any, @Param('id') id: string) {
    return this.cartService.removeItem(req.user.userId, Number(id));
  }
}
