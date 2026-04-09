import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { BannersService } from './banners.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('banners')
export class BannersController {
    constructor(private readonly bannersService: BannersService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @UseInterceptors(FileInterceptor('image'))
    create(@Body() createBannerDto: any, @UploadedFile() file: Express.Multer.File) {
        return this.bannersService.create(createBannerDto, file);
    }

    @Get()
    findAll() {
        return this.bannersService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.bannersService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @UseInterceptors(FileInterceptor('image'))
    update(@Param('id') id: string, @Body() updateBannerDto: any, @UploadedFile() file?: Express.Multer.File) {
        return this.bannersService.update(id, updateBannerDto, file);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    remove(@Param('id') id: string) {
        return this.bannersService.remove(id);
    }
}
