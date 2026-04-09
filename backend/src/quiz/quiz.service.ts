import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

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
    ) { }

    async submitQuiz(
        userId: string | null,
        answers: QuizAnswers,
    ): Promise<{ quizId: string; recommendations: QuizRecommendation[] }> {
        // 1. Save quiz result to DB
        const data: any = {
            gender: answers.gender,
            occasion: answers.occasion,
            budgetMin: answers.budgetMin,
            budgetMax: answers.budgetMax,
            preferredFamily: answers.preferredFamily,
            longevity: answers.longevity,
        };
        if (userId) data.userId = userId;

        const quizResult = await this.prisma.quizResult.create({
            data,
        });

        // 2. Get AI recommendations
        const recommendations = await this.aiService.quizConsult(answers);

        // 3. Enrich recommendations with DB data
        const enriched = await this.enrichRecommendations(recommendations);

        // 4. Save recommendations to quiz result (optional, for history)
        await this.prisma.quizResult.update({
            where: { id: quizResult.id },
            data: { recommendation: JSON.stringify(enriched) },
        });

        return { quizId: quizResult.id, recommendations: enriched };
    }

    async getQuizResult(quizId: string): Promise<any> {
        const result = await this.prisma.quizResult.findUnique({
            where: { id: quizId },
            include: { user: { select: { id: true, fullName: true } } },
        });

        if (!result) throw new Error('Quiz result not found');

        return {
            ...result,
            recommendation: result.recommendation ? JSON.parse(result.recommendation) : null,
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