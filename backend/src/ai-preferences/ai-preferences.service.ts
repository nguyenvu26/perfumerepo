import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAiPreferencesDto } from './dto/update-ai-preferences.dto';

@Injectable()
export class AiPreferencesService {
  constructor(private readonly prisma: PrismaService) { }

  private readonly defaultPreferences = {
    riskLevel: 0.3,
    preferredNotes: [] as string[],
    avoidedNotes: [] as string[],
  };

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc tài khoản không còn tồn tại');
    }
  }

  async findByUser(userId: string) {
    const prefs = await this.prisma.userAiPreference.findUnique({
      where: { userId },
    });

    if (prefs) {
      return prefs;
    }

    await this.ensureUserExists(userId);

    return this.prisma.userAiPreference.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        ...this.defaultPreferences,
      },
    });
  }

  async update(userId: string, dto: UpdateAiPreferencesDto) {
    await this.ensureUserExists(userId);

    return this.prisma.userAiPreference.upsert({
      where: { userId },
      update: dto,
      create: {
        userId,
        ...this.defaultPreferences,
        ...dto,
      },
    });
  }

  async reset(userId: string) {
    await this.ensureUserExists(userId);

    return this.prisma.userAiPreference.upsert({
      where: { userId },
      update: this.defaultPreferences,
      create: {
        userId,
        ...this.defaultPreferences,
      },
    });
  }

  async handleFeedback(userId: string, type: 'LIKE' | 'DISLIKE') {
    const prefs = await this.findByUser(userId);
    let newRiskLevel = prefs.riskLevel;

    if (type === 'LIKE') {
      newRiskLevel = Math.min(1.0, newRiskLevel + 0.05);
    } else {
      newRiskLevel = Math.max(0.1, newRiskLevel - 0.1);
    }

    return this.prisma.userAiPreference.update({
      where: { userId },
      data: { riskLevel: newRiskLevel },
    });
  }
}
