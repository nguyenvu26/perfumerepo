import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAddressDto) {
    const addressCount = await this.prisma.userAddress.count({
      where: { userId },
    });

    // If it's the first address, or if explicitly requested to be default
    const shouldBeDefault = addressCount === 0 || dto.isDefault;

    return await this.prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.userAddress.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.userAddress.create({
        data: {
          ...dto,
          userId,
          isDefault: shouldBeDefault,
        },
      });
    });
  }

  async findAll(userId: string) {
    return this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(userId: string, id: string) {
    const address = await this.prisma.userAddress.findFirst({
      where: { id, userId },
    });
    if (!address) throw new NotFoundException('Địa chỉ không tồn tại');
    return address;
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    const address = await this.findOne(userId, id);

    return await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault && !address.isDefault) {
        await tx.userAddress.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.userAddress.update({
        where: { id },
        data: dto,
      });
    });
  }

  async remove(userId: string, id: string) {
    const address = await this.findOne(userId, id);

    await this.prisma.userAddress.delete({ where: { id } });

    // If deleted address was default, set another one as default
    if (address.isDefault) {
      const nextAddress = await this.prisma.userAddress.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (nextAddress) {
        await this.prisma.userAddress.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return { success: true };
  }

  async setDefault(userId: string, id: string) {
    await this.findOne(userId, id);

    return await this.prisma.$transaction(async (tx) => {
      await tx.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      return tx.userAddress.update({
        where: { id },
        data: { isDefault: true },
      });
    });
  }
}
