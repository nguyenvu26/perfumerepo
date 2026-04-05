import api from '@/lib/axios';

export type ConversationType = 'CUSTOMER_ADMIN' | 'CUSTOMER_AI' | 'ADMIN_STAFF' | 'ADMIN_AI';
export type SenderType = 'USER' | 'AI';
export type MessageType = 'TEXT' | 'PRODUCT_CARD' | 'SYSTEM' | 'AI_RECOMMENDATION';

export type ConversationParticipantRole = 'CUSTOMER' | 'ADMIN' | 'STAFF' | 'AI';

export type ConversationParticipant = {
  id: string;
  conversationId: string;
  userId: string | null;
  role: ConversationParticipantRole;
  joinedAt: string;
  user?: { id: string; email: string; fullName: string | null; role: string } | null;
};

export type Conversation = {
  id: string;
  type: ConversationType;
  createdAt: string;
  updatedAt: string;
  participants?: ConversationParticipant[];
  messages?: Message[];
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderType: SenderType;
  type: MessageType;
  content: any;
  createdAt: string;
};

export type ChatContact = {
  id: string;
  email: string;
  fullName: string | null;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
};

export const chatService = {
  listContacts(params?: { search?: string; take?: number }): Promise<ChatContact[]> {
    return api.get<ChatContact[]>('/chat/contacts', { params }).then((r) => r.data);
  },
  listConversations(): Promise<Conversation[]> {
    return api.get<Conversation[]>('/chat/conversations').then((r) => r.data);
  },
  createConversation(dto: { type: ConversationType; otherUserId?: string }): Promise<Conversation> {
    return api.post<Conversation>('/chat/conversations', dto).then((r) => r.data);
  },
  getMessages(params: { conversationId: string; cursor?: string; take?: number }): Promise<{ items: Message[]; nextCursor: string | null }> {
    return api.get('/chat/messages', { params }).then((r) => r.data);
  },
  sendMessage(dto: { conversationId: string; type: MessageType; content: any }): Promise<{ message: Message; aiMessage: Message | null }> {
    return api.post('/chat/messages', dto).then((r) => r.data);
  },
};

