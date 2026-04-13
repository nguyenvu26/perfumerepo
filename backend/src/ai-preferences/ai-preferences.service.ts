import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAiPreferencesDto } from './dto/update-ai-preferences.dto';

@Injectable()
export class AiPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string) {
    let prefs = await this.prisma.userAiPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      // Create default if not exists
      prefs = await this.prisma.userAiPreference.create({
        data: {
          userId,
          riskLevel: 0.3,
          preferredNotes: [],
          avoidedNotes: [],
        },
      });
    }

    return prefs;
  }

  async update(userId: string, dto: UpdateAiPreferencesDto) {
    return this.prisma.userAiPreference.upsert({
      where: { userId },
      update: dto,
      create: {
        userId,
        ...dto,
      },
    });
  }
}
