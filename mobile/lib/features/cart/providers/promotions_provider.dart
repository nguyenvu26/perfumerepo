import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/data/auth_repository.dart';

class Promotion {
  final String id;
  final String code;
  final String? description;
  final String discountType;
  final int discountValue;
  final int? minOrderAmount;
  final int? maxDiscount;
  final DateTime endDate;

  Promotion({
    required this.id,
    required this.code,
    this.description,
    required this.discountType,
    required this.discountValue,
    this.minOrderAmount,
    this.maxDiscount,
    required this.endDate,
  });

  factory Promotion.fromJson(Map<String, dynamic> json) {
    return Promotion(
      id: json['id'] as String,
      code: json['code'] as String,
      description: json['description'] as String?,
      discountType: json['discountType'] as String,
      discountValue: json['discountValue'] as int,
      minOrderAmount: json['minOrderAmount'] as int?,
      maxDiscount: json['maxDiscount'] as int?,
      endDate: DateTime.parse(json['endDate'] as String),
    );
  }

  String get displayDiscount {
    if (discountType == 'PERCENTAGE') {
      return 'Giảm $discountValue%';
    }
    final formatted = _formatVND(discountValue);
    return 'Giảm $formatted';
  }

  String get displayDescription {
    if (description != null && description!.isNotEmpty) return description!;
    final base = displayDiscount;
    if (minOrderAmount != null && minOrderAmount! > 0) {
      return '$base cho đơn từ ${_formatVND(minOrderAmount!)}';
    }
    return base;
  }

  static String _formatVND(int amount) {
    final str = amount.toString();
    final buffer = StringBuffer();
    for (var i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) buffer.write('.');
      buffer.write(str[i]);
    }
    buffer.write('đ');
    return buffer.toString();
  }
}

final activePromotionsProvider = FutureProvider<List<Promotion>>((ref) async {
  final repo = ref.watch(authRepositoryProvider);
  try {
    final raw = await repo.getActivePromotions();
    return raw
        .map((e) => Promotion.fromJson(e as Map<String, dynamic>))
        .toList();
  } catch (_) {
    return [];
  }
});
