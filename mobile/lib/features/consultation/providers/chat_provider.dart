import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/storage/secure_token_storage.dart';
import '../models/chat_message.dart';
import '../services/conversation_service.dart';
import '../services/chat_socket_service.dart';

/// Summary of a conversation for the list UI.
class ConversationSummary {
  final String id;
  final String type;
  final String lastMessageText;
  final DateTime updatedAt;

  const ConversationSummary({
    required this.id,
    required this.type,
    required this.lastMessageText,
    required this.updatedAt,
  });

  factory ConversationSummary.fromJson(Map<String, dynamic> json) {
    final messages = json['messages'] as List? ?? [];
    String lastMsg = '';
    if (messages.isNotEmpty) {
      final content = messages[0]['content'];
      if (content is Map) lastMsg = (content['text'] ?? '').toString();
    }
    return ConversationSummary(
      id: json['id'] as String,
      type: (json['type'] ?? 'CUSTOMER_AI') as String,
      lastMessageText: lastMsg,
      updatedAt:
          DateTime.tryParse(json['updatedAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}

/// Immutable snapshot of the chat UI state.
class ChatState {
  final List<ChatMessage> messages;
  final List<ConversationSummary> conversations;

  /// True while loading the conversation + history from the server on first open.
  final bool isInitializing;

  /// True while waiting for the AI reply.
  final bool isSending;

  final String? sendError;

  /// Currently active conversation ID (null = new chat draft).
  final String? activeConversationId;

  const ChatState({
    this.messages = const [],
    this.conversations = const [],
    this.isInitializing = false,
    this.isSending = false,
    this.sendError,
    this.activeConversationId,
  });

  ChatState copyWith({
    List<ChatMessage>? messages,
    List<ConversationSummary>? conversations,
    bool? isInitializing,
    bool? isSending,
    String? sendError,
    String? activeConversationId,
    bool clearError = false,
    bool clearConversation = false,
  }) {
    return ChatState(
      messages: messages ?? this.messages,
      conversations: conversations ?? this.conversations,
      isInitializing: isInitializing ?? this.isInitializing,
      isSending: isSending ?? this.isSending,
      sendError: clearError ? null : (sendError ?? this.sendError),
      activeConversationId: clearConversation
          ? null
          : (activeConversationId ?? this.activeConversationId),
    );
  }
}

/// Orchestrates:
///  1. REST: list conversations, lazy-create on first message
///  2. WebSocket: join room, listen for real-time messages
class ChatNotifier extends StateNotifier<ChatState> {
  final ConversationService _convService;
  final ChatSocketService _socketService;
  final SecureTokenStorage _tokenStorage;

  ChatNotifier({
    required ConversationService convService,
    required ChatSocketService socketService,
    required SecureTokenStorage tokenStorage,
  }) : _convService = convService,
       _socketService = socketService,
       _tokenStorage = tokenStorage,
       super(const ChatState(isInitializing: true));

  static ChatMessage _welcomeMessage() => ChatMessage(
    isAI: true,
    text:
        'Chào bạn. Tôi là chuyên gia mùi hương AI đồng hành cùng bạn. Hôm nay tôi có thể giúp bạn tìm ra mùi hương đặc trưng như thế nào?',
    timestamp: DateTime.now(),
  );

  /// Call once after the screen is mounted.
  /// Loads conversation list, then shows welcome or last conversation.
  Future<void> init() async {
    if (!mounted) return;
    state = state.copyWith(isInitializing: true, clearError: true);

    try {
      final rawConvs = await _convService.listConversations();
      final convos = rawConvs
          .map((c) => ConversationSummary.fromJson(c))
          .where((c) => c.type == 'CUSTOMER_AI')
          .toList();

      if (convos.isNotEmpty) {
        // Auto-select the most recent conversation
        final latest = convos.first;
        final history = await _convService.loadHistory(latest.id);
        await _connectSocket(latest.id);

        if (mounted) {
          state = state.copyWith(
            conversations: convos,
            activeConversationId: latest.id,
            messages: history.isEmpty ? [_welcomeMessage()] : history,
            isInitializing: false,
          );
        }
      } else {
        // No conversations yet — show welcome (draft mode)
        if (mounted) {
          state = state.copyWith(
            conversations: convos,
            messages: [_welcomeMessage()],
            isInitializing: false,
            clearConversation: true,
          );
        }
      }
    } catch (e) {
      if (mounted) {
        state = state.copyWith(
          isInitializing: false,
          messages: [_welcomeMessage()],
          sendError: e.toString(),
        );
      }
    }
  }

  /// Switch to an existing conversation.
  Future<void> selectConversation(String conversationId) async {
    if (!mounted) return;
    state = state.copyWith(
      isInitializing: true,
      activeConversationId: conversationId,
    );
    _socketService.disconnect();

    try {
      final history = await _convService.loadHistory(conversationId);
      await _connectSocket(conversationId);
      if (mounted) {
        state = state.copyWith(
          messages: history.isEmpty ? [_welcomeMessage()] : history,
          isInitializing: false,
        );
      }
    } catch (e) {
      if (mounted) {
        state = state.copyWith(isInitializing: false, sendError: e.toString());
      }
    }
  }

  /// Start a brand new conversation (draft mode).
  void startNewConversation() {
    if (!mounted) return;
    _socketService.disconnect();
    state = state.copyWith(
      messages: [_welcomeMessage()],
      clearConversation: true,
      clearError: true,
    );
  }

  Future<void> _connectSocket(String conversationId) async {
    final token = await _tokenStorage.getAccessToken();
    if (token != null && mounted) {
      _socketService.connect(
        token: token,
        conversationId: conversationId,
        onMessage: _onSocketMessage,
        onError: (err) {
          if (mounted) {
            state = state.copyWith(sendError: 'Mất kết nối: $err');
          }
        },
      );
    }
  }

  void _onSocketMessage(ChatMessage msg) {
    if (!mounted) return;
    // Deduplicate — we might already have the message from the REST response
    final isDuplicate = state.messages.any(
      (m) => m.id != null && m.id == msg.id,
    );
    if (isDuplicate) return;
    state = state.copyWith(
      messages: [...state.messages, msg],
      isSending: false,
    );
  }

  Future<void> sendMessage(String text) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return;

    // 1. Optimistically add the user message to the UI
    final userMsg = ChatMessage(
      isAI: false,
      text: trimmed,
      timestamp: DateTime.now(),
    );

    state = state.copyWith(
      messages: [...state.messages, userMsg],
      isSending: true,
      clearError: true,
    );

    try {
      // 2. Lazy creation: if no active conversation, create one now
      String convId;
      if (state.activeConversationId == null) {
        convId = await _convService.getOrCreateConversation();
        await _connectSocket(convId);
        if (mounted) {
          state = state.copyWith(activeConversationId: convId);
        }
      } else {
        convId = state.activeConversationId!;
      }

      // 3. Send via REST
      final result = await _convService.sendMessage(convId, trimmed);
      final aiData = result['aiMessage'];
      if (aiData != null && mounted) {
        final aiMsg = ChatMessage.fromJson(aiData as Map<String, dynamic>);
        state = state.copyWith(
          messages: [...state.messages, aiMsg],
          isSending: false,
        );
      } else if (mounted) {
        state = state.copyWith(isSending: false);
      }

      // 4. Refresh conversation list (new conv may have been created)
      _refreshConversations();
    } catch (e) {
      if (mounted) {
        state = state.copyWith(isSending: false, sendError: e.toString());
      }
    }
  }

  Future<void> _refreshConversations() async {
    try {
      final rawConvs = await _convService.listConversations();
      final convos = rawConvs
          .map((c) => ConversationSummary.fromJson(c))
          .where((c) => c.type == 'CUSTOMER_AI')
          .toList();
      if (mounted) {
        state = state.copyWith(conversations: convos);
      }
    } catch (_) {}
  }

  void clearError() => state = state.copyWith(clearError: true);

  /// Soft-delete a conversation. If it's the active one, switch to draft.
  Future<void> deleteConversation(String conversationId) async {
    try {
      await _convService.deleteConversation(conversationId);
      if (!mounted) return;

      final updatedConvos = state.conversations
          .where((c) => c.id != conversationId)
          .toList();

      if (state.activeConversationId == conversationId) {
        // Was viewing the deleted conversation — switch to draft
        _socketService.disconnect();
        state = state.copyWith(
          conversations: updatedConvos,
          messages: [_welcomeMessage()],
          clearConversation: true,
        );
      } else {
        state = state.copyWith(conversations: updatedConvos);
      }
    } catch (e) {
      if (mounted) {
        state = state.copyWith(sendError: e.toString());
      }
    }
  }

  void reset() {
    _socketService.disconnect();
    state = const ChatState(isInitializing: true);
    init();
  }

  @override
  void dispose() {
    _socketService.disconnect();
    super.dispose();
  }
}

final chatProvider = StateNotifierProvider.autoDispose<ChatNotifier, ChatState>(
  (ref) {
    return ChatNotifier(
      convService: ref.watch(conversationServiceProvider),
      socketService: ref.watch(chatSocketServiceProvider),
      tokenStorage: ref.watch(secureTokenStorageProvider),
    );
  },
);
