import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { QuizService, QuizAnswers } from './quiz.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('quiz')
export class QuizController {
    constructor(private readonly quizService: QuizService) { }

    @Post('submit')
    @UseGuards(OptionalJwtAuthGuard)
    async submitQuiz(
        @Body() body: { answers: QuizAnswers },
        @Req() req: any,
    ) {
        const userId = req.user?.userId || req.user?.id || req.user?.sub || null;
        return this.quizService.submitQuiz(userId, body.answers);
    }

    @Get('history')
    @UseGuards(JwtAuthGuard)
    async getUserQuizHistory(@Req() req: any) {
        const userId = req.user.id || req.user.userId;
        return this.quizService.getUserHistory(userId);
    }

    @Get(':id')
    async getQuizResult(@Param('id') quizId: string) {
        return this.quizService.getQuizResult(quizId);
    }
}