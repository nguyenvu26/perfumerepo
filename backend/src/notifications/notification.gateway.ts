import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Notification client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Notification client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data?.userId) {
      const room = `user:${data.userId}`;
      client.join(room);
      this.logger.log(`${client.id} joined notification room ${room}`);
    }
  }

  /** Push a new notification to a specific user */
  sendToUser(userId: string, notification: any) {
    const room = `user:${userId}`;
    this.server.to(room).emit('notification', notification);
  }

  /** Push updated unread count to a specific user */
  sendUnreadCount(userId: string, count: number) {
    const room = `user:${userId}`;
    this.server.to(room).emit('unreadCount', { count });
  }

  /** Push order status change to a specific user (for real-time tracking) */
  sendOrderStatusChanged(
    userId: string,
    payload: { orderId: string; orderCode: string; status: string },
  ) {
    const room = `user:${userId}`;
    this.server.to(room).emit('orderStatusChanged', payload);
    this.logger.log(
      `Emitted orderStatusChanged to ${room} — ${payload.orderCode} → ${payload.status}`,
    );
  }
}
