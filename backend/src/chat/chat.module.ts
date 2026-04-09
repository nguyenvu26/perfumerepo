import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './services/chat.service';
import { ConversationService } from './services/conversation.service';
import { MessageService } from './services/message.service';
import { ChatGateway } from './gateways/chat.gateway';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    ConversationService,
    MessageService,
    ChatGateway,
  ],
  exports: [ChatService],
})
export class ChatModule {}
