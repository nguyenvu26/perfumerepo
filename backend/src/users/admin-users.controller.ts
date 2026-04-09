import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UsersService } from './users.service';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { UserRoleEnum } from '@prisma/client';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async list(@Query('role') role?: string) {
    return this.usersService.adminListUsers(role);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.usersService.adminGetUserById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.usersService.adminUpdateUser(id, dto);
  }
}
