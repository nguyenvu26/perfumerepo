import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) { }

  @Post()
  create(@Request() req, @Body() createAddressDto: CreateAddressDto) {
    const userId = req.user?.userId ?? req.user?.sub ?? req.user?.id;
    return this.addressesService.create(userId, createAddressDto);
  }

  @Get()
  findAll(@Request() req) {
    const userId = req.user?.userId ?? req.user?.sub ?? req.user?.id;
    return this.addressesService.findAll(userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    const userId = req.user?.userId ?? req.user?.sub ?? req.user?.id;
    return this.addressesService.findOne(userId, id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    const userId = req.user?.userId ?? req.user?.sub ?? req.user?.id;
    return this.addressesService.update(userId, id, updateAddressDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    const userId = req.user?.userId ?? req.user?.sub ?? req.user?.id;
    return this.addressesService.remove(userId, id);
  }

  @Patch(':id/default')
  setDefault(@Request() req, @Param('id') id: string) {
    const userId = req.user?.userId ?? req.user?.sub ?? req.user?.id;
    return this.addressesService.setDefault(userId, id);
  }
}
