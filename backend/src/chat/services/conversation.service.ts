import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationType, ConversationParticipantRole } from '@prisma/client';

const INCLUDE_CONV = {
  participants: {
    include: {
      user: { select: { id: true, email: true, fullName: true, role: true } },
    },
  },
  messages: { orderBy: { createdAt: 'desc' as const }, take: 1 },
};

@Injectable()
export class ConversationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create or return existing conversation.
   * @param type       - one of the 4 ConversationType values
   * @param currentUserId - the logged-in user
   * @param otherUserId   - (human chats only) the other user
   */
  async create(
    type: ConversationType,
    currentUserId: string,
    otherUserId?: string,
  ) {
    // ── Human-to-Human: reuse existing conversation ──
    if ((type === 'CUSTOMER_ADMIN' || type === 'ADMIN_STAFF') && otherUserId) {
      const existing = await this.prisma.conversation.findFirst({
        where: {
          type,
          AND: [
            { participants: { some: { userId: currentUserId } } },
            { participants: { some: { userId: otherUserId } } },
          ],
        },
        include: INCLUDE_CONV,
      });
      if (existing) return existing;
    }

    // ── Build participant list ──
    const participants = this.buildParticipants(
      type,
      currentUserId,
      otherUserId,
    );

    return this.prisma.conversation.create({
      data: {
        type,
        participants: { create: participants },
      },
      include: INCLUDE_CONV,
    });
  }

  async listByUser(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
        messages: { some: {} },
        deletedAt: null,
      },
      include: INCLUDE_CONV,
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Soft-delete a conversation (set deletedAt = now).
   * Only a participant can delete their conversation.
   */
  async softDelete(id: string, userId: string) {
    await this.getByIdOrFail(id, userId);
    return this.prisma.conversation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Fetch a conversation + verify user is participant.
   * Returns full conv with participants (needed by ChatService).
   */
  async getByIdOrFail(id: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id },
      include: { participants: true },
    });

    if (!conv) throw new NotFoundException('Conversation not found');

    // AI participants have userId = null, so we only check real users
    const isParticipant = conv.participants.some((p) => p.userId === userId);
    if (!isParticipant)
      throw new ForbiddenException('Not a participant of this conversation');

    return conv;
  }

  // ─── helpers ───────────────────────────────────────────
  private buildParticipants(
    type: ConversationType,
    uid1: string,
    uid2?: string,
  ): Array<{
    userId?: string;
    role: ConversationParticipantRole;
  }> {
    switch (type) {
      case 'CUSTOMER_ADMIN':
        return [
          { userId: uid1, role: ConversationParticipantRole.CUSTOMER },
          { userId: uid2, role: ConversationParticipantRole.ADMIN },
        ];
      case 'ADMIN_STAFF':
        return [
          { userId: uid1, role: ConversationParticipantRole.ADMIN },
          { userId: uid2, role: ConversationParticipantRole.STAFF },
        ];
      case 'CUSTOMER_AI':
        return [
          { userId: uid1, role: ConversationParticipantRole.CUSTOMER },
          { role: ConversationParticipantRole.AI },
        ];
      case 'ADMIN_AI':
        return [
          { userId: uid1, role: ConversationParticipantRole.ADMIN },
          { role: ConversationParticipantRole.AI },
        ];
    }
  }
}
