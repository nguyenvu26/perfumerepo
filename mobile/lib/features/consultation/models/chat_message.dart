import 'product_recommendation.dart';

/// Lightweight AI recommendation returned inside a backend AI_RECOMMENDATION message.
/// Contains only what the AI knows: productId (virtual), name, reason.
class AiRecommendation {
  final String productId;
  final String name;
  final String reason;

  const AiRecommendation({
    required this.productId,
    required this.name,
    required this.reason,
  });

  factory AiRecommendation.fromJson(Map<String, dynamic> json) {
    return AiRecommendation(
      productId: (json['productId'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      reason: (json['reason'] ?? '').toString(),
    );
  }
}

class ChatMessage {
  /// DB id — present for messages loaded from history or received via socket.
  final String? id;
  final bool isAI;
  final String text;
  final DateTime timestamp;

  /// Legacy single-product recommendation (kept for backward compatibility).
  final ProductRecommendation? productRecommendation;

  /// AI recommendations list from backend CUSTOMER_AI conversations.
  final List<AiRecommendation>? recommendations;

  ChatMessage({
    this.id,
    required this.isAI,
    required this.text,
    required this.timestamp,
    this.productRecommendation,
    this.recommendations,
  });

  /// Deserialize a backend Message JSON object.
  /// Backend shape: { id, senderType: "USER"|"AI", type, content: { text, recommendations[] }, createdAt }
  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    final content = json['content'];
    String text = '';
    List<AiRecommendation>? recs;

    if (content is Map) {
      text = (content['text'] ?? '').toString();
      if (content['recommendations'] is List) {
        recs = (content['recommendations'] as List)
            .whereType<Map>()
            .map(
              (r) => AiRecommendation.fromJson(
                r.map((k, v) => MapEntry(k.toString(), v)),
              ),
            )
            .toList();
      }
    } else if (content is String) {
      text = content;
    }

    return ChatMessage(
      id: json['id']?.toString(),
      isAI: json['senderType'] == 'AI',
      text: text,
      timestamp:
          DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
      recommendations: (recs?.isNotEmpty == true) ? recs : null,
    );
  }
}
