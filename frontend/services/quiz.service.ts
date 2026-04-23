import api from '@/lib/axios';

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

export interface QuizResult {
    quizId: string;
    analysis: string;
    recommendations: QuizRecommendation[];
}

export const quizService = {
    async submitQuiz(answers: QuizAnswers): Promise<QuizResult> {
        const response = await api.post('/quiz/submit', { answers });
        return response.data;
    },

    async getQuizResult(quizId: string) {
        const response = await api.get(`/quiz/${quizId}`);
        return response.data;
    },

    async getHistory() {
        const response = await api.get('/quiz/history');
        return response.data;
    },
};
