import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { StaffReportsService } from './staff-reports.service';

@Controller('staff/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STAFF', 'ADMIN')
export class StaffReportsController {
    constructor(private readonly staffReportsService: StaffReportsService) { }

    @Get('daily')
    getDailyReport(@Req() req: any, @Query('date') date?: string) {
        const user = req.user as { userId: string; role: string };
        return this.staffReportsService.getDailyReport(
            user.userId,
            (user.role as 'STAFF' | 'ADMIN') || 'STAFF',
            date,
        );
    }
}
