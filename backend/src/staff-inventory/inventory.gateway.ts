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
  namespace: '/inventory',
})
export class InventoryGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(InventoryGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Inventory client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Inventory client disconnected: ${client.id}`);
  }

  /** Staff joins their personal room to receive review notifications */
  @SubscribeMessage('joinInventory')
  handleJoin(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data?.userId) {
      const room = `user:${data.userId}`;
      client.join(room);
      this.logger.log(`${client.id} joined inventory room ${room}`);
    }
  }

  /** Emit to a specific staff user when their request is reviewed */
  notifyRequestReviewed(staffId: string, payload: any) {
    const room = `user:${staffId}`;
    this.server.to(room).emit('requestReviewed', payload);
    this.logger.log(
      `Emitted requestReviewed to ${room} — request #${payload.id} ${payload.status}`,
    );
  }
}
