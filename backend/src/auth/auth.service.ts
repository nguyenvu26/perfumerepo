import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import { UserRoleEnum } from '@prisma/client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone ?? undefined }] },
    });
    if (existing) {
      throw new ConflictException('Email or phone already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Check if this is the first user
    const userCount = await this.prisma.user.count();
    const role = userCount === 0 ? UserRoleEnum.ADMIN : UserRoleEnum.CUSTOMER;

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 3600000); // 24 hours

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        fullName: dto.fullName,
        role,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      },
    });

    // Migrate guest loyalty points: if the user registered with a phone number,
    // find all LoyaltyTransactions tracked by that phone (from POS guest purchases)
    // and link them to the new user account.
    if (dto.phone) {
      await this.migrateGuestLoyalty(user.id, dto.phone);
    }

    const frontendUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const verificationLink = `${frontendUrl}/vi/verify-email?token=${verificationToken}`;

    await this.mailService.sendVerificationMail(user.email, verificationLink);

    return {
      success: true,
      message:
        'Đăng ký thành công. Bạn có thể đăng nhập ngay. Xác thực email (tùy chọn) có thể làm trong Hồ sơ.',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Email verification không bắt buộc để đăng nhập (development)
    // if (!user.emailVerified) {
    //   throw new ForbiddenException('Please verify your email to log in');
    // }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<any>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      if (!payload?.sub || !payload?.email || !payload?.role) {
        throw new ForbiddenException('Invalid refresh token');
      }

      return this.generateTokens(payload.sub, payload.email, payload.role);
    } catch {
      throw new ForbiddenException('Invalid refresh token');
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Don't reveal if user exists or not for security
    if (!user) {
      return {
        success: true,
        message: 'If the email exists, a reset link has been sent',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Store token in database
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: expiresAt,
      },
    });

    // Send email with reset link
    const frontendUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/vi/reset-password?token=${resetToken}`;

    await this.mailService.sendPasswordResetMail(user.email, resetLink);

    return {
      success: true,
      message: 'If the email exists, a reset link has been sent',
      // For development only - remove in production
      resetToken:
        process.env.NODE_ENV === 'development' ? resetToken : undefined,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: dto.token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return {
      success: true,
      message: 'Password has been reset successfully',
    };
  }

  async resendVerificationEmail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.emailVerified) {
      return { success: true, message: 'Email đã được xác thực rồi.' };
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 3600000);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      },
    });

    const frontendUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const verificationLink = `${frontendUrl}/vi/verify-email?token=${verificationToken}`;
    await this.mailService.sendVerificationMail(user.email, verificationLink);

    return {
      success: true,
      message: 'Đã gửi email xác thực. Kiểm tra hộp thư của bạn.',
    };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (
      !user ||
      (user.emailVerificationExpires &&
        user.emailVerificationExpires < new Date())
    ) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return {
      success: true,
      message: 'Email verified successfully. You can now log in.',
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new NotFoundException('User not found');
    }

    const passwordValid = await bcrypt.compare(
      dto.oldPassword,
      user.passwordHash,
    );
    if (!passwordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  /**
   * Mobile social login: verify provider token, then create/find user.
   */
  async socialLoginWithToken(dto: SocialLoginDto) {
    let verifiedEmail: string;
    let verifiedName: string | undefined;
    let verifiedAvatar: string | undefined;
    let verifiedProviderId: string;

    if (dto.provider === 'google') {
      // Verify Google ID token via tokeninfo endpoint
      const res = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${dto.token}`,
      );
      if (!res.ok) {
        throw new UnauthorizedException('Invalid Google token');
      }
      const payload = (await res.json()) as Record<string, any>;
      verifiedEmail = payload.email;
      verifiedName = payload.name;
      verifiedAvatar = payload.picture;
      verifiedProviderId = payload.sub;
    } else {
      // Verify Facebook access token via Graph API
      const res = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${dto.token}`,
      );
      if (!res.ok) {
        throw new UnauthorizedException('Invalid Facebook token');
      }
      const payload = (await res.json()) as Record<string, any>;
      if (!payload.email) {
        throw new BadRequestException(
          'Facebook account must have a public email',
        );
      }
      verifiedEmail = payload.email;
      verifiedName = payload.name;
      verifiedAvatar = payload.picture?.data?.url;
      verifiedProviderId = payload.id;
    }

    // Delegate to existing OAuth user creation/linking logic
    return this.validateOAuthUser({
      provider: dto.provider,
      providerId: verifiedProviderId,
      email: verifiedEmail,
      fullName: verifiedName,
      avatarUrl: verifiedAvatar,
      accessToken: dto.token,
    });
  }

  async validateOAuthUser(profile: {
    provider: string;
    providerId: string;
    email: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    accessToken?: string;
  }) {
    // Check if user exists with this OAuth account
    const oauthAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: profile.provider,
          providerAccountId: profile.providerId,
        },
      },
      include: { user: true },
    });

    if (oauthAccount) {
      // Update access token
      await this.prisma.oAuthAccount.update({
        where: { id: oauthAccount.id },
        data: {
          accessToken: profile.accessToken,
        },
      });

      return this.generateTokens(
        oauthAccount.user.id,
        oauthAccount.user.email,
        oauthAccount.user.role,
      );
    }

    // Check if user exists with this email
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (user) {
      // Link OAuth account to existing user
      await this.prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: profile.provider,
          providerAccountId: profile.providerId,
          accessToken: profile.accessToken,
        },
      });
    } else {
      // Create new user with OAuth account
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          fullName:
            profile.fullName ||
            `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
          avatarUrl: profile.avatarUrl,
          role: UserRoleEnum.CUSTOMER,
          accounts: {
            create: {
              provider: profile.provider,
              providerAccountId: profile.providerId,
              accessToken: profile.accessToken,
            },
          },
        },
      });
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
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
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Migrate guest loyalty points to a newly registered user.
   * Finds all LoyaltyTransactions with matching phone that have no userId,
   * sums their points, adds them to the user's loyaltyPoints, and links
   * the transactions to the user.
   */
  private async migrateGuestLoyalty(userId: string, phone: string) {
    const guestTransactions = await this.prisma.loyaltyTransaction.findMany({
      where: { phone, userId: null },
    });

    if (guestTransactions.length === 0) return;

    const totalPoints = guestTransactions.reduce((sum, t) => sum + t.points, 0);

    await this.prisma.$transaction(async (tx) => {
      // Link all guest transactions to the new user
      await tx.loyaltyTransaction.updateMany({
        where: { phone, userId: null },
        data: { userId },
      });

      // Add total points to user's balance
      if (totalPoints > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { loyaltyPoints: { increment: totalPoints } },
        });
      }

      // Create a migration log transaction
      await tx.loyaltyTransaction.create({
        data: {
          userId,
          phone,
          points: 0,
          reason: `MIGRATED_TO_USER (${guestTransactions.length} transactions, ${totalPoints} points)`,
        },
      });
    });
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = await this.jwtService.signAsync(payload as any, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn:
        this.configService.get<number>('JWT_ACCESS_EXPIRES_IN') ?? 15 * 60,
    });

    const refreshToken = await this.jwtService.signAsync(payload as any, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn:
        this.configService.get<number>('JWT_REFRESH_EXPIRES_IN') ??
        7 * 24 * 60 * 60,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email,
        role,
      },
    };
  }
}
