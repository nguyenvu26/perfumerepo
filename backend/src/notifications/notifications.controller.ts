import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@Request() req, @Query() query: NotificationQueryDto) {
    const userId = req.user?.userId ?? req.user?.sub ?? req.user?.id;
    return this.notificationsService.findAll(
      userId,
      query.skip,
      query.take,
      query.type,
    );
  }

  @Get('unread-count')
  unreadCount(@Request() req) {
    const userId = req.user?.userId ?? req.user?.sub ?? req.user?.id;
    return this.notificationsService
      .countUnread(userId)
      .then((count) => ({ count }));
  }

  @Patch('mark-all-read')
  markAllAsRead(@Request() req) {
    const userId = req.user?.userId ?? req.user?.sub ?? req.user?.id;
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  markAsRead(@Request() req, @Param('id') id: string) {
    const userId = req.user?.userId ?? req.user?.sub ?? req.user?.id;
    return this.notificationsService.markAsRead(userId, id);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    const userId = req.user?.userId ?? req.user?.sub ?? req.user?.id;
    return this.notificationsService.remove(userId, id);
  }
}
