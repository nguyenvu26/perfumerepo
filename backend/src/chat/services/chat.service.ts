import { Injectable, Logger } from '@nestjs/common';
import { MessageService } from './message.service';
import { ConversationService } from './conversation.service';
import { AiService } from '../../ai/ai.service';
import { ChatGateway } from '../gateways/chat.gateway';
import { MessageType, SenderType } from '@prisma/client';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly messageService: MessageService,
    private readonly conversationService: ConversationService,
    private readonly aiService: AiService,
    private readonly chatGateway: ChatGateway,
  ) {}

  /**
   * Called from POST /chat/messages.
   * 1. Validate participation
   * 2. Save user message
   * 3. If AI conversation → call AI, save AI response
   * 4. Broadcast via WS
   */
  async processMessage(
    userId: string,
    conversationId: string,
    type: MessageType,
    content: any,
  ) {
    // 1. Verify user belongs to conversation
    const conv = await this.conversationService.getByIdOrFail(
      conversationId,
      userId,
    );

    // 2. Save user message
    const userMessage = await this.messageService.create({
      conversationId,
      senderId: userId,
      senderType: SenderType.USER,
      type,
      content,
    });

    // 3. Broadcast user message to WS room
    this.chatGateway.broadcastMessage(userMessage);

    // 4. Handle AI if applicable
    let aiMessage: any = null;

    if (conv.type === 'CUSTOMER_AI' || conv.type === 'ADMIN_AI') {
      try {
        // Build short history from recent messages for context
        const { items: recentMessages } = await this.messageService.list(
          conversationId,
          10,
        );
        const history = recentMessages
          .filter((m) => m.id !== userMessage.id)
          .map((m) => ({
            role: m.senderType === 'USER' ? 'USER' : 'AI',
            text: (m.content as any)?.text ?? '',
          }));

        const userText = content?.text ?? '';
        let aiResponseText: string;

        if (conv.type === 'CUSTOMER_AI') {
          aiResponseText = await this.aiService.perfumeConsult(
            userText,
            history,
          );
        } else {
          aiResponseText = await this.aiService.marketingAdvise(
            userText,
            history,
          );
        }

        // Try to parse structured AI response (may have recommendations)
        let aiContent: any = { text: aiResponseText };
        let aiMsgType: MessageType = MessageType.TEXT;

        try {
          const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
              aiMsgType = MessageType.AI_RECOMMENDATION;
              aiContent = {
                text: parsed.text ?? 'Here are some recommendations:',
                recommendations: parsed.recommendations,
              };
            }
          }
        } catch {
          // Not JSON – keep as plain text
        }

        aiMessage = await this.messageService.create({
          conversationId,
          senderType: SenderType.AI,
          type: aiMsgType,
          content: aiContent,
        });

        this.chatGateway.broadcastMessage(aiMessage);
      } catch (error) {
        this.logger.error('AI response failed', error);
        // Save a fallback error message so the user knows
        aiMessage = await this.messageService.create({
          conversationId,
          senderType: SenderType.AI,
          type: MessageType.TEXT,
          content: {
            text: 'Sorry, I am having trouble responding right now. Please try again.',
          },
        });
        this.chatGateway.broadcastMessage(aiMessage);
      }
    }

    return { message: userMessage, aiMessage };
  }
}
