import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/utils/api_error_mapper.dart';
import '../models/chat_message.dart';
import '../models/product_recommendation.dart';

class ChatService {
  final ApiClient _client;
  ChatService(this._client);

  Future<ChatMessage> sendMessage(String text) async {
    try {
      final response = await _client.dio.post<Map<String, dynamic>>(
        '/ai/chat',
        data: {'message': text},
      );
      final data = response.data!;
      ProductRecommendation? recommendation;
      if (data['productRecommendation'] != null) {
        final r = data['productRecommendation'] as Map<String, dynamic>;
        recommendation = ProductRecommendation(
          id: r['id'].toString(),
          name: r['name'].toString(),
          brand: r['brand'].toString(),
          price: (r['price'] as num).toDouble(),
          imageUrl: r['imageUrl'].toString(),
        );
      }
      return ChatMessage(
        isAI: true,
        text: data['reply'].toString(),
        timestamp: DateTime.now(),
        productRecommendation: recommendation,
      );
    } catch (error) {
      throw ApiErrorMapper.toUserMessage(error);
    }
  }
}

final chatServiceProvider = Provider<ChatService>((ref) {
  return ChatService(ref.watch(apiClientProvider));
});
