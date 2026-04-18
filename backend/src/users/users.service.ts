import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { UserRoleEnum } from '@prisma/client';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  findMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        fullName: true,
        gender: true,
        dateOfBirth: true,
        address: true,
        city: true,
        country: true,
        avatarUrl: true,
        budgetMin: true,
        budgetMax: true,
        loyaltyPoints: true,
        createdAt: true,
        emailVerified: true,
      },
    });
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    if (dto.phone) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          phone: dto.phone,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new ConflictException('Số điện thoại này đã được sử dụng bởi tài khoản khác');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        avatarUrl: dto.avatarUrl,
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        fullName: true,
        gender: true,
        dateOfBirth: true,
        address: true,
        city: true,
        country: true,
        avatarUrl: true,
        budgetMin: true,
        budgetMax: true,
        loyaltyPoints: true,
        createdAt: true,
        emailVerified: true,
      },
    });
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const uploadResult = await this.cloudinaryService.uploadImage(
      file.buffer,
      'perfume-gpt/users/avatars',
    );

    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: uploadResult.url },
      select: {
        id: true,
        email: true,
        avatarUrl: true,
        fullName: true,
      },
    });
  }

  /** Admin: list users with optional role filter, include stores for staff */
  adminListUsers(role?: string) {
    const where: { role?: UserRoleEnum } = {};
    if (role && Object.values(UserRoleEnum).includes(role as UserRoleEnum)) {
      where.role = role as UserRoleEnum;
    }
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        stores: {
          select: { store: { select: { id: true, name: true, code: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  /** Admin: get user by id with stores */
  async adminGetUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        stores: {
          select: { store: { select: { id: true, name: true, code: true } } },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Admin: update user role and isActive */
  adminUpdateUser(userId: string, dto: AdminUpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        role: dto.role,
        isActive: dto.isActive,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }
}
