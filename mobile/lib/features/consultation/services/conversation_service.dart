import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/utils/api_error_mapper.dart';
import '../models/chat_message.dart';

/// Handles REST calls for chat conversations:
/// - Create / reuse a CUSTOMER_AI conversation
/// - Load message history from the server
class ConversationService {
  final ApiClient _client;
  ConversationService(this._client);

  /// POST /chat/conversations { type: "CUSTOMER_AI" }
  /// Backend reuses an existing conversation if one already exists for this user.
  Future<String> getOrCreateConversation() async {
    try {
      final resp = await _client.dio.post<Map<String, dynamic>>(
        '/chat/conversations',
        data: {'type': 'CUSTOMER_AI'},
      );
      return resp.data!['id'] as String;
    } catch (e) {
      throw ApiErrorMapper.toUserMessage(e);
    }
  }

  /// GET /chat/conversations
  /// Returns list of conversations that have at least 1 message.
  Future<List<Map<String, dynamic>>> listConversations() async {
    try {
      final resp = await _client.dio.get<List<dynamic>>('/chat/conversations');
      return (resp.data ?? []).cast<Map<String, dynamic>>();
    } catch (e) {
      throw ApiErrorMapper.toUserMessage(e);
    }
  }

  /// POST /chat/messages { conversationId, type, content }
  /// Returns { message, aiMessage } — same as the web frontend uses.
  Future<Map<String, dynamic>> sendMessage(
    String conversationId,
    String text,
  ) async {
    try {
      final resp = await _client.dio.post<Map<String, dynamic>>(
        '/chat/messages',
        data: {
          'conversationId': conversationId,
          'type': 'TEXT',
          'content': {'text': text},
        },
        options: Options(receiveTimeout: const Duration(seconds: 60)),
      );
      return resp.data!;
    } catch (e) {
      throw ApiErrorMapper.toUserMessage(e);
    }
  }

  /// GET /chat/messages?conversationId=...&take=50
  /// Backend returns newest-first; we reverse for chronological order.
  Future<List<ChatMessage>> loadHistory(String conversationId) async {
    try {
      final resp = await _client.dio.get<Map<String, dynamic>>(
        '/chat/messages',
        queryParameters: {'conversationId': conversationId, 'take': 50},
      );
      final items = (resp.data!['items'] as List?) ?? [];
      return items.reversed
          .map((m) => ChatMessage.fromJson(m as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw ApiErrorMapper.toUserMessage(e);
    }
  }

  /// DELETE /chat/conversations/:id
  /// Soft-deletes the conversation on the server.
  Future<void> deleteConversation(String conversationId) async {
    try {
      await _client.dio.delete('/chat/conversations/$conversationId');
    } catch (e) {
      throw ApiErrorMapper.toUserMessage(e);
    }
  }
}

final conversationServiceProvider = Provider<ConversationService>((ref) {
  return ConversationService(ref.watch(apiClientProvider));
});
