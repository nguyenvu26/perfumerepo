import 'product_recommendation.dart';

/// Lightweight AI recommendation returned inside a backend AI_RECOMMENDATION message.
class AiRecommendation {
  final String productId;
  final String name;
  final String reason;
  final double price;
  final String brand;
  final String imageUrl;
  final List<String> tags;
  final String variantId;

  const AiRecommendation({
    required this.productId,
    required this.name,
    required this.reason,
    this.price = 0,
    this.brand = '',
    this.imageUrl = '',
    this.tags = const [],
    this.variantId = '',
  });

  factory AiRecommendation.fromJson(Map<String, dynamic> json) {
    return AiRecommendation(
      productId: (json['productId'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      reason: (json['reason'] ?? '').toString(),
      price: (json['price'] is num)
          ? (json['price'] as num).toDouble()
          : double.tryParse(json['price']?.toString() ?? '') ?? 0,
      brand: (json['brand'] ?? '').toString(),
      imageUrl: (json['imageUrl'] ?? '').toString(),
      tags: (json['tags'] is List)
          ? (json['tags'] as List).map((t) => t.toString()).toList()
          : const [],
      variantId: (json['variantId'] ?? '').toString(),
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
