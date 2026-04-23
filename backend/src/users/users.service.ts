import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { UserRoleEnum } from '@prisma/client';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { LoyaltyService } from '../loyalty/loyalty.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly loyaltyService: LoyaltyService,
  ) { }

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
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
        profileCompletionBonusClaimed: true,
        _count: {
          select: { 
            addresses: true, 
            quizResults: true 
          },
        },
      },
    });

    if (!user) return null;

    // Proactively check for bonus if not claimed yet
    if (!user.profileCompletionBonusClaimed) {
      this.checkAndAwardProfileCompletionBonus(userId).catch(err => 
        console.error('Failed to award profile completion bonus in findMe:', err)
      );
    }

    return {
      ...user,
      hasAiProfile: user._count.quizResults > 0,
    };
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

    await this.prisma.user.update({
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
    });

    // Check for profile completion bonus
    await this.checkAndAwardProfileCompletionBonus(userId);

    return this.findMe(userId);
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const uploadResult = await this.cloudinaryService.uploadImage(
      file.buffer,
      'perfume-gpt/users/avatars',
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: uploadResult.url },
    });

    // Check for profile completion bonus after avatar upload
    await this.checkAndAwardProfileCompletionBonus(userId);

    return this.findMe(userId);
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

  async checkAndAwardProfileCompletionBonus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { 
            addresses: true,
            quizResults: true,
          },
        },
      },
    });

    if (!user || user.profileCompletionBonusClaimed) return;

    // Check criteria for 100% completion (matching mobile app logic)
    const isComplete =
      !!user.fullName &&
      !!user.phone &&
      user.emailVerified &&
      !!user.gender &&
      !!user.dateOfBirth &&
      !!user.avatarUrl &&
      user.budgetMin !== null &&
      user.budgetMax !== null &&
      user._count.quizResults > 0 &&
      user._count.addresses > 0;

    if (isComplete) {
      // Award 50 points
      await this.loyaltyService.awardPoints(userId, 50, 'PROFILE_COMPLETION');

      // Mark as claimed
      await this.prisma.user.update({
        where: { id: userId },
        data: { profileCompletionBonusClaimed: true },
      });
    }
  }
}
