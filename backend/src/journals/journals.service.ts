import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class JournalsService {
    constructor(
        private prisma: PrismaService,
        private cloudinaryService: CloudinaryService
    ) { }

    async create(data: any, files: { mainImage?: Express.Multer.File[], sectionImages?: Express.Multer.File[] }) {
        let mainImageUrl = data.mainImage || '';
        if (files?.mainImage?.[0]) {
            const uploadResults = await this.cloudinaryService.uploadImages(
                [files.mainImage[0].buffer],
                `perfume-gpt/journals`
            );
            mainImageUrl = uploadResults[0].url;
        }

        const sectionsData = JSON.parse(data.sectionsData || "[]");
        let sectionUploads: any[] = [];
        if (files?.sectionImages?.length) {
            sectionUploads = await this.cloudinaryService.uploadImages(
                files.sectionImages.map(f => f.buffer),
                `perfume-gpt/journals/sections`
            );
        }

        let uploadIndex = 0;
        const createSections = sectionsData.map((sec: any, idx: number) => {
            let url = sec.existingImageUrl || null;
            if (sec.hasNewImage && uploadIndex < sectionUploads.length) {
                url = sectionUploads[uploadIndex++].url;
            }
            return {
                subtitle: sec.subtitle || null,
                content: sec.content || '',
                imageUrl: url,
                productId: sec.productId || null,
                order: idx
            };
        });

        return this.prisma.journal.create({
            data: {
                title: data.title,
                excerpt: data.excerpt,
                mainImage: mainImageUrl,
                category: data.category || 'all',
                priority: data.priority ? parseInt(data.priority) : 0,
                sections: {
                    create: createSections
                }
            },
            include: {
                sections: {
                    orderBy: { order: 'asc' }
                }
            }
        });
    }

    async findAll() {
        return this.prisma.journal.findMany({
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' },
            ],
            include: {
                sections: { 
                    orderBy: { order: 'asc' },
                    include: { product: true }
                }
            }
        });
    }

    async findOne(id: string) {
        const journal = await this.prisma.journal.findUnique({
            where: { id },
            include: {
                sections: { 
                    orderBy: { order: 'asc' },
                    include: { product: true }
                }
            }
        });
        if (!journal) throw new NotFoundException('Journal not found');
        return journal;
    }

    async update(id: string, data: any, files?: { mainImage?: Express.Multer.File[], sectionImages?: Express.Multer.File[] }) {
        await this.findOne(id);

        let mainImageUrl: string | undefined = undefined;
        if (files?.mainImage?.[0]) {
            const uploadResults = await this.cloudinaryService.uploadImages(
                [files.mainImage[0].buffer],
                `perfume-gpt/journals`
            );
            mainImageUrl = uploadResults[0].url;
        }

        // Logic for sections parsing and uploading
        let createSections = undefined;
        if (data.sectionsData) {
            const sectionsData = JSON.parse(data.sectionsData);
            let sectionUploads: any[] = [];
            if (files?.sectionImages?.length) {
                sectionUploads = await this.cloudinaryService.uploadImages(
                    files.sectionImages.map(f => f.buffer),
                    `perfume-gpt/journals/sections`
                );
            }

            let uploadIndex = 0;
            createSections = sectionsData.map((sec: any, idx: number) => {
                let url = sec.existingImageUrl || null;
                if (sec.hasNewImage && uploadIndex < sectionUploads.length) {
                    url = sectionUploads[uploadIndex++].url;
                }
                return {
                    subtitle: sec.subtitle || null,
                    content: sec.content || '',
                    imageUrl: url,
                    productId: sec.productId || null,
                    order: idx
                };
            });
        }

        return this.prisma.journal.update({
            where: { id },
            data: {
                title: data.title !== undefined ? data.title : undefined,
                excerpt: data.excerpt !== undefined ? data.excerpt : undefined,
                category: data.category !== undefined ? data.category : undefined,
                mainImage: mainImageUrl, // only updates if not undefined
                priority: data.priority !== undefined ? parseInt(data.priority) : undefined,
                isActive: data.isActive !== undefined ? data.isActive === 'true' || data.isActive === true : undefined,
                ...(createSections ? {
                    sections: {
                        deleteMany: {},
                        create: createSections
                    }
                } : {})
            },
            include: { 
                sections: { 
                    orderBy: { order: 'asc' },
                    include: { product: true }
                } 
            }
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.journal.delete({
            where: { id },
        });
    }
}
