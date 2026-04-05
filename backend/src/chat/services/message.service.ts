import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, SenderType, MessageType } from '@prisma/client';

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    conversationId: string;
    senderId?: string | null;
    senderType: SenderType;
    type: MessageType;
    content: any;
  }) {
    const msg = await this.prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId ?? null,
        senderType: data.senderType,
        type: data.type,
        content: data.content,
      },
      include: {
        sender: { select: { id: true, fullName: true, email: true } },
      },
    });

    // Touch updatedAt on the conversation so it sorts correctly
    await this.prisma.conversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() },
    });

    return msg;
  }

  async list(
    conversationId: string,
    take = 50,
    cursor?: string,
  ) {
    const args: Prisma.MessageFindManyArgs = {
      where: { conversationId },
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, fullName: true, email: true } },
      },
    };

    if (cursor) {
      args.cursor = { id: cursor };
      args.skip = 1; // skip the cursor itself
    }

    const messages = await this.prisma.message.findMany(args);

    const nextCursor =
      messages.length === take ? messages[messages.length - 1].id : null;

    return { items: messages, nextCursor };
  }
}
