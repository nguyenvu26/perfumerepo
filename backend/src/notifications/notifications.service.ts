import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationChannel } from '@prisma/client';
import { MailService } from '../mail/mail.service';

export interface CreateNotificationParams {
  userId: string;
  type: string; // ORDER | SHIPPING | PROMOTION | LOYALTY | SYSTEM
  title: string;
  content: string;
  data?: Record<string, any>;
  sendEmail?: boolean; // Optional flag to also send an email
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationGateway,
    private readonly mailService: MailService,
  ) { }

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

    // Handle Email channel if requested
    if (params.sendEmail) {
      this.handleEmailNotification(params).catch((err) => {
        this.logger.error(`Failed to send email notification to user ${params.userId}`, err);
      });
    }

    return notification;
  }

  /** Background task to send email notification */
  private async handleEmailNotification(params: CreateNotificationParams) {
    const user = await this.prisma.user.findUnique({
      where: { id: params.userId },
      select: { email: true, fullName: true },
    });

    if (!user || !user.email) return;

    // Use specific templates based on notification type
    if (params.type === 'ORDER') {
      const orderCode = params.data?.orderCode;
      const totalAmount = params.data?.totalAmount;
      const status = params.data?.status;

      if (params.title.includes('thành công') && orderCode && totalAmount) {
        return this.mailService.sendOrderConfirmationMail(
          user.email,
          user.fullName || 'bạn',
          orderCode,
          totalAmount
        );
      }

      if (status && orderCode) {
        const label = this.getFriendlyStatus(status);
        return this.mailService.sendOrderStatusUpdateMail(
          user.email,
          user.fullName || 'bạn',
          orderCode,
          label
        );
      }
    }

    if (params.type === 'PROMOTION') {
      const promoCode = params.data?.promoCode;
      const description = params.data?.description || params.content;
      if (promoCode) {
        return this.mailService.sendPromotionMail(
          user.email,
          user.fullName || 'bạn',
          promoCode,
          description
        );
      }
    }

    // Default simple email fallback
    await this.mailService.sendMail(
      user.email,
      params.title,
      `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #333;">${params.title}</h2>
        <p>Xin chào ${user.fullName || 'bạn'},</p>
        <p>${params.content}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">PerfumeGPT - Hệ thống tư vấn và bán nước hoa AI</p>
      </div>
      `,
    );
  }

  private getFriendlyStatus(status: string): string {
    const labels: Record<string, string> = {
      CONFIRMED: 'đã được xác nhận',
      PROCESSING: 'đang được xử lý',
      SHIPPED: 'đã giao cho vận chuyển',
      COMPLETED: 'đã hoàn thành',
      CANCELLED: 'đã hủy',
    };
    return labels[status] || status;
  }

  /** List notifications for a user (paginated, optionally filtered by type) */
  async findAll(userId: string, skip = 0, take = 20, type?: string) {
    if (!userId) {
      return { data: [], total: 0, skip, take, pages: 0 };
    }
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
    if (!userId) return 0;
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /** Mark a single notification as read */
  async markAsRead(userId: string, id: string) {
    if (!userId) throw new NotFoundException('User ID required');
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
    } catch (_) { }

    return { success: true };
  }

  /** Mark all notifications as read for a user */
  async markAllAsRead(userId: string) {
    if (!userId) return { success: false };
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    try {
      this.gateway.sendUnreadCount(userId, 0);
    } catch (_) { }

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
    if (!userId) throw new NotFoundException('User ID required');
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    await this.prisma.notification.delete({ where: { id } });
    return { success: true };
  }
}
