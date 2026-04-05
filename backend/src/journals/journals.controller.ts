import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { JournalsService } from './journals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@Controller('journals')
export class JournalsController {
    constructor(private readonly journalsService: JournalsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'mainImage', maxCount: 1 },
        { name: 'sectionImages', maxCount: 20 },
    ]))
    create(
        @Body() createJournalDto: any,
        @UploadedFiles() files: { mainImage?: Express.Multer.File[], sectionImages?: Express.Multer.File[] }
    ) {
        return this.journalsService.create(createJournalDto, files);
    }

    @Get()
    findAll() {
        return this.journalsService.findAll();
    }

    @Get('latest')
    findLatest() {
        return this.journalsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.journalsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'mainImage', maxCount: 1 },
        { name: 'sectionImages', maxCount: 20 },
    ]))
    update(
        @Param('id') id: string,
        @Body() updateData: any,
        @UploadedFiles() files: { mainImage?: Express.Multer.File[], sectionImages?: Express.Multer.File[] }
    ) {
        return this.journalsService.update(id, updateData, files);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    remove(@Param('id') id: string) {
        return this.journalsService.remove(id);
    }
}
