import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { StaffAiService, StaffAiConsultRequest } from './staff-ai.service';

@Controller('staff/pos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STAFF', 'ADMIN')
export class StaffAiController {
    constructor(private readonly staffAiService: StaffAiService) { }

    @Post('ai-consult')
    async aiConsult(
        @Req() req: any,
        @Body() body: StaffAiConsultRequest,
    ) {
        const user = req.user as { userId: string };
        return this.staffAiService.consultForStaff(user.userId, body);
    }
}
