import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/storage/secure_token_storage.dart';
import '../models/chat_message.dart';
import '../services/conversation_service.dart';
import '../services/chat_socket_service.dart';

/// Immutable snapshot of the chat UI state.
class ChatState {
  final List<ChatMessage> messages;

  /// True while loading the conversation + history from the server on first open.
  final bool isInitializing;

  /// True while waiting for the AI reply via socket.
  final bool isSending;

  final String? sendError;

  const ChatState({
    this.messages = const [],
    this.isInitializing = false,
    this.isSending = false,
    this.sendError,
  });

  ChatState copyWith({
    List<ChatMessage>? messages,
    bool? isInitializing,
    bool? isSending,
    String? sendError,
    bool clearError = false,
  }) {
    return ChatState(
      messages: messages ?? this.messages,
      isInitializing: isInitializing ?? this.isInitializing,
      isSending: isSending ?? this.isSending,
      sendError: clearError ? null : (sendError ?? this.sendError),
    );
  }
}

/// Orchestrates:
///  1. REST: create/reuse CUSTOMER_AI conversation + load history
///  2. WebSocket: connect, join room, send & receive messages in real-time
class ChatNotifier extends StateNotifier<ChatState> {
  final ConversationService _convService;
  final ChatSocketService _socketService;
  final SecureTokenStorage _tokenStorage;

  String? _conversationId;

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
  /// 1. POST /chat/conversations → get conversationId
  /// 2. GET /chat/messages       → load history
  /// 3. Connect WebSocket        → join room, listen for new messages
  Future<void> init() async {
    if (!mounted) return;
    state = state.copyWith(isInitializing: true, clearError: true);

    try {
      _conversationId = await _convService.getOrCreateConversation();
      final history = await _convService.loadHistory(_conversationId!);

      final token = await _tokenStorage.getAccessToken();
      if (token != null && mounted) {
        _socketService.connect(
          token: token,
          conversationId: _conversationId!,
          onMessage: _onSocketMessage,
          onError: (err) {
            if (mounted) {
              state = state.copyWith(sendError: 'Mất kết nối: $err');
            }
          },
        );
      }

      if (mounted) {
        state = state.copyWith(
          messages: history.isEmpty ? [_welcomeMessage()] : history,
          isInitializing: false,
        );
      }
    } catch (e) {
      if (mounted) {
        state = state.copyWith(
          isInitializing: false,
          messages: state.messages.isEmpty ? [_welcomeMessage()] : null,
          sendError: e.toString(),
        );
      }
    }
  }

  /// Called when the socket emits "messageReceived" for an AI message.
  void _onSocketMessage(ChatMessage msg) {
    if (!mounted) return;
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

    // 2. Send via WebSocket → AI reply comes back through _onSocketMessage
    if (_conversationId != null && _socketService.isConnected) {
      _socketService.sendMessage(_conversationId!, trimmed);
    } else if (_conversationId != null) {
      // Socket not ready yet - brief wait then retry once
      await Future.delayed(const Duration(seconds: 1));
      if (_socketService.isConnected) {
        _socketService.sendMessage(_conversationId!, trimmed);
      } else {
        if (mounted) {
          state = state.copyWith(
            isSending: false,
            sendError: 'Chưa kết nối được. Vui lòng thử lại.',
          );
        }
      }
    } else {
      if (mounted) {
        state = state.copyWith(
          isSending: false,
          sendError: 'Đang khởi tạo cuộc trò chuyện. Vui lòng thử lại.',
        );
      }
    }
  }

  void clearError() => state = state.copyWith(clearError: true);

  void reset() {
    _socketService.disconnect();
    _conversationId = null;
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
