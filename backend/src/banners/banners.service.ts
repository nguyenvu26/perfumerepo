import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class BannersService {
    constructor(
        private prisma: PrismaService,
        private cloudinaryService: CloudinaryService
    ) { }

    async create(data: any, file: Express.Multer.File) {
        let imageUrl = data.imageUrl || '';
        if (file) {
            const uploadResults = await this.cloudinaryService.uploadImages(
                [file.buffer],
                `perfume-gpt/banners`
            );
            imageUrl = uploadResults[0].url;
        }

        return this.prisma.banner.create({
            data: {
                title: data.title,
                subtitle: data.subtitle,
                linkUrl: data.linkUrl,
                imageUrl,
            },
        });
    }

    async findAll() {
        return this.prisma.banner.findMany({
            orderBy: { createdAt: 'asc' },
        });
    }

    async findOne(id: string) {
        const banner = await this.prisma.banner.findUnique({
            where: { id },
        });
        if (!banner) throw new NotFoundException('Banner not found');
        return banner;
    }

    async update(id: string, data: any, file?: Express.Multer.File) {
        const banner = await this.findOne(id);
        
        let imageUrl = banner.imageUrl;
        if (file) {
            const uploadResults = await this.cloudinaryService.uploadImages(
                [file.buffer],
                `perfume-gpt/banners`
            );
            imageUrl = uploadResults[0].url;
        }

        const updateData: any = {
            title: data.title !== undefined ? data.title : banner.title,
            subtitle: data.subtitle !== undefined ? data.subtitle : banner.subtitle,
            linkUrl: data.linkUrl !== undefined ? data.linkUrl : banner.linkUrl,
            imageUrl
        };

        return this.prisma.banner.update({
            where: { id },
            data: updateData,
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.banner.delete({
            where: { id },
        });
    }
}
