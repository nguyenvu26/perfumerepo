import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateScentFamilyDto } from './dto/create-scent-family.dto';
import { UpdateScentFamilyDto } from './dto/update-scent-family.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // Brand
  listBrands() {
    return this.prisma.brand.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async getBrand(id: number) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  createBrand(dto: CreateBrandDto) {
    return this.prisma.brand.create({ data: dto });
  }

  updateBrand(id: number, dto: UpdateBrandDto) {
    return this.prisma.brand.update({
      where: { id },
      data: dto,
    });
  }

  async deleteBrand(id: number) {
    // Check if brand has products (brandId is required, cannot be null)
    const productCount = await this.prisma.product.count({
      where: { brandId: id },
    });
    if (productCount > 0) {
      throw new ConflictException(
        `Cannot delete brand: it has ${productCount} product(s). Please remove or reassign products first.`,
      );
    }
    await this.prisma.brand.delete({ where: { id } });
    return { success: true };
  }

  // Category
  listCategories() {
    return this.prisma.category.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async getCategory(id: number) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  createCategory(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto });
  }

  updateCategory(id: number, dto: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCategory(id: number) {
    // Category is optional, so we can delete it
    // Products with this categoryId will have categoryId set to null automatically
    // But we should update products to remove the reference first for clarity
    await this.prisma.$transaction(async (tx) => {
      await tx.product.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      });
      await tx.category.delete({ where: { id } });
    });
    return { success: true };
  }

  // Scent Family
  listScentFamilies() {
    return this.prisma.scentFamily.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async getScentFamily(id: number) {
    const scentFamily = await this.prisma.scentFamily.findUnique({
      where: { id },
    });
    if (!scentFamily) throw new NotFoundException('Scent family not found');
    return scentFamily;
  }

  createScentFamily(dto: CreateScentFamilyDto) {
    return this.prisma.scentFamily.create({ data: dto });
  }

  updateScentFamily(id: number, dto: UpdateScentFamilyDto) {
    return this.prisma.scentFamily.update({
      where: { id },
      data: dto,
    });
  }

  async deleteScentFamily(id: number) {
    // ScentFamily is optional, so we can delete it
    // Products with this scentFamilyId will have scentFamilyId set to null automatically
    await this.prisma.$transaction(async (tx) => {
      await tx.product.updateMany({
        where: { scentFamilyId: id },
        data: { scentFamilyId: null },
      });
      await tx.scentFamily.delete({ where: { id } });
    });
    return { success: true };
  }

  // Scent Note
  async listScentNotes() {
    const notes = await this.prisma.scentNote.findMany({
      select: { name: true },
      distinct: ['name'],
      orderBy: { name: 'asc' },
    });
    return notes.map((n) => n.name);
  }
}
