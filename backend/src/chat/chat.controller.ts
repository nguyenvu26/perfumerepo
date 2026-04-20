import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './services/chat.service';
import { ConversationService } from './services/conversation.service';
import { MessageService } from './services/message.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationType, MessageType } from '@prisma/client';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly prisma: PrismaService,
  ) {}

  // ───── GET /chat/contacts ─────
  @Get('contacts')
  async getContacts(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('take') take?: string,
  ) {
    const userRole: string = req.user.role;

    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Permission matrix: who can I see?
    if (userRole === 'CUSTOMER') {
      where.role = 'ADMIN';
    } else if (userRole === 'STAFF') {
      where.role = 'ADMIN';
    } else if (userRole === 'ADMIN') {
      where.role = { in: ['CUSTOMER', 'STAFF'] };
    }

    return this.prisma.user.findMany({
      where,
      take: take ? parseInt(take, 10) : 50,
      select: { id: true, email: true, fullName: true, role: true },
    });
  }

  // ───── GET /chat/conversations ─────
  @Get('conversations')
  async getConversations(@Req() req: any) {
    return this.conversationService.listByUser(req.user.userId);
  }

  // ───── POST /chat/conversations ─────
  @Post('conversations')
  async createConversation(
    @Req() req: any,
    @Body('type') type: ConversationType,
    @Body('otherUserId') otherUserId?: string,
  ) {
    return this.conversationService.create(type, req.user.userId, otherUserId);
  }

  // ───── DELETE /chat/conversations/:id ─────
  @Delete('conversations/:id')
  async deleteConversation(@Req() req: any, @Param('id') id: string) {
    return this.conversationService.softDelete(id, req.user.userId);
  }

  // ───── GET /chat/messages ─────
  @Get('messages')
  async getMessages(
    @Req() req: any,
    @Query('conversationId') conversationId: string,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ) {
    // Validate participation first
    await this.conversationService.getByIdOrFail(
      conversationId,
      req.user.userId,
    );
    return this.messageService.list(
      conversationId,
      take ? parseInt(take, 10) : 50,
      cursor,
    );
  }

  // ───── POST /chat/messages ─────
  @Post('messages')
  async sendMessage(
    @Req() req: any,
    @Body('conversationId') conversationId: string,
    @Body('type') type: MessageType,
    @Body('content') content: any,
  ) {
    return this.chatService.processMessage(
      req.user.userId,
      conversationId,
      type,
      content,
    );
  }

  // ───── POST /chat/messages/image-upload ─────
  @Post('messages/image-upload')
  @UseInterceptors(FileInterceptor('file'))
  async sendImageMessage(
    @Req() req: any,
    @Body('conversationId') conversationId: string,
    @UploadedFile() file: any,
  ) {
    // 1. Upload to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadImage(
      file.buffer,
      'chats',
    );

    // 2. Process message as IMAGE type
    return this.chatService.processMessage(
      req.user.userId,
      conversationId,
      MessageType.IMAGE,
      {
        text: '',
        imageUrl: uploadResult.url,
      },
    );
  }
}
