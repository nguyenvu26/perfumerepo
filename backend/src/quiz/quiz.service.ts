import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

export interface QuizAnswers {
    gender?: 'MALE' | 'FEMALE' | 'UNISEX';
    occasion?: string;
    budgetMin?: number;
    budgetMax?: number;
    preferredFamily?: string;
    longevity?: string;
}

export interface QuizRecommendation {
    productId: string;
    name: string;
    reason: string;
    price: number;
    brand?: string;
    imageUrl?: string;
    tags?: string[];
    variantId?: string;
}

@Injectable()
export class QuizService {
    private readonly logger = new Logger(QuizService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly aiService: AiService,
        private readonly notificationsService: NotificationsService,
        private readonly usersService: UsersService,
    ) { }

    async submitQuiz(
        userId: string | null,
        answers: QuizAnswers,
    ): Promise<{ quizId: string; analysis: string; recommendations: QuizRecommendation[] }> {
        // 1. Get AI recommendations first
        const aiResult = await this.aiService.quizConsult(answers, userId || undefined);

        // 2. Enrich recommendations with DB data
        const enriched = await this.enrichRecommendations(aiResult.recommendations);

        // 3. Save quiz result to DB in one go
        const quizResult = await this.prisma.quizResult.create({
            data: {
                userId,
                gender: answers.gender,
                occasion: answers.occasion,
                budgetMin: answers.budgetMin,
                budgetMax: answers.budgetMax,
                preferredFamily: answers.preferredFamily,
                longevity: answers.longevity,
                recommendation: enriched as any,
                analysis: aiResult.analysis,
            },
        });

        // 4. Notify user if logged in
        if (userId) {
            this.notificationsService.create({
                userId,
                type: 'SYSTEM',
                title: 'Kết hợp mùi hương hoàn hảo cho bạn!',
                content: 'Kết quả phân tích mùi hương dựa trên Quiz của bạn đã sẵn sàng. Xem ngay các gợi ý dành riêng cho bạn!',
                data: { quizId: quizResult.id },
            }).catch(() => { });

            // Check for profile completion bonus
            await this.usersService.checkAndAwardProfileCompletionBonus(userId);
        }

        return { quizId: quizResult.id, analysis: aiResult.analysis, recommendations: enriched };
    }

    async getUserHistory(userId: string): Promise<any[]> {
        const results = await this.prisma.quizResult.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        return results.map(r => ({
            ...r,
            recommendation: r.recommendation as unknown as QuizRecommendation[],
        }));
    }

    async getQuizResult(quizId: string): Promise<any> {
        const result = await this.prisma.quizResult.findUnique({
            where: { id: quizId },
            include: { user: { select: { id: true, fullName: true } } },
        });

        if (!result) throw new Error('Quiz result not found');

        return {
            ...result,
            recommendation: result.recommendation as unknown as QuizRecommendation[],
        };
    }

    private async enrichRecommendations(
        recommendations: Array<{ productId: string; name: string; reason: string; price: number }>,
    ): Promise<QuizRecommendation[]> {
        const enriched = await Promise.all(
            recommendations.map(async (rec) => {
                const product = await this.prisma.product.findUnique({
                    where: { id: rec.productId },
                    select: {
                        id: true,
                        name: true,
                        brand: { select: { name: true } },
                        images: { select: { url: true }, take: 1 },
                        gender: true,
                        scentFamily: { select: { name: true } },
                        concentration: true,
                        variants: {
                            where: { isActive: true },
                            select: { id: true, name: true },
                            take: 1,
                        },
                    },
                });

                if (!product) return rec as QuizRecommendation;

                const tags = [
                    product.gender,
                    product.scentFamily?.name,
                    product.concentration,
                ].filter((tag): tag is string => Boolean(tag));

                return {
                    ...rec,
                    brand: product.brand?.name,
                    imageUrl: product.images[0]?.url,
                    tags,
                    variantId: product.variants[0]?.id,
                };
            }),
        );

        return enriched;
    }
}