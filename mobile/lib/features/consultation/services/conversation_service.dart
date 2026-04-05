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
}

final conversationServiceProvider = Provider<ConversationService>((ref) {
  return ConversationService(ref.watch(apiClientProvider));
});
