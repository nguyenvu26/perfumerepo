import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationChannel } from '@prisma/client';

export interface CreateNotificationParams {
  userId: string;
  type: string; // ORDER | SHIPPING | PROMOTION | LOYALTY | SYSTEM
  title: string;
  content: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationGateway,
  ) {}

  /** Create a notification, save to DB, and push real-time */
  async create(params: CreateNotificationParams) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        content: params.content,
        data: params.data ? JSON.stringify(params.data) : null,
        channel: NotificationChannel.IN_APP,
      },
    });

    // Push real-time via WebSocket
    try {
      this.gateway.sendToUser(params.userId, notification);
      const unreadCount = await this.countUnread(params.userId);
      this.gateway.sendUnreadCount(params.userId, unreadCount);
    } catch (e) {
      this.logger.warn('Failed to push real-time notification', e);
    }

    return notification;
  }

  /** List notifications for a user (paginated, optionally filtered by type) */
  async findAll(userId: string, skip = 0, take = 20, type?: string) {
    const where: any = { userId };
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data, total, skip, take, pages: Math.ceil(total / take) };
  }

  /** Count unread notifications */
  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /** Mark a single notification as read */
  async markAsRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    const unreadCount = await this.countUnread(userId);
    try {
      this.gateway.sendUnreadCount(userId, unreadCount);
    } catch (_) {}

    return { success: true };
  }

  /** Mark all notifications as read for a user */
  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    try {
      this.gateway.sendUnreadCount(userId, 0);
    } catch (_) {}

    return { success: true };
  }

  /** Emit an order-status-changed event via WebSocket (no DB record) */
  emitOrderStatusChanged(
    userId: string,
    payload: { orderId: string; orderCode: string; status: string },
  ) {
    try {
      this.gateway.sendOrderStatusChanged(userId, payload);
    } catch (e) {
      this.logger.warn('Failed to emit orderStatusChanged', e);
    }
  }

  /** Delete a notification */
  async remove(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    await this.prisma.notification.delete({ where: { id } });
    return { success: true };
  }
}
