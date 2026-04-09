import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { QuizService, QuizAnswers } from './quiz.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('quiz')
export class QuizController {
    constructor(private readonly quizService: QuizService) { }

    @Post('submit')
    @UseGuards(JwtAuthGuard)
    async submitQuiz(
        @Body() body: { answers: QuizAnswers; userId?: string },
        @Req() req: any,
    ) {
        const userId = body.userId || req.user?.id || req.user?.userId || null;
        return this.quizService.submitQuiz(userId, body.answers);
    }

    @Get(':id')
    async getQuizResult(@Param('id') quizId: string) {
        return this.quizService.getQuizResult(quizId);
    }
}