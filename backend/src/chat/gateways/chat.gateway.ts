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
  namespace: '/chat',
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinConversation')
  handleJoin(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (conversationId) {
      client.join(conversationId);
      this.logger.log(`${client.id} joined room ${conversationId}`);
    }
  }

  @SubscribeMessage('leaveConversation')
  handleLeave(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(conversationId);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() payload: { conversationId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(payload.conversationId).emit('userTyping', payload);
  }

  /** Called from ChatService to push messages to connected clients */
  broadcastMessage(message: any) {
    if (message?.conversationId) {
      this.server.to(message.conversationId).emit('message', message);
    }
  }
}
